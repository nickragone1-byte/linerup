#!/usr/bin/env python3
"""
NBA CLV capture script.

Same logic as MLB capture: for each game in today's snapshot reported as 'pre',
overwrite closing_ml_home / closing_ml_away with the latest available line.
Once a game flips to 'in'/'post', ESPN drops the odds object, and the last
captured value is preserved as the closing line.

NBA differences from MLB:
  - URL: basketball/nba/scoreboard
  - ESPN exposes odds under moneyline.home.close.odds (string), no 'current' field
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
import urllib.request

SNAPSHOT_DIR = Path("/root/linerup/public/data/nba")
ESPN_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"


def fetch_espn():
    with urllib.request.urlopen(ESPN_URL, timeout=15) as r:
        return json.loads(r.read())


def normalize_team(name: str) -> str:
    return " ".join(name.strip().split()).lower()


def parse_ml(side):
    """NBA stores odds as string in close.odds (no 'current' present)."""
    if not side:
        return None
    close = side.get("close") or {}
    raw = close.get("odds")
    if raw is None:
        cur = side.get("current") or {}
        raw = cur.get("odds")
    if raw is None:
        return None
    try:
        return int(str(raw).replace("+", ""))
    except (ValueError, TypeError):
        return None


def get_ml_pair(event):
    state = event.get("status", {}).get("type", {}).get("state", "?")
    comps = event.get("competitions", [])
    if not comps:
        return state, None, None
    odds = comps[0].get("odds", [])
    if not odds:
        return state, None, None
    ml = odds[0].get("moneyline", {})
    return state, parse_ml(ml.get("home")), parse_ml(ml.get("away"))


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

    espn_by_home = {}
    for ev in espn.get("events", []):
        comps = ev.get("competitions", [])
        if not comps:
            continue
        home_name = None
        for c in comps[0].get("competitors", []):
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
