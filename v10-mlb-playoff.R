# ============================================================
#  MLB PREDICTION MODEL — V10 PLAYOFF EDITION
#
#  Adds playoff awareness to V10's proven architecture.
#
#  WHY PLAYOFFS ARE DIFFERENT:
#  - Rotations shrink to 2-3 aces — SP quality matters more
#  - Bullpen usage spikes — teams go to closers in the 6th
#  - Series game number matters: Game 1 = fresh starters,
#    Game 5/7 = depleted rotations, elevated bullpen usage
#  - Home field is slightly stronger (crowd, familiarity)
#  - Cumulative run diff less predictive — small playoff sample
#    Series record (wins/losses in series) is better signal
#
#  NEW FEATURES:
#  - is_playoff: binary flag (R=0, F/D/L/W=1)
#  - series_game_number: 1-7
#  - late_series: game 5+ in a series (rotation depleted)
#  - playoff_home: playoff * home interaction
#
#  GAME TYPES:
#  R = regular season
#  F = Wild Card (best of 3)
#  D = Division Series (best of 5)
#  L = LCS (best of 7)
#  W = World Series (best of 7)
#
#  Output: ~/Desktop/linerup/public/data/mlb/predictions.json
# ============================================================

library(baseballr)
library(dplyr)
library(tidyr)
library(purrr)
library(stringr)
library(readr)
library(zoo)
library(httr)
library(jsonlite)
library(lubridate)

`%||%` <- function(a, b) if (is.null(a) || length(a) == 0) b else a

OUTPUT_PATH <- "/root/linerup/public/data/mlb/predictions.json"

# ============================================================
#  REFERENCE TABLES
# ============================================================
team_map <- tribble(
  ~team_name_abb, ~full,
  "ARI", "Arizona Diamondbacks",   "ATL", "Atlanta Braves",
  "BAL", "Baltimore Orioles",      "BOS", "Boston Red Sox",
  "CHC", "Chicago Cubs",           "CHW", "Chicago White Sox",
  "CIN", "Cincinnati Reds",        "CLE", "Cleveland Guardians",
  "COL", "Colorado Rockies",       "DET", "Detroit Tigers",
  "HOU", "Houston Astros",         "KCR", "Kansas City Royals",
  "LAA", "Los Angeles Angels",     "LAD", "Los Angeles Dodgers",
  "MIA", "Miami Marlins",          "MIL", "Milwaukee Brewers",
  "MIN", "Minnesota Twins",        "NYM", "New York Mets",
  "NYY", "New York Yankees",       "OAK", "Athletics",
  "ATH", "Athletics",              "PHI", "Philadelphia Phillies",
  "PIT", "Pittsburgh Pirates",     "SDP", "San Diego Padres",
  "SFG", "San Francisco Giants",   "SEA", "Seattle Mariners",
  "STL", "St. Louis Cardinals",    "TBR", "Tampa Bay Rays",
  "TEX", "Texas Rangers",          "TOR", "Toronto Blue Jays",
  "WSN", "Washington Nationals"
)

park_factor <- tribble(
  ~venue_name,                       ~pf,
  "Coors Field",                      1.15,
  "Great American Ball Park",         1.05,
  "Sutter Health Park",               1.05,
  "Globe Life Field",                 1.04,
  "Fenway Park",                      1.03,
  "Yankee Stadium",                   1.02,
  "Citizens Bank Park",               1.02,
  "Oriole Park at Camden Yards",      1.02,
  "Camden Yards",                     1.02,
  "American Family Field",            1.01,
  "Wrigley Field",                    1.01,
  "Truist Park",                      1.00,
  "Rogers Centre",                    1.00,
  "Chase Field",                      1.00,
  "Kauffman Stadium",                 1.00,
  "Comerica Park",                    0.99,
  "Target Field",                     0.99,
  "Progressive Field",                0.99,
  "Daikin Park",                      0.99,
  "PNC Park",                         0.98,
  "Angel Stadium",                    0.98,
  "Busch Stadium",                    0.98,
  "Rate Field",                       0.97,
  "Citi Field",                       0.97,
  "Nationals Park",                   0.97,
  "T-Mobile Park",                    0.96,
  "loanDepot park",                   0.96,
  "UNIQLO Field at Dodger Stadium",   0.96,
  "Dodger Stadium",                   0.96,
  "Petco Park",                       0.94,
  "Oracle Park",                      0.93
)

# ============================================================
#  PHASE 1 — GAME RESULTS (2023-2026, ALL GAME TYPES)
#  Include playoffs this time: F, D, L, W
# ============================================================
cat("Phase 1: pulling game results 2023-2026 (regular + playoffs)...\n")

PLAYOFF_TYPES <- c("F", "D", "L", "W")
ALL_GAME_TYPES <- c("R", PLAYOFF_TYPES)

schedule_raw <- map_dfr(2023:2026, function(yr) {
  Sys.sleep(1)
  mlb_schedule(season = yr) %>%
    filter(status_detailed_state == "Final",
           game_type %in% ALL_GAME_TYPES) %>%
    mutate(season = yr)
})

cat("Total games (all types):", nrow(schedule_raw), "\n")
cat("By type:\n")
print(schedule_raw %>% count(game_type))

games <- schedule_raw %>%
  transmute(
    game_pk,
    season,
    game_date          = as.Date(substr(game_date, 1, 10)),
    home_team          = teams_home_team_name,
    away_team          = teams_away_team_name,
    home_score         = as.integer(teams_home_score),
    away_score         = as.integer(teams_away_score),
    venue_name,
    game_type,
    series_game_number = as.integer(series_game_number),
    home_win           = as.integer(home_score > away_score),
    is_playoff         = as.integer(game_type %in% PLAYOFF_TYPES),
    late_series        = as.integer(
                           game_type %in% PLAYOFF_TYPES &
                           !is.na(series_game_number) &
                           series_game_number >= 5
                         )
  ) %>%
  filter(!is.na(home_score), !is.na(away_score)) %>%
  distinct(game_pk, .keep_all = TRUE) %>%
  arrange(game_date, game_pk)

cat("Clean games:", nrow(games), "\n")
cat("Regular season:", sum(games$is_playoff == 0), "\n")
cat("Playoff:", sum(games$is_playoff == 1), "\n")

# ============================================================
#  PHASE 2 — TEAM GAME LOG (long format)
# ============================================================
cat("\nPhase 2: building team game log...\n")

home_log <- games %>%
  transmute(game_pk, game_date, season, game_type,
            team         = home_team,
            runs_scored  = home_score,
            runs_allowed = away_score,
            run_diff     = home_score - away_score,
            won          = home_win,
            is_home      = 1L,
            is_playoff)

away_log <- games %>%
  transmute(game_pk, game_date, season, game_type,
            team         = away_team,
            runs_scored  = away_score,
            runs_allowed = home_score,
            run_diff     = away_score - home_score,
            won          = 1L - home_win,
            is_home      = 0L,
            is_playoff)

team_log <- bind_rows(home_log, away_log) %>%
  arrange(team, game_date, game_pk)

# ============================================================
#  PHASE 3 — ROLLING FEATURES (lagged, no leakage)
#  Compute separately for regular season context.
#  Playoff cumulative run diff resets each series.
# ============================================================
cat("\nPhase 3: computing cumulative pre-game features...\n")

team_features <- team_log %>%
  group_by(team, season) %>%
  arrange(game_date, game_pk, .by_group = TRUE) %>%
  mutate(
    season_game_n = row_number(),
    # Season-level cumulative (lagged)
    cum_run_diff  = lag(cummean(run_diff), default = NA),
    cum_win_pct   = lag(cummean(won),      default = NA),
    # Regular season only cumulative (excludes playoff noise)
    rs_game_n     = cumsum(is_playoff == 0),
    rs_run_diff   = lag(
      ifelse(is_playoff == 0,
             cummean(ifelse(is_playoff == 0, run_diff, NA)),
             NA),
      default = NA)
  ) %>%
  ungroup()

cat("Team-game rows:", nrow(team_features), "\n")

# ============================================================
#  PHASE 4 — PITCHING DATA
# ============================================================
cat("\nPhase 4: pulling pitching data...\n")

pit_hist <- map_dfr(2023:2026, function(yr) {
  Sys.sleep(1)
  fg_team_pitcher(startseason = yr, endseason = yr) %>%
    mutate(season = yr)
})

pit_lookup <- pit_hist %>%
  select(season, team_name_abb,
         bp_SIERA  = SIERA,
         bp_WAR    = Relieving,
         rot_SIERA = Starting,
         rot_IP    = Start_IP) %>%
  left_join(team_map, by = "team_name_abb") %>%
  filter(!is.na(full))

sp_leaders <- map_dfr(2023:2026, function(yr) {
  Sys.sleep(1)
  tryCatch(
    fg_pitcher_leaders(startseason = yr, endseason = yr,
                       ind = 1, qual = 1) %>%
      mutate(season = yr),
    error = function(e) { cat("SP leaders failed for", yr, "\n"); NULL }
  )
})

sp_lookup <- sp_leaders %>%
  select(season, pitcher = PlayerName,
         SP_SIERA = SIERA, SP_xFIP = xFIP,
         SP_KP    = K_pct, SP_IP   = IP) %>%
  filter(!is.na(SP_SIERA), SP_IP >= 5) %>%
  mutate(sp_weight = pmin(1, pmax(0, (SP_IP - 5) / 25)))

cat("Team pitching records:", nrow(pit_lookup), "\n")
cat("Individual SP records:", nrow(sp_lookup), "\n")

# ============================================================
#  PHASE 5 — BUILD TRAINING DATASET
# ============================================================
cat("\nPhase 5: building training dataset...\n")

home_feats <- team_features %>%
  filter(is_home == 1) %>%
  select(game_pk, season, team, season_game_n,
         h_cum_rd = cum_run_diff,
         h_cum_wp = cum_win_pct)

away_feats <- team_features %>%
  filter(is_home == 0) %>%
  select(game_pk, season, team,
         a_cum_rd = cum_run_diff,
         a_cum_wp = cum_win_pct)

model_data <- games %>%
  left_join(home_feats,
            by = c("game_pk", "season", "home_team" = "team")) %>%
  left_join(away_feats,
            by = c("game_pk", "season", "away_team" = "team")) %>%
  left_join(pit_lookup %>%
              select(season, full,
                     h_bp_SIERA  = bp_SIERA,
                     h_bp_WAR    = bp_WAR,
                     h_rot_SIERA = rot_SIERA),
            by = c("season", "home_team" = "full")) %>%
  left_join(pit_lookup %>%
              select(season, full,
                     a_bp_SIERA  = bp_SIERA,
                     a_bp_WAR    = bp_WAR,
                     a_rot_SIERA = rot_SIERA),
            by = c("season", "away_team" = "full")) %>%
  left_join(park_factor, by = "venue_name") %>%
  mutate(
    pf = coalesce(pf, 1.00),
    series_game_number = coalesce(series_game_number, 1L),
    season_weight = case_when(
      season == 2023 ~ 1,
      season == 2024 ~ 2,
      season == 2025 ~ 3,
      season == 2026 ~ 5
    )
  ) %>%
  # For regular season: need 20 games history
  # For playoffs: use whatever history exists (teams have full season)
  filter(season_game_n >= 20 | is_playoff == 1) %>%
  filter(
    !is.na(h_cum_rd),    !is.na(a_cum_rd),
    !is.na(h_bp_SIERA),  !is.na(a_bp_SIERA),
    !is.na(h_rot_SIERA), !is.na(a_rot_SIERA)
  )

cat("Model dataset rows:", nrow(model_data), "\n")
cat("  Regular season:", sum(model_data$is_playoff == 0), "\n")
cat("  Playoff:", sum(model_data$is_playoff == 1), "\n")
cat("  2023:", sum(model_data$season == 2023), "\n")
cat("  2024:", sum(model_data$season == 2024), "\n")
cat("  2025:", sum(model_data$season == 2025), "\n")
cat("  2026:", sum(model_data$season == 2026), "\n")

# ============================================================
#  PHASE 6 — HONEST OOS VALIDATION
# ============================================================
cat("\nPhase 6: honest OOS validation...\n")

train_data <- model_data %>% filter(season <= 2025)
test_data  <- model_data %>% filter(season == 2026)

cat("Train:", nrow(train_data), "| Test:", nrow(test_data), "\n")

model_val <- glm(
  home_win ~
    h_cum_rd    + a_cum_rd    +
    h_bp_SIERA  + a_bp_SIERA  +
    h_bp_WAR    + a_bp_WAR    +
    pf          +
    is_playoff  +              # regime change flag
    late_series,               # depleted rotation signal
  data    = train_data,
  family  = binomial,
  weights = season_weight
)

cat("\n--- VALIDATION SUMMARY ---\n")
print(summary(model_val))

train_data$pred_val <- predict(model_val, newdata = train_data, type = "response")
test_data$pred_val  <- predict(model_val, newdata = test_data,  type = "response")

train_acc <- mean((train_data$pred_val > 0.5) == (train_data$home_win == 1))
oos_acc   <- mean((test_data$pred_val  > 0.5) == (test_data$home_win  == 1))
base_acc  <- max(mean(model_data$home_win), 1 - mean(model_data$home_win))

# Break down OOS by regular season vs playoff
oos_rs  <- test_data %>% filter(is_playoff == 0)
oos_po  <- test_data %>% filter(is_playoff == 1)
acc_rs  <- if(nrow(oos_rs) > 0)
             mean((oos_rs$pred_val > 0.5) == (oos_rs$home_win == 1)) else NA
acc_po  <- if(nrow(oos_po) > 0)
             mean((oos_po$pred_val > 0.5) == (oos_po$home_win == 1)) else NA

brier_oos <- mean((test_data$pred_val - test_data$home_win)^2)

cat("\n========================================\n")
cat("VALIDATION RESULTS\n")
cat("========================================\n")
cat("Train accuracy (2023-2025):", round(train_acc * 100, 2), "%\n")
cat("OOS accuracy  (2026 only): ", round(oos_acc   * 100, 2), "%\n")
cat("  Regular season OOS:      ", round(acc_rs    * 100, 2), "%\n")
if (!is.na(acc_po))
  cat("  Playoff OOS:             ", round(acc_po * 100, 2), "%\n")
cat("Baseline:", round(base_acc * 100, 2), "%\n")
cat("Edge over baseline:", round((oos_acc - base_acc) * 100, 2), "pp\n")
cat("Brier score (OOS):", round(brier_oos, 4), "\n")
cat("V10 regular-season OOS for comparison: 54.94%\n")
cat("========================================\n\n")

# Check if playoff flags add signal
cat("Playoff coefficient z-scores:\n")
coef_sum <- summary(model_val)$coefficients
cat("  is_playoff z:", round(coef_sum["is_playoff", "z value"], 2), "\n")
cat("  late_series z:", round(coef_sum["late_series", "z value"], 2), "\n\n")

# ============================================================
#  PHASE 7 — REFIT ON FULL DATA
# ============================================================
cat("\nPhase 7: refitting on full data for production...\n")

model_prod <- glm(
  home_win ~
    h_cum_rd   + a_cum_rd   +
    h_bp_SIERA + a_bp_SIERA +
    h_bp_WAR   + a_bp_WAR   +
    pf         +
    is_playoff +
    late_series,
  data    = model_data,
  family  = binomial,
  weights = season_weight
)

model_data$pred_full <- predict(model_prod, type = "response")
full_acc <- mean((model_data$pred_full > 0.5) == (model_data$home_win == 1))
cat("Full-data training accuracy:", round(full_acc * 100, 2), "%\n")

# ============================================================
#  PHASE 8 — TODAY'S GAMES
# ============================================================
cat("\nPhase 8: pulling today's games...\n")

# Check both regular season and playoffs
today_sched <- mlb_schedule(season = 2026) %>%
  filter(date == as.character(Sys.Date()),
         status_abstract_game_state == "Preview",
         game_type %in% ALL_GAME_TYPES) %>%
  distinct(game_pk, .keep_all = TRUE)

cat("Pre-game today:", nrow(today_sched), "\n")
if(nrow(today_sched) > 0) {
  cat("By type:", table(today_sched$game_type), "\n")
}

write_predictions_json <- function(data) {
  output_dir <- dirname(OUTPUT_PATH)
  if (!dir.exists(output_dir)) dir.create(output_dir, recursive = TRUE)
  write_json(data, OUTPUT_PATH, pretty = TRUE, auto_unbox = TRUE, na = "null")
  cat("✓ Wrote predictions to:", OUTPUT_PATH, "\n")
}

if (nrow(today_sched) == 0) {
  write_predictions_json(list(
    generated_at   = format(Sys.time(), "%Y-%m-%d %H:%M:%S %Z"),
    date           = as.character(Sys.Date()),
    model_version  = "V10",
    oos_accuracy   = round(oos_acc * 100, 2),
    training_games = nrow(model_data),
    games          = list(),
    note           = "No MLB games today."
  ))
  stop("No games today. JSON written.", call. = FALSE)
}

# Flag today's game context
today_games <- today_sched %>%
  mutate(
    is_playoff         = as.integer(game_type %in% PLAYOFF_TYPES),
    series_game_number = as.integer(coalesce(series_game_number, 1L)),
    games_in_series    = as.integer(coalesce(games_in_series, 3L)),
    late_series        = as.integer(
                           game_type %in% PLAYOFF_TYPES &
                           series_game_number >= 5
                         ),
    series_finale      = as.integer(
                           !is.na(series_game_number) &
                           !is.na(games_in_series) &
                           series_game_number >= games_in_series
                         ),
    game_context = case_when(
      game_type == "W" ~ paste0("World Series Game ", series_game_number),
      game_type == "L" ~ paste0("LCS Game ", series_game_number),
      game_type == "D" ~ paste0("Division Series Game ", series_game_number),
      game_type == "F" ~ paste0("Wild Card Game ", series_game_number),
      TRUE             ~ ""
    )
  )

# ============================================================
#  PHASE 9 — CURRENT TEAM STATE
# ============================================================
cat("\nPhase 9: getting current team state...\n")

current_state <- team_features %>%
  filter(season == 2026) %>%
  arrange(team, desc(game_date), desc(game_pk)) %>%
  group_by(team) %>%
  slice(1) %>%
  ungroup() %>%
  select(team,
         h_cum_rd = cum_run_diff,
         h_cum_wp = cum_win_pct)

# ============================================================
#  PHASE 10 — TODAY'S PROBABLE STARTERS
# ============================================================
cat("\nPhase 10: pulling probable starters...\n")

probables <- map_dfr(today_games$game_pk, function(pk) {
  tryCatch(mlb_probables(game_pk = pk), error = function(e) NULL)
})

sp_2026 <- sp_lookup %>% filter(season == 2026)

prob_home <- probables %>%
  inner_join(today_games %>%
               select(game_pk, home_team = teams_home_team_name),
             by = c("game_pk", "team" = "home_team")) %>%
  select(game_pk, home_pitcher = fullName)

prob_away <- probables %>%
  inner_join(today_games %>%
               select(game_pk, away_team = teams_away_team_name),
             by = c("game_pk", "team" = "away_team")) %>%
  select(game_pk, away_pitcher = fullName)

# ============================================================
#  PHASE 11 — VEGAS ODDS
# ============================================================
cat("\nPhase 11: pulling Vegas odds...\n")

espn <- tryCatch(
  content(GET("https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard"),
          "parsed"),
  error = function(e) NULL
)

vegas <- tibble(home_team = character(),
                home_ml = numeric(), away_ml = numeric(),
                home_ml_open = numeric(), away_ml_open = numeric(),
                vegas_home_prob = numeric(), over_under = numeric(),
                game_time = character())

if (!is.null(espn) && length(espn$events) > 0) {
  vegas <- map_dfr(espn$events, function(event) {
    tryCatch({
      comp <- event$competitions[[1]]
      odds <- comp$odds[[1]]
      home_ml      <- as.numeric(odds$moneyline$home$close$odds %||% NA)
      away_ml      <- as.numeric(odds$moneyline$away$close$odds %||% NA)
      home_ml_open <- as.numeric(odds$moneyline$home$open$odds %||% NA)
      away_ml_open <- as.numeric(odds$moneyline$away$open$odds %||% NA)
      ou           <- as.numeric(odds$overUnder %||% NA)
      home_imp     <- if (!is.na(home_ml) && home_ml < 0)
                        abs(home_ml)/(abs(home_ml)+100)
                      else 100/(home_ml+100)
      away_imp     <- if (!is.na(away_ml) && away_ml < 0)
                        abs(away_ml)/(abs(away_ml)+100)
                      else 100/(away_ml+100)
      home_no_vig  <- home_imp / (home_imp + away_imp)
      tibble(home_team = odds$homeTeamOdds$team$displayName,
             home_ml, away_ml, home_ml_open, away_ml_open,
             vegas_home_prob = home_no_vig, over_under = ou,
             game_time = event$date %||% NA_character_)
    }, error = function(e) NULL)
  })
}

vegas <- vegas %>%
  mutate(
    home_move_raw = home_ml - home_ml_open,
    home_move     = ifelse(abs(home_move_raw) > 50, NA, home_move_raw),
    sharp_signal  = case_when(
      is.na(home_move)  ~ "no data",
      home_move <= -15  ~ "sharp on HOME",
      home_move <= -8   ~ "mild on HOME",
      home_move >=  15  ~ "sharp on AWAY",
      home_move >=   8  ~ "mild on AWAY",
      TRUE              ~ "neutral"
    )
  )

cat("Vegas lines for", nrow(vegas), "games\n")

# ============================================================
#  PHASE 12 — BUILD TODAY'S MATCHUPS
# ============================================================
cat("\nPhase 12: building matchups...\n")

pit_2026 <- pit_lookup %>% filter(season == 2026)

today <- today_games %>%
  select(game_pk,
         away_team          = teams_away_team_name,
         home_team          = teams_home_team_name,
         away_w             = teams_away_league_record_wins,
         away_l             = teams_away_league_record_losses,
         home_w             = teams_home_league_record_wins,
         home_l             = teams_home_league_record_losses,
         venue_name,
         is_playoff,
         series_game_number,
         games_in_series,
         late_series,
         series_finale,
         game_context) %>%
  left_join(prob_home, by = "game_pk") %>%
  left_join(prob_away, by = "game_pk") %>%
  left_join(current_state %>%
              rename(h_cum_rd_cur = h_cum_rd, h_cum_wp_cur = h_cum_wp),
            by = c("home_team" = "team")) %>%
  left_join(current_state %>%
              rename(a_cum_rd_cur = h_cum_rd, a_cum_wp_cur = h_cum_wp),
            by = c("away_team" = "team")) %>%
  left_join(pit_2026 %>%
              select(full, h_bp_SIERA = bp_SIERA, h_bp_WAR = bp_WAR,
                     h_rot_SIERA = rot_SIERA),
            by = c("home_team" = "full")) %>%
  left_join(pit_2026 %>%
              select(full, a_bp_SIERA = bp_SIERA, a_bp_WAR = bp_WAR,
                     a_rot_SIERA = rot_SIERA),
            by = c("away_team" = "full")) %>%
  left_join(sp_2026 %>%
              rename(home_pitcher = pitcher,
                     hsp_SIERA = SP_SIERA, hsp_xFIP = SP_xFIP,
                     hsp_KP = SP_KP, hsp_IP = SP_IP,
                     hsp_weight = sp_weight),
            by = "home_pitcher") %>%
  left_join(sp_2026 %>%
              rename(away_pitcher = pitcher,
                     asp_SIERA = SP_SIERA, asp_xFIP = SP_xFIP,
                     asp_KP = SP_KP, asp_IP = SP_IP,
                     asp_weight = sp_weight),
            by = "away_pitcher") %>%
  left_join(park_factor, by = "venue_name") %>%
  left_join(vegas, by = "home_team") %>%
  mutate(
    pf         = coalesce(pf, 1.00),
    h_cum_rd   = coalesce(h_cum_rd_cur, 0),
    a_cum_rd   = coalesce(a_cum_rd_cur, 0),
    hsp_weight = coalesce(hsp_weight, 0),
    asp_weight = coalesce(asp_weight, 0),
    home_tbd   = is.na(home_pitcher) | home_pitcher == "TBD",
    away_tbd   = is.na(away_pitcher) | away_pitcher == "TBD",
    tbd_flag   = case_when(
      home_tbd & away_tbd ~ "both TBD",
      home_tbd            ~ "HOME TBD",
      away_tbd            ~ "AWAY TBD",
      TRUE                ~ ""
    ),
    thin_sp = hsp_weight < 0.5 | asp_weight < 0.5
  )

# ============================================================
#  PHASE 13 — PREDICT
# ============================================================
cat("\nPhase 13: predicting...\n")

today$model_home_prob <- predict(model_prod, newdata = today, type = "response")

today <- today %>%
  mutate(
    # SP nudge vs team rotation
    h_sp_delta = ifelse(!is.na(hsp_SIERA) & !is.na(h_rot_SIERA),
                        (h_rot_SIERA - hsp_SIERA) * hsp_weight, 0),
    a_sp_delta = ifelse(!is.na(asp_SIERA) & !is.na(a_rot_SIERA),
                        (a_rot_SIERA - asp_SIERA) * asp_weight, 0),
    # In playoffs, SP matters more — increase nudge cap to ±5%
    sp_nudge_cap = ifelse(is_playoff == 1, 0.05, 0.03),
    sp_nudge = pmax(-sp_nudge_cap,
                    pmin(sp_nudge_cap, (h_sp_delta - a_sp_delta) * 0.02)),

    base_blend = ifelse(!is.na(vegas_home_prob),
                        0.70 * (model_home_prob + sp_nudge) +
                        0.30 * vegas_home_prob,
                        model_home_prob + sp_nudge),

    pick_home_pre = base_blend > 0.5,

    sharp_nudge = case_when(
      is.na(home_move)                     ~  0,
      pick_home_pre  & home_move <= -15    ~  0.015,
      pick_home_pre  & home_move <= -8     ~  0.0075,
      pick_home_pre  & home_move >=  8     ~ -0.020,
      !pick_home_pre & home_move >=  15    ~  0.015,
      !pick_home_pre & home_move >=   8    ~  0.0075,
      !pick_home_pre & home_move <=  -8    ~ -0.020,
      TRUE                                 ~  0
    ),

    final_home_prob = pmax(0.05, pmin(0.95,
      ifelse(pick_home_pre,
             base_blend + sharp_nudge,
             base_blend - sharp_nudge))),
    final_away_prob = 1 - final_home_prob,

    pick_home = final_home_prob > 0.5,
    sharp_confirms = case_when(
      is.na(home_move)              ~ FALSE,
      pick_home  & home_move <= -8  ~ TRUE,
      !pick_home & home_move >=  8  ~ TRUE,
      TRUE                          ~ FALSE
    ),
    sharp_fades = case_when(
      is.na(home_move)              ~ FALSE,
      pick_home  & home_move >=  8  ~ TRUE,
      !pick_home & home_move <= -8  ~ TRUE,
      TRUE                          ~ FALSE
    )
  )

# ============================================================
#  PHASE 14 — NARRATIVE (playoff-aware)
# ============================================================
mlb_narrative <- function(hsp, asp, hsp_ip, asp_ip,
                           edge, sharp_sig,
                           is_playoff, series_game_number,
                           late_series) {

  model_label <- "V10"

  edge_str <- if (is.na(edge)) {
    paste0(model_label, " finds an edge over the market line.")
  } else if (abs(edge) >= 8) {
    paste0(model_label, " finds a strong edge over the market line.")
  } else if (abs(edge) >= 4) {
    paste0(model_label, " finds a solid edge over the market line.")
  } else {
    paste0(model_label, " finds a small edge over the market line.")
  }

  context_str <- if (is_playoff == 1 && late_series == 1) {
    paste0("Game ", series_game_number,
           " — bullpen depth and closer availability critical.")
  } else if (is_playoff == 1) {
    if (!is.na(hsp) && !is.na(hsp_ip) && hsp_ip >= 20) {
      paste0("Playoff Game ", series_game_number, ". ",
             hsp, " takes the mound (", round(hsp_ip, 0), " IP).")
    } else {
      paste0("Playoff Game ", series_game_number,
             ". Bullpen edge drives the lean.")
    }
  } else {
    if (!is.na(hsp) && !is.na(hsp_ip) && hsp_ip >= 20) {
      paste0(hsp, " at full strength (", round(hsp_ip, 0), " IP).")
    } else if (!is.na(asp) && !is.na(asp_ip) && asp_ip >= 20) {
      paste0(asp, " at full strength (", round(asp_ip, 0), " IP).")
    } else {
      "Bullpen edge drives the lean."
    }
  }

  sharp_str <- case_when(
    sharp_sig == "sharp on HOME" ~ "Sharps confirm the lean.",
    sharp_sig == "sharp on AWAY" ~ "Market moving against this pick.",
    sharp_sig == "mild on HOME"  ~ "Mild sharp action confirms.",
    sharp_sig == "mild on AWAY"  ~ "Mild sharp action against.",
    TRUE                         ~ ""
  )

  paste(edge_str, context_str, sharp_str) %>% trimws()
}

today <- today %>%
  rowwise() %>%
  mutate(
    the_read = mlb_narrative(
      hsp               = home_pitcher,
      asp               = away_pitcher,
      hsp_ip            = hsp_IP,
      asp_ip            = asp_IP,
      edge              = ifelse(is.na(vegas_home_prob), NA,
                                 round((model_home_prob - vegas_home_prob)*100, 1)),
      sharp_sig         = sharp_signal,
      is_playoff        = is_playoff,
      series_game_number= series_game_number,
      late_series       = late_series
    )
  ) %>%
  ungroup()

# ============================================================
#  PHASE 15 — CONSOLE OUTPUT
# ============================================================
cat("\n\n========== TODAY'S PREDICTIONS (V10) ==========\n")
cat("OOS accuracy (2026 holdout):", round(oos_acc * 100, 2), "%\n")
cat("Regular season OOS:", round(acc_rs * 100, 2), "%\n")
cat("Training games:", nrow(model_data), "| 70/30 Vegas blend\n\n")

today %>%
  mutate(
    matchup    = paste0(away_team, " @ ", home_team,
                        ifelse(game_context != "", paste0(" [", game_context, "]"), "")),
    pitchers   = paste0(coalesce(away_pitcher, "TBD"), " vs ",
                        coalesce(home_pitcher, "TBD")),
    sp_w       = paste0(round(asp_weight*100,0), "/", round(hsp_weight*100,0), "%"),
    ml         = ifelse(is.na(home_ml), "—",
                        paste0(ifelse(away_ml>0,"+",""), away_ml,
                               " / ", ifelse(home_ml>0,"+",""), home_ml)),
    move       = ifelse(is.na(home_move), "—",
                        paste0(ifelse(home_move>0,"+",""), round(home_move,0))),
    model_pct  = paste0(round(model_home_prob*100,1), "%"),
    vegas_pct  = ifelse(is.na(vegas_home_prob), "—",
                        paste0(round(vegas_home_prob*100,1), "%")),
    final_pct  = paste0(round(final_home_prob*100,1), "%"),
    pick       = ifelse(final_home_prob > 0.5, home_team, away_team),
    confidence = round(pmax(final_home_prob, final_away_prob)*100, 1),
    edge       = ifelse(is.na(vegas_home_prob), NA,
                        round((model_home_prob - vegas_home_prob)*100, 1)),
    tier = case_when(
      is.na(edge)                                          ~ "NO LINE",
      home_tbd | away_tbd                                  ~ "TBD",
      thin_sp                                              ~ "THIN SP",
      sharp_fades & abs(edge) > 5                          ~ "FADE",
      abs(edge) > 12 & !sharp_confirms                     ~ "FADE",
      abs(edge) > 12 &  sharp_confirms                     ~ "INFO",
      confidence >= 60 & abs(edge) <= 4 & sharp_confirms   ~ "LOCK",
      confidence >= 60 & abs(edge) <= 4                    ~ "BET",
      confidence >= 60 & abs(edge) <= 10 & sharp_confirms  ~ "BET",
      confidence >= 60 & abs(edge) <= 10                   ~ "LEAN",
      confidence >= 55 & edge >= 4 & edge <= 8 & sharp_confirms ~ "BET",
      confidence >= 55 & edge >= 4 & edge <= 8             ~ "VALUE",
      confidence < 55                                      ~ "SKIP",
      TRUE                                                 ~ "PASS"
    )
  ) %>%
  arrange(desc(is_playoff), desc(confidence)) %>%
  select(matchup, pitchers, `SP%` = sp_w,
         ML = ml, Move = move,
         Model = model_pct, Vegas = vegas_pct, Final = final_pct,
         Pick = pick, Conf = confidence, Edge = edge,
         Sharp = sharp_signal, Tier = tier) %>%
  print(n = Inf, width = Inf)

# ============================================================
#  PHASE 16 — JSON EXPORT
# ============================================================
cat("\nPhase 16: writing JSON...\n")

export_data <- list(
  generated_at      = format(Sys.time(), "%Y-%m-%d %H:%M:%S %Z"),
  date              = as.character(Sys.Date()),
  model_version     = "V10",
  oos_accuracy      = round(oos_acc  * 100, 2),
  training_accuracy = round(full_acc * 100, 2),
  training_games    = nrow(model_data),
  games = today %>%
    arrange(desc(is_playoff), desc(final_home_prob)) %>%
    transmute(
      away_team,
      home_team,
      away_record        = paste0(away_w, "-", away_l),
      home_record        = paste0(home_w, "-", home_l),
      away_pitcher       = coalesce(away_pitcher, "TBD"),
      home_pitcher       = coalesce(home_pitcher, "TBD"),
      away_sp_ip         = coalesce(asp_IP, 0),
      home_sp_ip         = coalesce(hsp_IP, 0),
      away_sp_siera      = round(coalesce(asp_SIERA, NA_real_), 2),
      home_sp_siera      = round(coalesce(hsp_SIERA, NA_real_), 2),
      away_sp_weight     = round(asp_weight * 100, 0),
      home_sp_weight     = round(hsp_weight * 100, 0),
      venue              = venue_name,
      park_factor        = pf,
      away_ml,
      home_ml,
      ml_open_home       = home_ml_open,
      line_move          = home_move,
      sharp_signal,
      h_cum_rd           = round(h_cum_rd, 2),
      a_cum_rd           = round(a_cum_rd, 2),
      is_playoff,
      series_game_number,
      games_in_series,
      late_series,
      series_finale,
      game_context,
      model_prob_home    = round(model_home_prob * 100, 1),
      vegas_prob_home    = ifelse(is.na(vegas_home_prob), NA,
                                  round(vegas_home_prob * 100, 1)),
      final_prob_home    = round(final_home_prob * 100, 1),
      pick               = ifelse(final_home_prob > 0.5, home_team, away_team),
      confidence         = round(pmax(final_home_prob, final_away_prob)*100, 1),
      edge               = ifelse(is.na(vegas_home_prob), NA,
                                  round((model_home_prob-vegas_home_prob)*100, 1)),
      over_under,
      tbd_flag           = ifelse(tbd_flag == "", NA, tbd_flag),
      thin_sp,
      game_time          = coalesce(game_time, NA_character_),
      the_read
    )
)

write_predictions_json(export_data)
cat("\n========== V10 DONE ==========\n")
cat("OOS accuracy:", round(oos_acc * 100, 2), "%\n")
cat("Predictions written to:", OUTPUT_PATH, "\n")
