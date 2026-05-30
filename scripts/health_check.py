#!/usr/bin/env python3
"""
Linerup pipeline health checker.

Evaluates the state of every automated component and writes a status
JSON to public/data/health.json. Each check returns OK/WARN/FAIL plus a
short message. The site reads this file to render a /health page.

Runs hourly via cron. Time-sensitive checks are schedule-aware so they
only flag genuine problems, not normal pre-window / off-hours states.
"""
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

REPO = Path("/root/linerup")
MLB_DIR = REPO / "public/data/mlb"
NBA_DIR = REPO / "public/data/nba"
HEALTH_PATH = REPO / "public/data/health.json"


def now_utc():
    return datetime.now(timezone.utc)


def file_age_minutes(path):
    if not path.exists():
        return None
    age = now_utc() - datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
    return age.total_seconds() / 60


def check_today_snapshot(sport_dir, sport, expected_by_hour_utc):
    today = now_utc().strftime("%Y-%m-%d")
    snap = sport_dir / f"snapshot-{today}.json"
    if not snap.exists():
        # The day's snapshot is built mid-morning UTC; before that it is expected to be absent.
        if now_utc().hour < expected_by_hour_utc:
            return {"status": "OK", "msg": f"{sport} snapshot not yet created (due by {expected_by_hour_utc:02d}:00 UTC)"}
        return {"status": "FAIL", "msg": f"{sport} snapshot for {today} is missing"}
    try:
        with snap.open() as f:
            d = json.load(f)
        n = len(d.get("games", []))
        return {"status": "OK", "msg": f"{sport} snapshot exists ({n} games)"}
    except Exception as e:
        return {"status": "FAIL", "msg": f"{sport} snapshot unreadable: {e}"}


def check_live_predictions(sport_dir, sport, active_hours, max_age_min=120):
    p = sport_dir / "predictions.json"
    age = file_age_minutes(p)
    if age is None:
        return {"status": "FAIL", "msg": f"{sport} predictions.json missing"}
    if age > max_age_min:
        # Predictions only regenerate during the game-prep window; stale outside it is normal.
        if now_utc().hour in active_hours:
            return {"status": "WARN", "msg": f"{sport} predictions {age:.0f} min old during active window (script may have failed)"}
        return {"status": "OK", "msg": f"{sport} predictions {age:.0f} min old (outside regen window, expected)"}
    return {"status": "OK", "msg": f"{sport} predictions fresh ({age:.0f} min ago)"}


def check_clv_capture(sport_dir, sport, window_open_hour_utc):
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
    n_games = len(d.get("games", []))
    if n_games == 0:
        return {"status": "OK", "msg": f"{sport} no games today"}
    captured = [g for g in d.get("games", []) if g.get("closing_ml_captured_at")]
    if captured:
        latest = max(g["closing_ml_captured_at"] for g in captured)
        return {"status": "OK", "msg": f"{sport} CLV: {len(captured)}/{n_games} games captured, latest {latest}"}
    # Nothing captured yet is only a concern once the capture window has opened.
    if now_utc().hour < window_open_hour_utc:
        return {"status": "OK", "msg": f"{sport} CLV: pre-capture-window (opens {window_open_hour_utc:02d}:00 UTC)"}
    return {"status": "WARN", "msg": f"{sport} CLV: no games captured yet ({n_games} total, window already open)"}


def check_results(sport_dir, sport):
    """
    Verify the grading script ran recently. results.json may legitimately
    not have changed (no qualifying picks, no snapshot), so the real signal
    is whether the cron fired and what the log says.
    """
    log = Path("/root/linerup-results.log")
    if not log.exists():
        return {"status": "WARN", "msg": f"{sport} grading log missing"}
    log_age = file_age_minutes(log)
    if log_age is None or log_age > 24 * 60:
        return {"status": "FAIL", "msg": f"{sport} grading log not updated in 24h+ (cron may be broken)"}
    try:
        with log.open() as f:
            lines = f.read().splitlines()
    except Exception:
        return {"status": "WARN", "msg": f"{sport} grading log unreadable"}
    marker = "Grading NBA 2026-" if sport == "NBA" else "Grading 2026-"
    idx = -1
    for i in range(len(lines) - 1, -1, -1):
        if lines[i].startswith(marker):
            idx = i
            break
    if idx == -1:
        return {"status": "WARN", "msg": f"{sport} no recent grading attempt found in log"}
    tail = "\n".join(lines[idx:idx + 5])
    if "No snapshot for" in tail or "No NBA snapshot for" in tail:
        return {"status": "WARN", "msg": f"{sport} grading skipped - no snapshot for previous day (pipeline gap)"}
    if "No gradeable picks" in tail or "Nothing to update" in tail:
        return {"status": "OK", "msg": f"{sport} grading ran - no qualifying picks yesterday"}
    if "->" in tail:
        return {"status": "OK", "msg": f"{sport} grading ran successfully"}
    return {"status": "OK", "msg": f"{sport} grading ran (status unclear)"}


def check_starter_detector():
    """MLB-only - has the starter change detector been running?"""
    log = Path("/root/linerup-starter.log")
    age = file_age_minutes(log)
    if age is None:
        return {"status": "WARN", "msg": "starter detector log missing"}
    # Runs at :05 during 16-23 UTC; a stale log outside that window is expected.
    if age > 90:
        if now_utc().hour in set(range(16, 24)):
            return {"status": "WARN", "msg": f"starter detector log {age:.0f} min old during active window"}
        return {"status": "OK", "msg": f"starter detector idle (off-window, {age:.0f} min old)"}
    return {"status": "OK", "msg": f"starter detector log fresh ({age:.0f} min ago)"}


def main():
    mlb_pred_hours = set(range(16, 24)) | {0, 1, 2, 3}
    nba_pred_hours = set(range(17, 24)) | {0, 1, 2, 3}
    checks = {
        "mlb_snapshot":     check_today_snapshot(MLB_DIR, "MLB", expected_by_hour_utc=17),
        "mlb_predictions":  check_live_predictions(MLB_DIR, "MLB", mlb_pred_hours),
        "mlb_clv":          check_clv_capture(MLB_DIR, "MLB", window_open_hour_utc=15),
        "mlb_results":      check_results(MLB_DIR, "MLB"),
        "mlb_starter":      check_starter_detector(),
        "nba_snapshot":     check_today_snapshot(NBA_DIR, "NBA", expected_by_hour_utc=18),
        "nba_predictions":  check_live_predictions(NBA_DIR, "NBA", nba_pred_hours),
        "nba_clv":          check_clv_capture(NBA_DIR, "NBA", window_open_hour_utc=22),
        "nba_results":      check_results(NBA_DIR, "NBA"),
    }

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
