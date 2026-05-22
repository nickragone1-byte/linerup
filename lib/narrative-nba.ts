import type { NBAGame, NBATier } from "./types-nba";

function sharpConfirmsPick(game: NBAGame): boolean {
  const s = (game.sharp_signal ?? "neutral").toLowerCase();
  if (s === "neutral" || s === "no data") return false;
  const isHome = game.pick === game.home_team;
  return isHome ? s.includes("home") : s.includes("away");
}

function sharpFadesPick(game: NBAGame): boolean {
  const s = (game.sharp_signal ?? "neutral").toLowerCase();
  if (s === "neutral" || s === "no data") return false;
  return !sharpConfirmsPick(game);
}

function lineMoveAgainstPick(game: NBAGame): boolean {
  const isHome = game.pick === game.home_team;
  if (game.line_move == null) return false;
  return isHome ? game.line_move > 0 : game.line_move < 0;
}

export function generateNBANarrative(game: NBAGame, _internal: NBATier): string {
  const isHome = game.pick === game.home_team;
  const pickEdge = game.edge != null ? (isHome ? game.edge : -game.edge) : 0;

  const oppTopMissing = isHome ? game.a_top_missing : game.h_top_missing;
  const pickTopMissing = isHome ? game.h_top_missing : game.a_top_missing;

  const confirms = sharpConfirmsPick(game);
  const fades = sharpFadesPick(game);
  const lineAgainst = lineMoveAgainstPick(game);
  const isNeutral =
    (game.sharp_signal ?? "neutral").toLowerCase() === "neutral" ||
    (game.sharp_signal ?? "neutral").toLowerCase() === "no data";

  // S1: edge size — mirror MLB phrasing exactly
  let edgeLabel: string;
  if (pickEdge < 4) edgeLabel = "small";
  else if (pickEdge < 8) edgeLabel = "solid";
  else edgeLabel = "strong";

  const sentence1 = `V7 finds a ${edgeLabel} edge over the market line.`;

  // S2: NBA-specific context — injury impact is the V7 signature
  let sentence2 = "";
  if (oppTopMissing >= 2) {
    sentence2 = ` ${isHome ? game.away_team : game.home_team} missing ${oppTopMissing} top-8 rotation players.`;
  } else if (oppTopMissing === 1) {
    sentence2 = ` ${isHome ? game.away_team : game.home_team} missing 1 top-8 rotation player.`;
  } else if (pickTopMissing >= 2) {
    // Edge despite the pick's team having injuries — note it
    sentence2 = ` Edge holds despite ${pickTopMissing} top-8 players out.`;
  } else if (game.is_playoff === 1) {
    sentence2 = ` Playoff context — both rotations at full tilt.`;
  }

  // S3: sharp signal context — same structure as MLB
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
