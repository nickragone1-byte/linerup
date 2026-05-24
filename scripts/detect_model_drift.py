#!/usr/bin/env python3
"""
Live model drift detector.

Runs hourly after the R script updates predictions.json. For each game
in today's snapshot, compares live model state (current predictions.json)
to the locked snapshot pick. If the live model has materially diverged,
writes live_* fields onto the snapshot for the UI to surface.

The snapshot pick STAYS LOCKED. This is purely informational — users
see what the model would say right now, alongside what it said at lock.
Track record always grades the locked pick.

Material divergence is any of:
  - Live pick differs from snapshot pick
  - Live confidence differs by >=3 percentage points
  - Live edge differs by >=4 percentage points

When divergence drops below all thresholds, live_* fields are cleared
so stale data doesn't linger.

Usage: detect_model_drift.py [mlb|nba]
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

CONF_THRESHOLD = 3.0   # percentage points
EDGE_THRESHOLD = 4.0   # percentage points

def main(sport: str):
    snap_dir = Path(f"/root/linerup/public/data/{sport}")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    snap_path = snap_dir / f"snapshot-{today}.json"
    live_path = snap_dir / "predictions.json"

    if not snap_path.exists():
        print(f"No {sport.upper()} snapshot for {today} — nothing to check.")
        return 0
    if not live_path.exists():
        print(f"No {sport.upper()} predictions.json — nothing to compare.")
        return 0

    with snap_path.open() as f:
        snap = json.load(f)
    with live_path.open() as f:
        live = json.load(f)

    live_by_key = {f"{g.get('away_team')}|{g.get('home_team')}": g for g in live.get("games", [])}

    diverged = 0
    cleared = 0
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    for game in snap.get("games", []):
        key = f"{game.get('away_team')}|{game.get('home_team')}"
        lg = live_by_key.get(key)
        if not lg:
            # Game no longer in live feed — likely started. Don't touch.
            continue

        snap_pick = game.get("pick")
        snap_conf = game.get("confidence")
        snap_edge = game.get("edge")
        live_pick = lg.get("pick")
        live_conf = lg.get("confidence")
        live_edge = lg.get("edge")

        # Can't compare if either side missing essentials
        if snap_pick is None or snap_conf is None:
            continue
        if live_pick is None or live_conf is None:
            continue

        pick_changed = live_pick != snap_pick

        try:
            conf_delta = abs(float(live_conf) - float(snap_conf))
        except (TypeError, ValueError):
            conf_delta = 0.0

        try:
            edge_delta = abs(float(live_edge) - float(snap_edge)) if (snap_edge is not None and live_edge is not None) else 0.0
        except (TypeError, ValueError):
            edge_delta = 0.0

        is_diverged = (
            pick_changed
            or conf_delta >= CONF_THRESHOLD
            or edge_delta >= EDGE_THRESHOLD
        )

        if is_diverged:
            game["live_pick"] = live_pick
            game["live_confidence"] = live_conf
            game["live_edge"] = live_edge
            game["live_model_diverged"] = True
            game["live_pick_changed"] = pick_changed
            game["live_updated_at"] = now
            diverged += 1
            print(f"  DIVERGED [{sport.upper()}]: {game['away_team']} @ {game['home_team']}")
            print(f"    Snap: {snap_pick} ({snap_conf:.1f}%, edge {snap_edge})")
            print(f"    Live: {live_pick} ({float(live_conf):.1f}%, edge {live_edge})")
        else:
            # Clear stale drift fields if convergence returned
            if game.get("live_model_diverged"):
                for k in ("live_pick","live_confidence","live_edge",
                         "live_model_diverged","live_pick_changed","live_updated_at"):
                    game.pop(k, None)
                cleared += 1

    if diverged > 0 or cleared > 0:
        with snap_path.open("w") as f:
            json.dump(snap, f, indent=2)
        print(f"\n[{sport.upper()}] Diverged: {diverged}. Cleared (re-converged): {cleared}.")
    else:
        print(f"[{sport.upper()}] No material drift detected.")

    return 0


if __name__ == "__main__":
    sport = sys.argv[1].lower() if len(sys.argv) > 1 else "mlb"
    if sport not in ("mlb", "nba"):
        print("Usage: detect_model_drift.py [mlb|nba]")
        sys.exit(1)
    sys.exit(main(sport))
