export interface Game {
  away_team: string;
  home_team: string;
  away_record: string;
  home_record: string;
  away_pitcher: string;
  home_pitcher: string;
  away_sp_ip: number;
  home_sp_ip: number;
  away_sp_weight: number;
  home_sp_weight: number;
  venue: string;
  park_factor: number;
  away_ml: number;
  home_ml: number;
  ml_open_home: number;
  line_move: number;
  sharp_signal: string;
  model_prob_home: number;
  vegas_prob_home: number;
  final_prob_home: number;
  pick: string;
  confidence: number;
  edge: number;
  over_under: number;
  tbd_flag: string | null;
  thin_sp: boolean;
}

export interface PredictionsData {
  generated_at: string;
  date: string;
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
