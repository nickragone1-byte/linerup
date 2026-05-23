import type { NBAGame, NBATier } from "./types-nba";

function pickIsHome(game: NBAGame): boolean {
  return game.pick === game.home_team;
}

function sharpConfirms(game: NBAGame): boolean {
  const signal = game.sharp_signal.toLowerCase();
  if (signal === "neutral" || signal === "no data") return false;
  return pickIsHome(game) ? signal.includes("home") : signal.includes("away");
}

function lineMoveContradicts(game: NBAGame): boolean {
  // line_move = home_ml - ml_open_home
  // positive = home ML went up = money on away = contradicts home pick
  if (game.line_move == null) return false;
  if (pickIsHome(game)) return game.line_move > 0;
  return game.line_move < 0;
}

export function computeNBATier(game: NBAGame): NBATier {
  const { edge, confidence } = game;

  if (edge === null || edge === undefined || isNaN(edge)) return "⚪ SKIP";

  const sharp = sharpConfirms(game);
  const contradicts = lineMoveContradicts(game);

  // Compute EV for pick side
  const pickML = game.pick === game.home_team ? game.home_ml : game.away_ml;
  const ev = pickML != null ? computeEVRaw(confidence, pickML) : null;
  const positiveEV = ev !== null && ev > 1;

  if ((contradicts && Math.abs(edge) > 8) || (Math.abs(edge) > 15 && !sharp)) return "🔴 FADE";

  // Require positive EV for Model Favorites
  if (confidence >= 60 && positiveEV && ev > 5 && sharp && !contradicts) return "🔒 LOCK";
  if (confidence >= 60 && positiveEV && !contradicts) return "🟢 BET";
  if (confidence >= 58 && positiveEV && !contradicts) return "🟢 BET";

  // Leans: positive EV
  if (confidence >= 52 && positiveEV && !contradicts) return "🟡 LEAN";
  if (ev !== null && ev > 1 && confidence >= 52) return "🟡 LEAN";

  return "⚪ SKIP";
}

function computeEVRaw(winPct: number, ml: number): number {
  const p = winPct / 100;
  const payout = ml > 0 ? ml / 100 : 100 / Math.abs(ml);
  return p * payout * 100 - (1 - p) * 100;
}

export const NBA_TIER_ORDER: NBATier[] = [
  "🔒 LOCK",
  "🟢 BET",
  "🟢 BET (sharp)",
  "🟡 LEAN",
  "🟡 VALUE",
  "⚪ SKIP",
  "🔴 FADE",
];
