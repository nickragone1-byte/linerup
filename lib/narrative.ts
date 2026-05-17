import type { Game, Tier } from "./types";

function sharpConfirmsPick(game: Game): boolean {
  const s = game.sharp_signal.toLowerCase();
  if (s === "neutral") return false;
  const isHome = game.pick === game.home_team;
  return isHome ? s.includes("home") : s.includes("away");
}

function lineMoveAgainstPick(game: Game): boolean {
  const isHome = game.pick === game.home_team;
  return isHome ? game.line_move > 0 : game.line_move < 0;
}

export function generateNarrative(game: Game, _internal: Tier): string {
  const isHome = game.pick === game.home_team;
  const opponent = isHome ? game.away_team : game.home_team;
  const pickPitcher = isHome ? game.home_pitcher : game.away_pitcher;
  const pickPitcherIP = isHome ? game.home_sp_ip : game.away_sp_ip;

  const confirms = sharpConfirmsPick(game);
  const lineAgainst = lineMoveAgainstPick(game);
  const thinSP = pickPitcherIP > 0 && pickPitcherIP < 30;

  let sentence1: string;

  if (confirms && game.edge > 0) {
    sentence1 = "Strong model edge. Sharps agree.";
  } else if (lineAgainst && game.edge > 0) {
    sentence1 = `Model likes ${game.pick} despite the line moving toward ${opponent}.`;
  } else if (game.edge >= 0 && game.edge < 6) {
    sentence1 = "Solid model edge against the market.";
  } else {
    const vegasPct = (isHome ? game.vegas_prob_home : 100 - game.vegas_prob_home).toFixed(1);
    sentence1 = `V8 sees ${game.confidence.toFixed(1)}% — Vegas has it at ${vegasPct}%.`;
  }

  const sentence2 = thinSP
    ? ` ${pickPitcher} sample is light — weight accordingly.`
    : "";

  return sentence1 + sentence2;
}
