#!/usr/bin/env python3
"""
Snapshot merge with display_tier computation.

Faithful Python port of lib/tier.ts (MLB) and lib/tier-nba.ts (NBA) + the
toDisplayTier mappings from lib/display-tier.ts / display-tier-nba.ts.

Each frozen game gets `display_tier` (LOCK/PLAY/LEAN/PASS) — exactly what
the website showed for that game. The grader uses this directly so the
track record matches what users saw.

Usage: snapshot_merge.py <snapshot_path> <live_path> <commit_message>
"""
import json, sys, subprocess
from pathlib import Path


def compute_ev_raw(win_pct, ml):
    if ml is None:
        return None
    p = win_pct / 100.0
    payout = ml / 100.0 if ml > 0 else 100.0 / abs(ml)
    return p * payout * 100 - (1 - p) * 100


def pick_is_home(g):
    return g.get("pick") == g.get("home_team")


def sharp_confirms_mlb(g):
    sig = g.get("sharp_signal")
    if not sig:
        return False
    s = sig.lower()
    if s == "neutral":
        return False
    return ("home" in s) if pick_is_home(g) else ("away" in s)


def sharp_confirms_nba(g):
    sig = g.get("sharp_signal") or ""
    s = sig.lower()
    if s in ("neutral", "no data"):
        return False
    return ("home" in s) if pick_is_home(g) else ("away" in s)


def contradiction_strength(g):
    """Return how strongly the line move contradicts our pick:
      "none"   — move < 8c against us (noise)
      "mild"   — move 8-14c against us (caution, still allows LEAN)
      "strong" — move >=15c against us (real sharp signal, forces PASS)
    A move "against" the pick means the price on our side got cheaper /
    the other side got bet up.
    """
    lm = g.get("line_move")
    if lm is None:
        return "none"
    # Normalize so positive = move AGAINST our pick
    against = lm if pick_is_home(g) else -lm
    if against >= 15:
        return "strong"
    if against >= 8:
        return "mild"
    return "none"


def line_move_contradicts(g):
    """Back-compat boolean: any mild-or-stronger contradiction.
    Kept so existing callers don't break; new cascade uses strength directly."""
    return contradiction_strength(g) != "none"


def compute_tier_mlb(g):
    """Faithful Python port of computeTier from lib/tier.ts"""
    edge = g.get("edge")
    confidence = g.get("confidence") or 0
    if edge is None:
        return "SKIP"
    if g.get("tbd_flag"):
        return "TBD"
    if g.get("thin_sp"):
        return "THIN SP"
    sharp = sharp_confirms_mlb(g)
    strength = contradiction_strength(g)
    strong_fade = strength == "strong"
    mild_fade = strength == "mild"
    pick_ml = g.get("home_ml") if pick_is_home(g) else g.get("away_ml")
    ev = compute_ev_raw(confidence, pick_ml) if pick_ml is not None else None
    positive_ev = ev is not None and ev > 0
    # FADE: strong contradiction on a big edge, or huge edge with no sharp support
    if (strong_fade and abs(edge) > 8) or (abs(edge) > 15 and not sharp):
        return "FADE"
    # LOCK: 60%+ conf + EV>3 + sharps agree + NO contradiction at all
    if confidence >= 60 and ev is not None and ev > 3 and positive_ev and sharp and strength == "none":
        return "LOCK"
    # BET (PLAY): 60%+ conf + positive EV + no strong/mild fade
    if confidence >= 60 and positive_ev and strength == "none":
        return "BET"
    # BET (PLAY): 58%+ conf + EV>3 + no contradiction
    if confidence >= 58 and ev is not None and ev > 3 and strength == "none":
        return "BET"
    # LEAN: 55%+ conf + EV>2 + no STRONG fade (mild fade still allowed here)
    if confidence >= 55 and ev is not None and ev > 2 and not strong_fade:
        return "LEAN"
    # LEAN (mild-fade survivor): high conf + positive EV picks that only have a
    # MILD fade still earn a cautious LEAN rather than vanishing to PASS.
    if confidence >= 58 and positive_ev and mild_fade:
        return "LEAN"
    return "SKIP"


def compute_tier_nba(g):
    """Faithful Python port of computeNBATier from lib/tier-nba.ts"""
    edge = g.get("edge")
    confidence = g.get("confidence") or 0
    if edge is None:
        return "SKIP"
    sharp = sharp_confirms_nba(g)
    strength = contradiction_strength(g)
    strong_fade = strength == "strong"
    mild_fade = strength == "mild"
    pick_ml = g.get("home_ml") if pick_is_home(g) else g.get("away_ml")
    ev = compute_ev_raw(confidence, pick_ml) if pick_ml is not None else None
    positive_ev = ev is not None and ev > 1
    if (strong_fade and abs(edge) > 8) or (abs(edge) > 15 and not sharp):
        return "FADE"
    if confidence >= 60 and positive_ev and ev > 5 and sharp and strength == "none":
        return "LOCK"
    if confidence >= 60 and positive_ev and strength == "none":
        return "BET"
    if confidence >= 58 and positive_ev and ev > 3 and strength == "none":
        return "BET"
    if confidence >= 55 and positive_ev and ev > 2 and not strong_fade:
        return "LEAN"
    if confidence >= 58 and positive_ev and mild_fade:
        return "LEAN"
    return "SKIP"


def to_display_tier(internal):
    """Mirrors toDisplayTier from lib/display-tier.ts and lib/display-tier-nba.ts"""
    if internal == "LOCK":
        return "LOCK"
    if internal == "BET":
        return "PLAY"
    if internal in ("LEAN", "VALUE"):
        return "LEAN"
    return "PASS"



def maybe_lock_game(g):
    """Freeze pick/tier/ml/confidence for a game if it's within 5 min of first pitch
    (or already started). Once locked, those values never change — used by grader and
    shown as the official call on the site.
    """
    if g.get("is_locked"):
        return  # already locked, never re-lock
    
    gt_str = g.get("game_time")
    if not gt_str:
        return
    
    from datetime import datetime, timezone
    try:
        # Parse ISO format like "2026-05-27T01:40Z"
        gt = datetime.fromisoformat(gt_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return
    
    now = datetime.now(timezone.utc)
    minutes_to_game = (gt - now).total_seconds() / 60
    
    # Lock if game starts within 5 min OR has already started
    if minutes_to_game <= 5:
        is_home_pick = g.get("pick") == g.get("home_team")
        pick_ml = g.get("home_ml") if is_home_pick else g.get("away_ml")
        
        g["is_locked"] = True
        g["locked_at"] = now.strftime("%Y-%m-%d %H:%M:%S UTC")
        g["locked_pick"] = g.get("pick")
        g["locked_pick_ml"] = pick_ml
        g["locked_confidence"] = g.get("confidence")
        g["locked_edge"] = g.get("edge")
        g["locked_display_tier"] = g.get("display_tier")
        g["locked_home_ml"] = g.get("home_ml")
        g["locked_away_ml"] = g.get("away_ml")
        g["locked_home_pitcher"] = g.get("home_pitcher")
        g["locked_away_pitcher"] = g.get("away_pitcher")
        g["locked_sharp_signal"] = g.get("sharp_signal")
        g["locked_line_move"] = g.get("line_move")
        print(f"  🔒 LOCKED: {g['away_team']} @ {g['home_team']} | {g['locked_display_tier']} {g['locked_pick']} ({pick_ml})")


def compute_display_tier(game, sport):
    internal = compute_tier_mlb(game) if sport == "mlb" else compute_tier_nba(game)
    return to_display_tier(internal)


def annotate(data, sport):
    for g in data.get("games", []):
        g["display_tier"] = compute_display_tier(g, sport)


def main():
    snapshot_path = Path(sys.argv[1])
    live_path     = Path(sys.argv[2])
    commit_msg    = sys.argv[3]

    sport = "mlb" if "/mlb/" in str(snapshot_path) else "nba"

    live_data = json.loads(live_path.read_text())
    annotate(live_data, sport)

    if not snapshot_path.exists():
        snapshot_path.write_text(json.dumps(live_data, indent=2))
        print(f"Snapshot created: {snapshot_path}")
    else:
        snap_data = json.loads(snapshot_path.read_text())
        existing_keys = {f"{g['away_team']}|{g['home_team']}" for g in snap_data["games"]}

        added = 0
        for g in live_data["games"]:
            key = f"{g['away_team']}|{g['home_team']}"
            if key not in existing_keys:
                snap_data["games"].append(g)
                existing_keys.add(key)
                added += 1

        # Re-compute display_tier on EVERY existing game (not just missing ones)
        # This ensures any older snapshots get the corrected tier on next merge.
        for g in snap_data["games"]:
            g["display_tier"] = compute_display_tier(g, sport)

        snapshot_path.write_text(json.dumps(snap_data, indent=2))
        print(f"Snapshot updated: {added} added, display_tier refreshed on all games")

    repo = "/root/linerup"
    rel_path = str(snapshot_path).replace(f"{repo}/", "")
    subprocess.run(["git", "-C", repo, "add", "-f", rel_path])
    result = subprocess.run(["git", "-C", repo, "diff", "--cached", "--quiet"])
    if result.returncode != 0:
        subprocess.run(["git", "-C", repo, "commit", "-m", f"auto: {commit_msg}"])
        subprocess.run(["git", "-C", repo, "push"])
        print("Pushed to git")
    else:
        print("No changes to commit")


if __name__ == "__main__":
    main()
