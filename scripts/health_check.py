#!/usr/bin/env python3
"""
Linerup pipeline health checker.

Evaluates the state of every automated component and writes a status
JSON to public/data/health.json. Checks are intentionally simple —
each returns OK/WARN/FAIL plus a short message. The site reads this
file to render a /health page.

Runs hourly via cron.
"""
import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

REPO = Path("/root/linerup")
MLB_DIR = REPO / "public/data/mlb"
NBA_DIR = REPO / "public/data/nba"
HEALTH_PATH = REPO / "public/data/health.json"


def now_utc():
    return datetime.now(timezone.utc)


def file_age_minutes(path: Path):
    if not path.exists():
        return None
    age = now_utc() - datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
    return age.total_seconds() / 60


def check_today_snapshot(sport_dir: Path, sport: str):
    today = now_utc().strftime("%Y-%m-%d")
    snap = sport_dir / f"snapshot-{today}.json"
    if not snap.exists():
        # Before 9:30 AM PT snapshot is expected to be missing
        hour_pt = (now_utc() - timedelta(hours=7)).hour  # rough PT
        if hour_pt < 10:
            return {"status": "OK", "msg": f"{sport} snapshot not yet created (before 9:30 AM PT)"}
        return {"status": "FAIL", "msg": f"{sport} snapshot for {today} is missing"}
    try:
        with snap.open() as f:
            d = json.load(f)
        n = len(d.get("games", []))
        return {"status": "OK", "msg": f"{sport} snapshot exists ({n} games)"}
    except Exception as e:
        return {"status": "FAIL", "msg": f"{sport} snapshot unreadable: {e}"}


def check_live_predictions(sport_dir: Path, sport: str, max_age_min: int = 90):
    p = sport_dir / "predictions.json"
    age = file_age_minutes(p)
    if age is None:
        return {"status": "FAIL", "msg": f"{sport} predictions.json missing"}
    if age > max_age_min:
        return {"status": "WARN", "msg": f"{sport} predictions.json is {age:.0f} min old (script may have failed)"}
    return {"status": "OK", "msg": f"{sport} predictions fresh ({age:.0f} min ago)"}


def check_clv_capture(sport_dir: Path, sport: str):
    """Look for closing_ml_captured_at on any game in today's snapshot."""
    today = now_utc().strftime("%Y-%m-%d")
    snap = sport_dir / f"snapshot-{today}.json"
    if not snap.exists():
        return {"status": "OK", "msg": f"{sport} CLV check skipped (no snapshot yet)"}
    try:
        with snap.open() as f:
            d = json.load(f)
    except Exception:
        return {"status": "FAIL", "msg": f"{sport} snapshot unreadable for CLV check"}
    captured = [g for g in d.get("games", []) if g.get("closing_ml_captured_at")]
    pre_count = sum(
        1 for g in d.get("games", [])
        if g.get("closing_ml_home") is None and g.get("closing_ml_away") is None
    )
    n_games = len(d.get("games", []))
    if n_games == 0:
        return {"status": "OK", "msg": f"{sport} no games today"}
    if captured:
        latest = max(g["closing_ml_captured_at"] for g in captured)
        return {"status": "OK", "msg": f"{sport} CLV: {len(captured)}/{n_games} games captured, latest {latest}"}
    return {"status": "WARN", "msg": f"{sport} CLV: no games captured yet ({n_games} total, may be pre-capture-window)"}


def check_results(sport_dir: Path, sport: str):
    """
    Verify the grading script ran today. results.json may legitimately
    not have been modified (no qualifying picks, no snapshot yesterday),
    so the real signal is whether the cron fired and what the log says.
    """
    log = Path("/root/linerup-results.log")
    if not log.exists():
        return {"status": "WARN", "msg": f"{sport} grading log missing"}
    log_age = file_age_minutes(log)
    # Grading runs at 14:00 UTC daily. Should be < 24h since last run.
    if log_age is None or log_age > 24 * 60:
        return {"status": "FAIL", "msg": f"{sport} grading log not updated in 24h+ (cron may be broken)"}

    # Read recent log entries to see what the latest run did
    try:
        with log.open() as f:
            lines = f.read().splitlines()
    except Exception:
        return {"status": "WARN", "msg": f"{sport} grading log unreadable"}

    # Find latest sport-specific block (last 100 lines is enough)
    sport_marker_mlb = "Grading 2026-"
    sport_marker_nba = "Grading NBA 2026-"
    marker = sport_marker_nba if sport == "NBA" else sport_marker_mlb
    # We want the most recent occurrence of this marker
    idx = -1
    for i in range(len(lines) - 1, -1, -1):
        if lines[i].startswith(marker):
            idx = i
            break
    if idx == -1:
        return {"status": "WARN", "msg": f"{sport} no recent grading attempt found in log"}

    # Look at the next few lines for the outcome
    tail = "\n".join(lines[idx:idx + 5])
    if "No snapshot for" in tail or "No NBA snapshot for" in tail:
        return {"status": "WARN", "msg": f"{sport} grading skipped — no snapshot for previous day (pipeline gap)"}
    if "No gradeable picks" in tail or "Nothing to update" in tail:
        return {"status": "OK", "msg": f"{sport} grading ran — no qualifying picks to grade yesterday"}
    if "->" in tail:  # winner arrow indicates grading happened
        return {"status": "OK", "msg": f"{sport} grading ran successfully"}
    return {"status": "OK", "msg": f"{sport} grading ran (status unclear)"}


def check_starter_detector():
    """MLB-only — has the starter change detector been running?"""
    log = Path("/root/linerup-starter.log")
    if not log.exists():
        return {"status": "WARN", "msg": "starter detector log missing"}
    age = file_age_minutes(log)
    if age is None or age > 90:
        return {"status": "WARN", "msg": f"starter detector log is {age:.0f} min old"}
    return {"status": "OK", "msg": f"starter detector log fresh ({age:.0f} min ago)"}


def main():
    checks = {
        "mlb_snapshot":     check_today_snapshot(MLB_DIR, "MLB"),
        "mlb_predictions":  check_live_predictions(MLB_DIR, "MLB"),
        "mlb_clv":          check_clv_capture(MLB_DIR, "MLB"),
        "mlb_results":      check_results(MLB_DIR, "MLB"),
        "mlb_starter":      check_starter_detector(),
        "nba_snapshot":     check_today_snapshot(NBA_DIR, "NBA"),
        "nba_predictions":  check_live_predictions(NBA_DIR, "NBA", max_age_min=120),
        "nba_clv":          check_clv_capture(NBA_DIR, "NBA"),
        "nba_results":      check_results(NBA_DIR, "NBA"),
    }

    # Overall status = worst of all
    statuses = [c["status"] for c in checks.values()]
    if "FAIL" in statuses:
        overall = "FAIL"
    elif "WARN" in statuses:
        overall = "WARN"
    else:
        overall = "OK"

    out = {
        "generated_at": now_utc().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "overall": overall,
        "checks": checks,
    }
    HEALTH_PATH.parent.mkdir(parents=True, exist_ok=True)
    with HEALTH_PATH.open("w") as f:
        json.dump(out, f, indent=2)

    print(f"Overall: {overall}")
    for k, c in checks.items():
        print(f"  [{c['status']:4}] {k}: {c['msg']}")
    return 0 if overall != "FAIL" else 1


if __name__ == "__main__":
    main()
