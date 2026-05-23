export interface Game {
  away_team: string;
  home_team: string;
  away_record: string;
  home_record: string;
  away_pitcher: string;
  home_pitcher: string;
  away_sp_ip: number;
  home_sp_ip: number;
  away_sp_siera: number | null;
  home_sp_siera: number | null;
  away_sp_weight: number;
  home_sp_weight: number;
  venue: string;
  park_factor: number;
  away_ml: number | null;
  home_ml: number | null;
  ml_open_home: number | null;
  line_move: number | null;
  sharp_signal: string | null;
  model_prob_home: number;
  vegas_prob_home: number | null;
  final_prob_home: number;
  pick: string;
  confidence: number;
  edge: number | null;
  over_under: number | null;
  series_game_number: number;
  late_series: number;
  games_in_series?: number;
  series_finale?: number;
  tbd_flag: string | null;
  thin_sp: boolean;
  game_time: string | null;
}

export interface PredictionsData {
  generated_at: string;
  date?: string;
  model_version: string;
  training_accuracy: number;
  training_games: number;
  games: Game[];
}

export type Tier =
  | "🔒 LOCK"
  | "🟢 BET"
  | "🟢 BET (sharp)"
  | "🟡 LEAN"
  | "🟡 VALUE"
  | "⚠️ INFO"
  | "⚠️ TBD"
  | "⚠️ THIN SP"
  | "⚪ SKIP"
  | "🔴 FADE";

// ── Results / Track-record schema ────────────────────────────────────────────

export type Outcome = "WIN" | "LOSS" | "PUSH" | "PENDING";

export interface PickRecord {
  date: string;               // "2026-05-16"
  matchup: string;            // "Yankees @ Mets"
  away_team: string;          // full name matching lib/teams.ts
  home_team: string;
  tier: "PLAY" | "LEAN";
  pick: string;               // "Yankees ML"
  model_prob: number;         // 0.608
  edge: number;               // 0.034
  confidence_weight: number;  // 0.084
  outcome: Outcome;
  final_score: string | null;
  the_read: string;
}

export interface ResultsData {
  model_version: string;
  last_updated: string;
  tracking_start_date: string;
  note?: string;
  results: PickRecord[];
}

// Legacy types — kept for reference, no longer used by live code
export interface PickResult {
  pick: string;
  opponent: string;
  tier: "PLAY" | "LEAN";
  result: "W" | "L" | "P";
  confidence: number;
  edge?: number;
}

export interface DayResult {
  date: string;
  results: PickResult[];
}
