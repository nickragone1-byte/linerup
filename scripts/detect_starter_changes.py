#!/usr/bin/env python3
"""
Starter-change detector.

Runs hourly after the R script updates predictions.json. For each game in
today's snapshot, compares snapshot starters vs current live predictions.
If they differ, flags the game with:
  - starter_changed_home / starter_changed_away (bool)
  - original_home_pitcher / original_away_pitcher (snapshot value)
  - current_home_pitcher / current_away_pitcher (live value)

The locked pick is NOT changed — track record integrity comes first.
The UI surfaces the warning so users know conditions moved post-lock.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

SNAPSHOT_DIR = Path("/root/linerup/public/data/mlb")


def normalize_pitcher(name):
    """Treat None/empty/'TBD' all as None so we don't flag 'TBD -> Joe Smith' as a change."""
    if not name:
        return None
    n = name.strip()
    if n.upper() in ("TBD", "TBA", ""):
        return None
    return n


def main():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    snap_path = SNAPSHOT_DIR / f"snapshot-{today}.json"
    live_path = SNAPSHOT_DIR / "predictions.json"

    if not snap_path.exists():
        print(f"No snapshot for {today} — nothing to check.")
        return 0
    if not live_path.exists():
        print(f"No live predictions.json — nothing to compare.")
        return 0

    with snap_path.open() as f:
        snap = json.load(f)
    with live_path.open() as f:
        live = json.load(f)

    # Build live lookup keyed by away|home
    live_by_key = {}
    for g in live.get("games", []):
        key = f"{g.get('away_team')}|{g.get('home_team')}"
        live_by_key[key] = g

    flagged = 0
    for game in snap.get("games", []):
        key = f"{game.get('away_team')}|{game.get('home_team')}"
        live_g = live_by_key.get(key)
        if not live_g:
            # Game no longer in live feed — likely started already, can't compare.
            continue

        snap_home = normalize_pitcher(game.get("home_pitcher"))
        snap_away = normalize_pitcher(game.get("away_pitcher"))
        live_home = normalize_pitcher(live_g.get("home_pitcher"))
        live_away = normalize_pitcher(live_g.get("away_pitcher"))

        home_changed = (
            snap_home is not None
            and live_home is not None
            and snap_home != live_home
        )
        away_changed = (
            snap_away is not None
            and live_away is not None
            and snap_away != live_away
        )

        # Only write if something changed OR clear existing flag if no longer changed
        if home_changed or away_changed:
            game["starter_changed_home"] = home_changed
            game["starter_changed_away"] = away_changed
            if home_changed:
                game["original_home_pitcher"] = snap_home
                game["current_home_pitcher"] = live_home
            if away_changed:
                game["original_away_pitcher"] = snap_away
                game["current_away_pitcher"] = live_away
            game["starter_change_detected_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
            flagged += 1
            print(f"  CHANGED: {game['away_team']} @ {game['home_team']}")
            if home_changed:
                print(f"    HOME: {snap_home} -> {live_home}")
            if away_changed:
                print(f"    AWAY: {snap_away} -> {live_away}")

    if flagged > 0:
        with snap_path.open("w") as f:
            json.dump(snap, f, indent=2)
        print(f"\nFlagged {flagged} game(s) with starter changes.")
    else:
        print("No starter changes detected.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
