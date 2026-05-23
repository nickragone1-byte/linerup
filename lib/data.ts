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

  // Check for today's snapshot
  const today = new Date().toISOString().split("T")[0];
  const snapshotPath = path.join(dataDir, `snapshot-${today}.json`);
  const hasSnapshot = await fileExists(snapshotPath);

  // Load live predictions
  const liveRaw = await fs.readFile(livePath, "utf-8");
  const live = JSON.parse(liveRaw) as PredictionsData;

  // If no snapshot yet, just return live
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

    // If game still in live feed, update lines/EV but keep snapshot pick/tier
    if (liveGame && liveGame.away_ml != null) {
      return {
        ...snapGame,
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

    // Game no longer in live feed (started/finished) — show frozen snapshot card
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
