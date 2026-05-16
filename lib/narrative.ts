import type { Game } from "./types";
import type { Tier } from "./types";

function sharpDesc(signal: string): string {
  const s = signal.toLowerCase();
  if (s === "neutral") return "Sharp action is neutral.";
  if (s.includes("home")) return "Sharp money is on the home side.";
  if (s.includes("away")) return "Sharp money is on the away side.";
  return `${signal}.`;
}

export function generateNarrative(game: Game, internal: Tier): string {
  const { pick, confidence, vegas_prob_home, home_team, sharp_signal } = game;
  const isHome = pick === home_team;
  const vegasPct = (isHome ? vegas_prob_home : 100 - vegas_prob_home).toFixed(1);
  const conf = confidence.toFixed(1);

  switch (internal) {
    case "🔒 LOCK":
      return `Strong model edge on ${pick}. Sharp money confirms.`;
    case "🟢 BET":
      return `V8 favors ${pick} with ${conf}% confidence (Vegas: ${vegasPct}%). ${sharpDesc(sharp_signal)}`;
    case "🟢 BET (sharp)":
      return `V8 favors ${pick} with ${conf}% confidence (Vegas: ${vegasPct}%). Sharp action confirms the lean.`;
    case "🟡 LEAN":
      return `Smaller edge on ${pick}. Worth a smaller play if the line holds.`;
    case "🟡 VALUE":
      return `${pick} offers value at current odds — model sees more edge than Vegas implies.`;
    case "🔴 FADE":
      return `V8 leans ${pick} but the line moved against them — no clean play.`;
    case "⚠️ TBD":
      return `Pitcher pending — revisit closer to game time.`;
    case "⚠️ THIN SP":
      return `Starter has limited innings data — model confidence is reduced.`;
    default:
      return `No actionable edge identified.`;
  }
}
