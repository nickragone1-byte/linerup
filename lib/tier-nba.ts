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
  if (pickIsHome(game)) return game.line_move > 0;
  return game.line_move < 0;
}

export function computeNBATier(game: NBAGame): NBATier {
  const { edge, confidence } = game;

  if (edge === null || edge === undefined || isNaN(edge)) return "⚪ SKIP";

  const sharp = sharpConfirms(game);
  const contradicts = lineMoveContradicts(game);

  if ((contradicts && Math.abs(edge) > 5) || (Math.abs(edge) > 12 && !sharp)) return "🔴 FADE";
  if (confidence >= 60 && Math.abs(edge) <= 4 && sharp) return "🔒 LOCK";
  if (confidence >= 60 && Math.abs(edge) <= 4) return "🟢 BET";
  if (confidence >= 60 && Math.abs(edge) <= 10 && sharp) return "🟢 BET (sharp)";
  if (confidence >= 60 && Math.abs(edge) <= 10) return "🟡 LEAN";
  if (confidence >= 55 && edge >= 4 && edge <= 8) return "🟡 VALUE";

  return "⚪ SKIP";
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
