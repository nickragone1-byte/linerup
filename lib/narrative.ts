import type { Game, Tier } from "./types";

function sharpConfirmsPick(game: Game): boolean {
  const s = game.sharp_signal.toLowerCase();
  if (s === "neutral") return false;
  const isHome = game.pick === game.home_team;
  return isHome ? s.includes("home") : s.includes("away");
}

function sharpFadesPick(game: Game): boolean {
  const s = game.sharp_signal.toLowerCase();
  if (s === "neutral") return false;
  return !sharpConfirmsPick(game);
}

function lineMoveAgainstPick(game: Game): boolean {
  const isHome = game.pick === game.home_team;
  return isHome ? game.line_move > 0 : game.line_move < 0;
}

export function generateNarrative(game: Game, _internal: Tier): string {
  const isHome = game.pick === game.home_team;
  const pickPitcher = isHome ? game.home_pitcher : game.away_pitcher;
  const pickPitcherIP = isHome ? game.home_sp_ip : game.away_sp_ip;
  const pickEdge = isHome ? game.edge : -game.edge;

  const confirms = sharpConfirmsPick(game);
  const fades = sharpFadesPick(game);
  const lineAgainst = lineMoveAgainstPick(game);
  const isNeutral = game.sharp_signal.toLowerCase() === "neutral";

  // S1: edge size description
  let edgeLabel: string;
  if (pickEdge < 4) edgeLabel = "small";
  else if (pickEdge < 8) edgeLabel = "solid";
  else edgeLabel = "strong";

  const sentence1 = `V10 finds a ${edgeLabel} edge over the market line.`;

  // S2: pitcher quality or park context
  let sentence2 = "";
  if (pickPitcherIP >= 40) {
    sentence2 = ` ${pickPitcher} at full strength (${pickPitcherIP.toFixed(0)} IP).`;
  } else if (pickPitcherIP > 0 && pickPitcherIP < 30) {
    sentence2 = ` Light pitcher sample — weight accordingly.`;
  } else if (game.park_factor > 1.05) {
    sentence2 = ` Park favors offense tonight.`;
  } else if (game.park_factor < 0.95) {
    sentence2 = ` Park favors pitching tonight.`;
  }

  // S3: sharp signal context
  let sentence3 = "";
  if (confirms) {
    sentence3 = ` Sharps confirm the lean.`;
  } else if (fades) {
    sentence3 = ` Market moving against this pick.`;
  } else if (isNeutral && lineAgainst) {
    sentence3 = ` Sharps neutral despite line movement.`;
  }

  return sentence1 + sentence2 + sentence3;
}
