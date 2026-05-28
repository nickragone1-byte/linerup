import fs from "fs/promises";
import path from "path";
import type { PredictionsData, ResultsData, Game } from "./types";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function getPredictions(sport: string): Promise<PredictionsData> {
  const dataDir = path.join(process.cwd(), "public", "data", sport);
  const livePath = path.join(dataDir, "predictions.json");

  // Today in ET — using Intl.DateTimeFormat so DST transitions are handled correctly.
  // en-CA locale formats dates as YYYY-MM-DD natively.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  let snapshotPath = path.join(dataDir, `snapshot-${today}.json`);
  let hasSnapshot = await fileExists(snapshotPath);

  // Fallback: if today's snapshot doesn't exist yet (e.g. between midnight ET and
  // the 9:30 AM PT freeze), use the most recent snapshot up to 2 days back.
  if (!hasSnapshot) {
    for (let i = 1; i <= 2; i++) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const fallback = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d);
      const fallbackPath = path.join(dataDir, `snapshot-${fallback}.json`);
      if (await fileExists(fallbackPath)) {
        snapshotPath = fallbackPath;
        hasSnapshot = true;
        break;
      }
    }
  }

  // Load live predictions
  const liveRaw = await fs.readFile(livePath, "utf-8");
  const live = JSON.parse(liveRaw) as PredictionsData;

  // If still no snapshot found, return live (very first day of operation)
  if (!hasSnapshot) return live;

  // Load snapshot (frozen picks/tiers)
  const snapRaw = await fs.readFile(snapshotPath, "utf-8");
  const snapshot = JSON.parse(snapRaw) as PredictionsData;

  // Merge: use snapshot games as base, update lines/EV from live for matching games
  const liveMap = new Map<string, Game>();
  for (const g of live.games) {
    const key = `${g.away_team}|${g.home_team}`;
    liveMap.set(key, g);
  }

  const mergedGames = snapshot.games.map((snapGame) => {
    const key = `${snapGame.away_team}|${snapGame.home_team}`;
    const liveGame = liveMap.get(key);

    // LOCKED game: keep all frozen locked_* values (the official call).
    // Still surface live lines for information, but the pick/tier/pitcher
    // are frozen and must not change.
    if (snapGame.is_locked) {
      if (liveGame && liveGame.away_ml != null) {
        return {
          ...snapGame,
          // live lines for info only — locked_* fields drive grading + display
          away_ml: liveGame.away_ml,
          home_ml: liveGame.home_ml,
          ml_open_home: liveGame.ml_open_home,
          line_move: liveGame.line_move,
          sharp_signal: liveGame.sharp_signal,
          over_under: liveGame.over_under,
          vegas_prob_home: liveGame.vegas_prob_home,
          edge: liveGame.edge,
        };
      }
      return snapGame;
    }

    // UNLOCKED game still in the live feed: take the FULL live model state
    // (pitcher, SIERA, confidence, pick, model probs, edge — everything),
    // so the page shows the latest and greatest until the game locks.
    if (liveGame && liveGame.away_ml != null) {
      return {
        ...snapGame,
        // model inputs (the fix — these used to stay stale)
        home_pitcher: liveGame.home_pitcher,
        away_pitcher: liveGame.away_pitcher,
        home_sp_siera: liveGame.home_sp_siera,
        away_sp_siera: liveGame.away_sp_siera,
        home_sp_ip: liveGame.home_sp_ip,
        away_sp_ip: liveGame.away_sp_ip,
        home_sp_weight: liveGame.home_sp_weight,
        away_sp_weight: liveGame.away_sp_weight,
        model_prob_home: liveGame.model_prob_home,
        final_prob_home: liveGame.final_prob_home,
        pick: liveGame.pick,
        confidence: liveGame.confidence,
        tbd_flag: liveGame.tbd_flag,
        thin_sp: liveGame.thin_sp,
        the_read: liveGame.the_read,
        display_tier: liveGame.display_tier ?? snapGame.display_tier,
        // lines
        away_ml: liveGame.away_ml,
        home_ml: liveGame.home_ml,
        ml_open_home: liveGame.ml_open_home,
        line_move: liveGame.line_move,
        sharp_signal: liveGame.sharp_signal,
        over_under: liveGame.over_under,
        vegas_prob_home: liveGame.vegas_prob_home,
        edge: liveGame.edge,
      };
    }

    // Game no longer in live feed (started/finished) but not locked —
    // show frozen snapshot card as last resort
    return snapGame;
  });

  return {
    ...snapshot,
    games: mergedGames,
  };
}

const MODEL_VERSIONS: Record<string, string> = {
  mlb: "V10",
  nba: "V7",
};

export async function getResults(sport: string): Promise<ResultsData> {
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    sport,
    "results.json"
  );
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as ResultsData;
  } catch {
    return {
      model_version: MODEL_VERSIONS[sport] ?? "V10",
      last_updated: "",
      tracking_start_date: "",
      results: [],
    };
  }
}
