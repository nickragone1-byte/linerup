import type { NBATier } from "./types-nba";

export type NBADisplayTier = "LOCK" | "PLAY" | "LEAN" | "PASS";

export function toNBADisplayTier(internal: NBATier): NBADisplayTier {
  switch (internal) {
    case "🔒 LOCK":
      return "LOCK";
    case "🟢 BET":
    case "🟢 BET (sharp)":
      return "PLAY";
    case "🟡 LEAN":
    case "🟡 VALUE":
      return "LEAN";
    default:
      return "PASS";
  }
}

export function nbaPassReason(internal: NBATier): string {
  switch (internal) {
    case "🔴 FADE":
      return "Market disagreement";
    case "⚪ SKIP":
    default:
      return "No edge";
  }
}
