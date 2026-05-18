import fs from "fs/promises";
import path from "path";
import type { NBAPredictionsData } from "./types-nba";
import type { ResultsData } from "./types";

export async function getNBAPredictions(): Promise<NBAPredictionsData> {
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    "nba",
    "predictions.json"
  );
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as NBAPredictionsData;
}

const EMPTY_RESULTS: ResultsData = {
  model_version: "V6",
  last_updated: "",
  tracking_start_date: "",
  results: [],
};

export async function getNBAResults(): Promise<ResultsData> {
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    "nba",
    "results.json"
  );
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as ResultsData;
  } catch {
    return EMPTY_RESULTS;
  }
}
