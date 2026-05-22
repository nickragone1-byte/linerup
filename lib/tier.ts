import type { Game, Tier } from "./types";

function pickIsHome(game: Game): boolean {
  return game.pick === game.home_team;
}

function sharpConfirms(game: Game): boolean {
  if (!game.sharp_signal) return false;
  const signal = game.sharp_signal.toLowerCase();
  if (signal === "neutral") return false;
  return pickIsHome(game) ? signal.includes("home") : signal.includes("away");
}

function lineMoveContradicts(game: Game): boolean {
  if (game.line_move == null) return false;
  // line_move = home_ml - ml_open_home
  // positive = home ML went up = away money = contradicts home pick
  // negative = home ML went down = home money = contradicts away pick
  if (pickIsHome(game)) return game.line_move > 0;
  return game.line_move < 0;
}

export function computeTier(game: Game): Tier {
  const { edge, tbd_flag, thin_sp, confidence } = game;

  // No line = can't evaluate
  if (edge === null || edge === undefined) return "⚪ SKIP";
  if (tbd_flag) return "⚠️ TBD";
  if (thin_sp) return "⚠️ THIN SP";

  const sharp = sharpConfirms(game);
  const contradicts = lineMoveContradicts(game);
  const pickML = game.pick === game.home_team ? game.home_ml : game.away_ml;
  const ev = pickML != null ? computeEVRaw(confidence, pickML) : null;
  const positiveEV = ev !== null && ev > 0;

  // FADE: market strongly disagrees AND edge is large, or extreme edge with no sharp support
  if ((contradicts && Math.abs(edge) > 8) || (Math.abs(edge) > 15 && !sharp)) return "🔴 FADE";

  // LOCK: high confidence + strong positive EV + sharp confirms
  if (confidence >= 60 && ev !== null && ev > 5 && sharp && !contradicts) return "🔒 LOCK";

  // BET: 58%+ confidence + positive EV
  if (confidence >= 58 && positiveEV) return "🟢 BET";

  // BET: 55%+ confidence + strong positive EV (big underdog model likes)
  if (confidence >= 55 && ev !== null && ev > 6) return "🟢 BET";

  // LEAN: 55%+ confidence + positive EV
  if (confidence >= 55 && positiveEV) return "🟡 LEAN";

  // LEAN: 57%+ confidence + solid edge even if slightly negative EV
  if (confidence >= 57 && edge >= 3) return "🟡 LEAN";

  // VALUE: any positive EV play
  if (positiveEV) return "🟡 VALUE";

  return "⚪ SKIP";
}

// Raw EV calculation (mirrors lib/ev.ts logic)
function computeEVRaw(winPct: number, ml: number): number {
  const p = winPct / 100;
  const payout = ml > 0 ? ml / 100 : 100 / Math.abs(ml);
  return p * payout * 100 - (1 - p) * 100;
}

export const TIER_ORDER: Tier[] = [
  "🔒 LOCK",
  "🟢 BET",
  "🟢 BET (sharp)",
  "🟡 LEAN",
  "🟡 VALUE",
  "⚠️ INFO",
  "⚠️ TBD",
  "⚠️ THIN SP",
  "⚪ SKIP",
  "🔴 FADE",
];

export function tierColor(tier: Tier): string {
  switch (tier) {
    case "🔒 LOCK":
      return "border-amber-400 bg-amber-400/10";
    case "🟢 BET":
      return "border-green-500 bg-green-500/10";
    case "🟢 BET (sharp)":
      return "border-emerald-400 bg-emerald-400/10";
    case "🟡 LEAN":
      return "border-yellow-400 bg-yellow-400/10";
    case "🟡 VALUE":
      return "border-yellow-500 bg-yellow-500/10";
    case "⚠️ INFO":
      return "border-orange-400 bg-orange-400/10";
    case "⚠️ TBD":
      return "border-orange-500 bg-orange-500/10";
    case "⚠️ THIN SP":
      return "border-orange-400 bg-orange-400/10";
    case "⚪ SKIP":
      return "border-zinc-600 bg-zinc-800/50";
    case "🔴 FADE":
      return "border-red-500 bg-red-500/10";
  }
}

export function tierBadgeColor(tier: Tier): string {
  switch (tier) {
    case "🔒 LOCK":
      return "bg-amber-400 text-zinc-900";
    case "🟢 BET":
      return "bg-green-500 text-white";
    case "🟢 BET (sharp)":
      return "bg-emerald-400 text-zinc-900";
    case "🟡 LEAN":
      return "bg-yellow-400 text-zinc-900";
    case "🟡 VALUE":
      return "bg-yellow-500 text-zinc-900";
    case "⚠️ INFO":
      return "bg-orange-400 text-zinc-900";
    case "⚠️ TBD":
      return "bg-orange-500 text-white";
    case "⚠️ THIN SP":
      return "bg-orange-400 text-zinc-900";
    case "⚪ SKIP":
      return "bg-zinc-600 text-zinc-200";
    case "🔴 FADE":
      return "bg-red-500 text-white";
  }
}
