// Single source of truth for V10 model statistics.
// Update these when the model is retrained on new data.
// Last verified: 2026-05-23 from v10-mlb-playoff.R Phase 6 output.

export const MODEL_TRAINING_GAMES = 6_750;
export const MODEL_ACCURACY = 57.4;         // OOS accuracy on 2026 holdout
export const MODEL_BASELINE = 52.6;         // Home-team-always baseline on 2026
export const MODEL_EDGE_PP = 4.8;           // OOS accuracy - baseline
export const MODEL_BREAKEVEN = 52.4;        // Approx break-even win rate at -110 odds
