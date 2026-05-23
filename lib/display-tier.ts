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
      return "Market disagrees";
    case "⚠️ TBD":
      return "Pitcher TBD";
    case "⚠️ THIN SP":
      return "Thin pitcher sample";
    case "⚪ SKIP":
      return "Low confidence";
    case "⚠️ INFO":
    default:
      return "Proceed with caution";
  }
}
