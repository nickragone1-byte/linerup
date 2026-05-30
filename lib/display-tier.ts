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

export function passReason(internal: Tier, game?: { sharp_signal?: string | null; line_move?: number | null; pick?: string; home_team?: string; tbd_flag?: string | null; thin_sp?: boolean; }): string {
  // Signal-based precedence — pick the most informative reason regardless of internal tier.
  // Sharp money contradicting the pick is the strongest fade signal, so check it first.
  if (game) {
    const sig = (game.sharp_signal ?? "").toLowerCase();
    const pickedHome = game.pick && game.home_team && game.pick === game.home_team;
    const sharpOnHome = sig.includes("on home");
    const sharpOnAway = sig.includes("on away");
    const sharpContradicts =
      (pickedHome && sharpOnAway) || (!pickedHome && sharpOnHome);

    if (sharpContradicts) return "Market disagrees";
    if (game.tbd_flag) return "Pitcher TBD";
    if (game.thin_sp) return "Thin pitcher sample";
  }

  // Fallback to internal-tier-based reason if game data isn't available.
  switch (internal) {
    case "🔴 FADE":
      return "Market disagrees";
    case "⚠️ TBD":
      return "Pitcher TBD";
    case "⚠️ THIN SP":
      return "Thin pitcher sample";
    case "⚪ SKIP":
      return "No market value";
    case "⚠️ INFO":
    default:
      return "Proceed with caution";
  }
}
