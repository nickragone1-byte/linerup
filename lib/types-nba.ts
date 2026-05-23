// ── NBA-specific types ───────────────────────────────────────────────────────
// Parallel to lib/types.ts (MLB) — kept separate so MLB types stay untouched.

export interface NBAGame {
  away_team: string;
  home_team: string;
  game_time?: string | null;

  // Moneyline
  away_ml: number;
  home_ml: number;
  ml_open_home: number;
  line_move: number;

  // Spread
  vegas_spread: number;        // negative = home favored
  vegas_spread_open: number;
  spread_move: number;

  // Signals
  sharp_signal: string;

  // Injury features (V7's biggest signals)
  h_top_missing: number;       // 0..8
  a_top_missing: number;

  // Model output
  model_prob_home: number;     // 0..100
  vegas_prob_home: number;
  final_prob_home: number;

  // Pick + confidence
  pick: string;
  confidence: number;          // 0..100, max(final_home_prob, 100-final_home_prob)
  edge: number;                // model_prob_home - vegas_prob_home, in pct points

  // Context
  over_under: number;
  is_playoff: number;          // 0 or 1
}

export interface NBAPredictionsData {
  generated_at: string;
  date?: string;
  model_version: string;            // "V7"
  validated_oos_accuracy: number;   // 67.97
  training_games: number;           // 6257
  games: NBAGame[];
  note?: string;                    // "No NBA games today." etc.
}

export type NBATier =
  | "🔒 LOCK"
  | "🟢 BET"
  | "🟢 BET (sharp)"
  | "🟡 LEAN"
  | "🟡 VALUE"
  | "⚪ SKIP"
  | "🔴 FADE";
