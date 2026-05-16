import type { Tier } from "./types";

export type DisplayTier = "LOCK" | "PLAY" | "LEAN" | "PASS";

export function toDisplayTier(internal: Tier): DisplayTier {
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

export function passReason(internal: Tier): string {
  switch (internal) {
    case "🔴 FADE":
      return "Market disagreement";
    case "⚠️ TBD":
      return "Pitcher pending";
    case "⚠️ THIN SP":
      return "Insufficient data";
    case "⚠️ INFO":
    case "⚪ SKIP":
    default:
      return "No edge";
  }
}
