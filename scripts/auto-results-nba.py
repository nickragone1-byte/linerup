#!/usr/bin/env python3
import json
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO = Path("/root/linerup")
NBA_DATA = REPO / "public/data/nba"
RESULTS_PATH = NBA_DATA / "results.json"

def fetch_espn_scores(date_str):
    url = f"https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates={date_str}&limit=20"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"ESPN fetch error: {e}")
        return None

def get_winner(event):
    if event.get("status", {}).get("type", {}).get("completed") != True:
        return None, None
    competitors = event.get("competitions", [{}])[0].get("competitors", [])
    home = away = None
    home_score = away_score = 0
    for c in competitors:
        name = c.get("team", {}).get("displayName", "")
        score = int(c.get("score", 0))
        if c.get("homeAway") == "home":
            home, home_score = name, score
        else:
            away, away_score = name, score
    winner = home if home_score > away_score else (away if away_score > home_score else None)
    return winner, f"{away} {away_score}, {home} {home_score}"

def normalize(name):
    return name.lower().strip().split()[-1]

def compute_ev(confidence, ml):
    p = confidence / 100
    if ml > 0:
        return p * (ml / 100) * 100 - (1 - p) * 100
    else:
        return p * (100 / abs(ml)) * 100 - (1 - p) * 100

def grade_picks(yesterday_str, date_str_espn):
    snapshot_path = NBA_DATA / f"snapshot-{yesterday_str}.json"
    if not snapshot_path.exists():
        print(f"No NBA snapshot for {yesterday_str}")
        return []

    with open(snapshot_path) as f:
        snapshot = json.load(f)

    # NEW: use display_tier from snapshot — the truth of what the site showed.
    gradeable = []
    for g in snapshot.get("games", []):
        pick = g.get("pick")
        pick_ml = g.get("home_ml") if pick == g.get("home_team") else g.get("away_ml")
        if pick_ml is None:
            continue
        display_tier = g.get("locked_display_tier") or g.get("display_tier")
        if display_tier is not None:
            if display_tier in ("PLAY", "LOCK"):
                tier = "PLAY"
            elif display_tier == "LEAN":
                tier = "LEAN"
            else:
                continue
        else:
            edge = g.get("edge")
            confidence = g.get("confidence", 0)
            if edge is None:
                continue
            ev = compute_ev(confidence, pick_ml)
            if confidence >= 58 and ev > 0:
                tier = "PLAY"
            elif confidence >= 55 and ev > 0:
                tier = "LEAN"
            else:
                continue
        gradeable.append((g, tier))

    if not gradeable:
        print(f"No gradeable NBA picks for {yesterday_str}")
        return []

    espn_data = fetch_espn_scores(date_str_espn)
    if not espn_data:
        print("Could not fetch ESPN NBA scores")
        return []

    winner_map = {}
    for event in espn_data.get("events", []):
        comps = event.get("competitions", [{}])[0].get("competitors", [])
        names = {}
        for c in comps:
            names[c.get("homeAway")] = c.get("team", {}).get("displayName", "")
        key = f"{normalize(names.get('away',''))}|{normalize(names.get('home',''))}"
        winner, score_str = get_winner(event)
        winner_map[key] = (winner, score_str)

    new_records = []
    for g, tier in gradeable:
        key = f"{normalize(g['away_team'])}|{normalize(g['home_team'])}"
        if key not in winner_map:
            print(f"  No ESPN match for {g['away_team']} @ {g['home_team']}")
            continue
        winner, score_str = winner_map[key]
        pick = g["pick"]
        if winner is None:
            outcome = "PUSH"
        elif normalize(winner) == normalize(pick):
            outcome = "WIN"
        else:
            outcome = "LOSS"
        is_home_pick = pick == g.get("home_team")
        pick_ml = g.get("home_ml") if is_home_pick else g.get("away_ml")
        ml_str = f"+{pick_ml}" if pick_ml and pick_ml > 0 else str(pick_ml)

        # CLV: lock price - closing price, on the side we picked.
        # Positive cents = our locked line was better than the close (got value).
        close_ml = g.get("closing_ml_home") if is_home_pick else g.get("closing_ml_away")
        clv_cents = None
        beat_close = None
        if pick_ml is not None and close_ml is not None:
            clv_cents = pick_ml - close_ml
            beat_close = clv_cents > 0

        record = {
            "date": yesterday_str,
            "matchup": f"{g['away_team']} @ {g['home_team']}",
            "away_team": g["away_team"],
            "home_team": g["home_team"],
            "tier": tier,
            "pick": f"{pick} ML ({ml_str})",
            "model_prob": round(g.get("confidence", 0) / 100, 3),
            "edge": round(g.get("edge", 0), 1),
            "confidence_weight": round(g.get("confidence", 50) / 100 - 0.5, 3),
            "outcome": outcome,
            "final_score": score_str,
            "the_read": g.get("the_read", ""),
            "lock_ml": pick_ml,
            "closing_ml": close_ml,
            "clv_cents": clv_cents,
            "beat_close": beat_close
        }
        print(f"  {pick} ({tier}) -> {outcome} | {score_str}")
        new_records.append(record)

    return new_records

def update_results(new_records, yesterday_str):
    with open(RESULTS_PATH) as f:
        results = json.load(f)
    results["results"] = [r for r in results["results"] if r["date"] != yesterday_str]
    results["results"].extend(new_records)
    results["results"].sort(key=lambda r: r["date"], reverse=True)
    results["last_updated"] = yesterday_str
    with open(RESULTS_PATH, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Done: {len(new_records)} NBA records for {yesterday_str}")

def main():
    # Respect tracking_start_date from results.json — never grade picks from before the reset
    with open(RESULTS_PATH) as f:
        results_data = json.load(f)
    tracking_start = results_data.get("tracking_start_date", "2026-05-27")

    now_et = datetime.now(timezone.utc) - timedelta(hours=4)
    yesterday = now_et - timedelta(days=1)
    yesterday_str = yesterday.strftime("%Y-%m-%d")
    date_str_espn = yesterday.strftime("%Y%m%d")

    if yesterday_str < tracking_start:
        print(f"Skipping NBA {yesterday_str} — before tracking_start ({tracking_start})")
        return

    print(f"Grading NBA {yesterday_str}...")
    records = grade_picks(yesterday_str, date_str_espn)
    if records:
        update_results(records, yesterday_str)
    else:
        print("Nothing to update")

if __name__ == "__main__":
    main()
