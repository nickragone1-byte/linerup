import fs from "fs/promises";
import path from "path";
import type { PredictionsData, ResultsData } from "./types";

export async function getPredictions(sport: string): Promise<PredictionsData> {
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    sport,
    "predictions.json"
  );
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as PredictionsData;
}

const MODEL_VERSIONS: Record<string, string> = {
  mlb: "V8",
  nba: "V6",
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
      model_version: MODEL_VERSIONS[sport] ?? "V8",
      last_updated: "",
      tracking_start_date: "",
      results: [],
    };
  }
}
