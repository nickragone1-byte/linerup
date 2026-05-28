import type { NBAGame, NBATier } from "./types-nba";

function pickIsHome(game: NBAGame): boolean {
  return game.pick === game.home_team;
}

function sharpConfirms(game: NBAGame): boolean {
  const signal = game.sharp_signal.toLowerCase();
  if (signal === "neutral" || signal === "no data") return false;
  return pickIsHome(game) ? signal.includes("home") : signal.includes("away");
}

type ContradictionStrength = "none" | "mild" | "strong";

function contradictionStrength(game: NBAGame): ContradictionStrength {
  if (game.line_move == null) return "none";
  // Normalize so positive = move AGAINST our pick.
  const against = pickIsHome(game) ? game.line_move : -game.line_move;
  if (against >= 15) return "strong"; // real sharp signal — forces PASS
  if (against >= 8) return "mild";    // caution — still allows LEAN
  return "none";
}

export function computeNBATier(game: NBAGame): NBATier {
  const { edge, confidence } = game;

  if (edge === null || edge === undefined || isNaN(edge)) return "⚪ SKIP";

  const sharp = sharpConfirms(game);
  const strength = contradictionStrength(game);
  const strongFade = strength === "strong";
  const mildFade = strength === "mild";

  // Compute EV for pick side
  const pickML = game.pick === game.home_team ? game.home_ml : game.away_ml;
  const ev = pickML != null ? computeEVRaw(confidence, pickML) : null;
  const positiveEV = ev !== null && ev > 1;

  // FADE: strong contradiction on a big edge, or extreme edge with no sharp support
  if ((strongFade && Math.abs(edge) > 8) || (Math.abs(edge) > 15 && !sharp)) return "🔴 FADE";

  // LOCK: 60%+ conf + EV>5 + sharps agree + no contradiction
  if (confidence >= 60 && positiveEV && ev !== null && ev > 5 && sharp && strength === "none") return "🔒 LOCK";
  // BET: 60%+ conf + positive EV + no contradiction
  if (confidence >= 60 && positiveEV && strength === "none") return "🟢 BET";
  // BET: 58%+ conf + EV>3 + no contradiction
  if (confidence >= 58 && positiveEV && ev !== null && ev > 3 && strength === "none") return "🟢 BET";
  // LEAN: 55%+ conf + EV>2 + no STRONG fade (mild fade still allowed)
  if (confidence >= 55 && positiveEV && ev !== null && ev > 2 && !strongFade) return "🟡 LEAN";
  // LEAN (mild-fade survivor): high conf + positive EV with only a mild fade
  if (confidence >= 58 && positiveEV && mildFade) return "🟡 LEAN";

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
