import fs from "fs/promises";
import path from "path";
import type { PredictionsData, DayResult } from "./types";

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

export async function getResults(sport: string): Promise<DayResult[]> {
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    sport,
    "results.json"
  );
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as DayResult[];
  } catch {
    return [];
  }
}
