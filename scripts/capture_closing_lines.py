#!/usr/bin/env python3
"""
CLV capture script.

Runs every ~10 minutes during MLB hours. For each game in today's snapshot:
  - If ESPN reports the game as 'pre' (not started), overwrite closing_ml_home
    and closing_ml_away with the latest line. This keeps capturing the line
    movement right up until first pitch.
  - If the game is no longer 'pre' in ESPN, leave existing values alone —
    the last captured line IS the closing line for CLV purposes.

CLV (in cents) is computed at grading time from:
  CLV = (line we locked at snapshot) - (line at close)
A positive value = our locked price was better than close = we got value.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
import urllib.request

SNAPSHOT_DIR = Path("/root/linerup/public/data/mlb")
ESPN_URL = "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard"


def fetch_espn():
    with urllib.request.urlopen(ESPN_URL, timeout=15) as r:
        return json.loads(r.read())


def normalize_team(name: str) -> str:
    """Strip and lowercase for comparison; handles 'Athletics Athletics' weirdness."""
    parts = name.strip().split()
    seen = []
    for p in parts:
        if not seen or seen[-1].lower() != p.lower():
            seen.append(p)
    return " ".join(seen).lower()


def get_ml_pair(event):
    """Return (state, home_ml, away_ml) or (state, None, None) if odds unavailable."""
    state = event.get("status", {}).get("type", {}).get("state", "?")
    comps = event.get("competitions", [])
    if not comps:
        return state, None, None
    odds = comps[0].get("odds", [])
    if not odds:
        return state, None, None
    ml = odds[0].get("moneyline", {})
    h = ml.get("home", {}) or {}
    a = ml.get("away", {}) or {}

    def pick(side):
        cur = side.get("current") or {}
        if cur.get("odds") is not None:
            try:
                return int(cur["odds"])
            except (ValueError, TypeError):
                pass
        clo = side.get("close") or {}
        if clo.get("odds") is not None:
            try:
                return int(clo["odds"])
            except (ValueError, TypeError):
                pass
        return None

    return state, pick(h), pick(a)


def main():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    snap_path = SNAPSHOT_DIR / f"snapshot-{today}.json"
    if not snap_path.exists():
        print(f"No snapshot for {today} — nothing to update.")
        return 0

    with snap_path.open() as f:
        snap = json.load(f)

    try:
        espn = fetch_espn()
    except Exception as e:
        print(f"ESPN fetch failed: {e}")
        return 1

    # Build lookup: normalized home team name -> (state, h_ml, a_ml)
    espn_by_home = {}
    for ev in espn.get("events", []):
        comps = ev.get("competitions", [])
        if not comps:
            continue
        competitors = comps[0].get("competitors", [])
        home_name = None
        for c in competitors:
            if c.get("homeAway") == "home":
                home_name = c.get("team", {}).get("displayName")
                break
        if not home_name:
            continue
        state, h_ml, a_ml = get_ml_pair(ev)
        espn_by_home[normalize_team(home_name)] = (state, h_ml, a_ml)

    updated = 0
    skipped_not_pre = 0
    skipped_no_match = 0

    for game in snap.get("games", []):
        key = normalize_team(game["home_team"])
        match = espn_by_home.get(key)
        if not match:
            skipped_no_match += 1
            continue
        state, h_ml, a_ml = match
        if state != "pre":
            skipped_not_pre += 1
            continue
        if h_ml is None or a_ml is None:
            continue
        # Update closing lines (will keep getting overwritten until game starts)
        game["closing_ml_home"] = h_ml
        game["closing_ml_away"] = a_ml
        game["closing_ml_captured_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        updated += 1

    if updated > 0:
        with snap_path.open("w") as f:
            json.dump(snap, f, indent=2)
        print(f"Updated closing lines for {updated} game(s). "
              f"Skipped: {skipped_not_pre} (already started), {skipped_no_match} (no ESPN match).")
    else:
        print(f"No updates. {skipped_not_pre} already started, {skipped_no_match} no match.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
