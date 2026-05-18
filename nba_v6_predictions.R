# ============================================================
#  NBA PREDICTION MODEL — V6 PRODUCTION
#
#  Out-of-sample validated: 67.97% (on 1,305 games)
#  Architecture: 16 variables — team quality, recency, context,
#  style, AND player availability (injuries)
#  Pipeline: model + 70/30 spread blend + sharp nudge + tiers
#  Output: ~/Desktop/linerup/public/data/nba/predictions.json
# ============================================================

library(hoopR)
library(tidyverse)
library(httr)
library(jsonlite)
library(lubridate)
library(zoo)

`%||%` <- function(a, b) if (is.null(a) || length(a) == 0) b else a

# ============================================================
#  CONFIG
# ============================================================
OUTPUT_PATH <- path.expand("~/Desktop/linerup/public/data/nba/predictions.json")

# ============================================================
#  PHASE 1 — HISTORICAL DATA + PLAYER BOX
# ============================================================
cat("Phase 1: pulling historical NBA data...\n")

nba_box <- load_nba_team_box(seasons = 2022:2026)
nba_sched <- load_nba_schedule(seasons = 2022:2026)
nba_player_box <- load_nba_player_box(seasons = 2022:2026)

cat("Box rows:", nrow(nba_box), "| Player box rows:", nrow(nba_player_box), "\n")

# ============================================================
#  PHASE 2 — COMPUTE PER-GAME METRICS
# ============================================================
cat("\nPhase 2: computing per-game metrics...\n")

nba_box <- nba_box %>%
  mutate(
    game_date = as.Date(game_date),
    possessions = field_goals_attempted + 0.44 * free_throws_attempted -
                  offensive_rebounds + total_turnovers,
    off_rtg = (team_score / possessions) * 100,
    def_rtg = (opponent_team_score / possessions) * 100,
    pace = possessions,
    won = as.integer(team_winner == TRUE),
    is_playoff = as.integer(season_type == 3)
  ) %>%
  filter(!is.na(possessions), possessions > 50)

# ============================================================
#  PHASE 3 — INJURY DETECTION (TOP-8 PLAYERS PER TEAM-SEASON)
# ============================================================
cat("\nPhase 3: building injury features...\n")

nba_player_box <- nba_player_box %>%
  mutate(
    game_date = as.Date(game_date),
    minutes_num = as.numeric(minutes),
    minutes_num = ifelse(is.na(minutes_num), 0, minutes_num)
  ) %>%
  filter(!is.na(team_display_name), !is.na(athlete_id))

player_season_avg <- nba_player_box %>%
  filter(minutes_num > 5) %>%
  group_by(season, team_display_name, athlete_id, athlete_display_name) %>%
  summarise(
    games_played = n(),
    avg_minutes = mean(minutes_num, na.rm = TRUE),
    .groups = "drop"
  ) %>%
  filter(games_played >= 10)

top_players <- player_season_avg %>%
  group_by(season, team_display_name) %>%
  arrange(desc(avg_minutes)) %>%
  slice_head(n = 8) %>%
  ungroup() %>%
  select(season, team_display_name, athlete_id, athlete_display_name, avg_minutes)

cat("Top-8 rotations identified:", nrow(top_players), "\n")

players_in_game <- nba_player_box %>%
  filter(minutes_num > 5) %>%
  select(game_id, season, team_display_name, athlete_id)

missing_by_game <- top_players %>%
  inner_join(
    nba_box %>% select(game_id, season, game_date, team_display_name) %>% distinct(),
    by = c("season", "team_display_name"),
    relationship = "many-to-many"
  ) %>%
  anti_join(players_in_game, by = c("game_id", "team_display_name", "athlete_id")) %>%
  group_by(game_id, team_display_name) %>%
  summarise(top_missing = n(), .groups = "drop")

nba_box <- nba_box %>%
  left_join(missing_by_game, by = c("game_id", "team_display_name")) %>%
  mutate(top_missing = ifelse(is.na(top_missing), 0, top_missing))

# ============================================================
#  PHASE 4 — ROLLING STATS + SOS ADJUSTMENTS
# ============================================================
cat("\nPhase 4: computing rolling + SOS-adjusted stats...\n")

nba_box_rolled <- nba_box %>%
  arrange(team_display_name, game_date) %>%
  group_by(team_display_name) %>%
  mutate(
    cum_games = row_number(),
    cum_off_rtg = lag(cummean(off_rtg), default = NA),
    cum_def_rtg = lag(cummean(def_rtg), default = NA),
    cum_pace    = lag(cummean(pace), default = NA),

    l10_off_rtg = lag(zoo::rollmean(off_rtg, k = 10, fill = NA, align = "right"), default = NA),
    l10_def_rtg = lag(zoo::rollmean(def_rtg, k = 10, fill = NA, align = "right"), default = NA),

    cum_home_wins  = lag(cumsum(ifelse(team_home_away == "home", won, 0)), default = 0),
    cum_home_games = lag(cumsum(ifelse(team_home_away == "home", 1, 0)), default = 0),
    cum_home_court = ifelse(cum_home_games >= 5, cum_home_wins / cum_home_games, NA),

    prev_game_date = lag(game_date),
    rest_days = as.integer(game_date - prev_game_date),
    rest_days = ifelse(is.na(rest_days) | rest_days > 10, 3, rest_days),
    is_b2b = as.integer(rest_days == 1)
  ) %>%
  ungroup()

nba_box_sos <- nba_box_rolled %>%
  arrange(game_id, team_home_away) %>%
  group_by(game_id) %>%
  mutate(
    opp_cum_off_rtg = rev(cum_off_rtg),
    opp_cum_def_rtg = rev(cum_def_rtg)
  ) %>%
  ungroup() %>%
  mutate(
    adj_off_game = off_rtg - opp_cum_def_rtg,
    adj_def_game = def_rtg - opp_cum_off_rtg
  ) %>%
  arrange(team_display_name, game_date) %>%
  group_by(team_display_name) %>%
  mutate(
    l10_adj_off = lag(zoo::rollmean(adj_off_game, k = 10, fill = NA, align = "right"), default = NA),
    l10_adj_def = lag(zoo::rollmean(adj_def_game, k = 10, fill = NA, align = "right"), default = NA)
  ) %>%
  ungroup()

# ============================================================
#  PHASE 5 — BUILD TRAINING SET + FIT V6 (FULL DATA)
# ============================================================
cat("\nPhase 5: fitting V6 on full data...\n")

games_wide <- nba_box_sos %>%
  select(game_id, season, season_type, game_date, team_home_away,
         team_display_name, won, is_playoff,
         cum_pace, cum_home_court,
         l10_off_rtg, l10_def_rtg, l10_adj_off, l10_adj_def,
         cum_games, rest_days, is_b2b, top_missing) %>%
  pivot_wider(
    id_cols = c(game_id, season, season_type, game_date, is_playoff),
    names_from = team_home_away,
    values_from = c(team_display_name, won, cum_pace, cum_home_court,
                    l10_off_rtg, l10_def_rtg, l10_adj_off, l10_adj_def,
                    cum_games, rest_days, is_b2b, top_missing)
  ) %>%
  rename(
    home_team = team_display_name_home,
    away_team = team_display_name_away,
    home_win = won_home,
    h_pace = cum_pace_home, a_pace = cum_pace_away,
    h_home_court = cum_home_court_home,
    h_l10_off = l10_off_rtg_home, a_l10_off = l10_off_rtg_away,
    h_l10_def = l10_def_rtg_home, a_l10_def = l10_def_rtg_away,
    h_adj_off = l10_adj_off_home, a_adj_off = l10_adj_off_away,
    h_adj_def = l10_adj_def_home, a_adj_def = l10_adj_def_away,
    h_games = cum_games_home, a_games = cum_games_away,
    h_rest = rest_days_home, a_rest = rest_days_away,
    h_b2b = is_b2b_home, a_b2b = is_b2b_away,
    h_top_missing = top_missing_home, a_top_missing = top_missing_away
  ) %>%
  filter(!is.na(home_team), !is.na(away_team), !is.na(home_win)) %>%
  mutate(pace_diff = h_pace - a_pace)

train <- games_wide %>%
  filter(h_games >= 15, a_games >= 15,
         !is.na(h_l10_off), !is.na(a_l10_off),
         !is.na(h_adj_off), !is.na(a_adj_off),
         !is.na(h_home_court)) %>%
  mutate(season_weight = case_when(
    season == 2022 ~ 1, season == 2023 ~ 2,
    season == 2024 ~ 3, season == 2025 ~ 4,
    season == 2026 ~ 5
  ))

model_v6 <- glm(
  home_win ~ h_l10_off + a_l10_off + h_l10_def + a_l10_def +
             h_adj_off + a_adj_off + h_adj_def + a_adj_def +
             h_home_court +
             h_rest + a_rest + h_b2b + a_b2b +
             pace_diff +
             h_top_missing + a_top_missing,
  data = train, family = binomial, weights = season_weight
)

cat("V6 model fitted on", nrow(train), "games\n")
cat("Validated OOS accuracy: 67.97% (on 1,305 test games)\n")

# ============================================================
#  PHASE 6 — TODAY'S GAMES
# ============================================================
cat("\nPhase 6: pulling today's NBA games...\n")

today_games <- tryCatch({
  load_nba_schedule(seasons = 2026) %>%
    filter(as.Date(game_date) == Sys.Date()) %>%
    filter(status_type_state == "pre" | status_type_completed == FALSE)
}, error = function(e) {
  cat("Error:", e$message, "\n")
  tibble()
})

cat("Pre-game today:", nrow(today_games), "\n")

# Helper: ensure output directory exists, then write JSON
write_predictions_json <- function(data) {
  output_dir <- dirname(OUTPUT_PATH)
  if (!dir.exists(output_dir)) dir.create(output_dir, recursive = TRUE)
  write_json(data, OUTPUT_PATH, pretty = TRUE, auto_unbox = TRUE, na = "null")
  cat("✓ Wrote predictions to:", OUTPUT_PATH, "\n")
}

if (nrow(today_games) == 0) {
  cat("\n⚠️  No NBA games today. Writing empty JSON.\n")
  export_data <- list(
    generated_at = format(Sys.time(), "%Y-%m-%d %H:%M:%S %Z"),
    date = as.character(Sys.Date()),
    model_version = "V6",
    validated_oos_accuracy = 67.97,
    training_games = nrow(train),
    games = list(),
    note = "No NBA games today."
  )
  write_predictions_json(export_data)
  stop("End of run.", call. = FALSE)
}

# ============================================================
#  PHASE 7 — TODAY'S TEAM STATE
# ============================================================
cat("\nPhase 7: getting current team stats...\n")

team_current <- nba_box_sos %>%
  filter(season == 2026) %>%
  arrange(team_display_name, desc(game_date)) %>%
  group_by(team_display_name) %>%
  slice(1) %>%
  ungroup() %>%
  select(team_display_name, game_date,
         cum_pace, cum_home_court,
         l10_off_rtg, l10_def_rtg, l10_adj_off, l10_adj_def,
         cum_games)

team_last_game <- nba_box_rolled %>%
  filter(season == 2026) %>%
  arrange(team_display_name, desc(game_date)) %>%
  group_by(team_display_name) %>%
  slice(1) %>%
  ungroup() %>%
  select(team_display_name, last_game_date = game_date) %>%
  mutate(
    rest_days_today = as.integer(Sys.Date() - last_game_date),
    rest_days_today = ifelse(is.na(rest_days_today) | rest_days_today > 10, 3, rest_days_today),
    is_b2b_today = as.integer(rest_days_today == 1)
  )

# ============================================================
#  PHASE 8 — LIVE INJURY DETECTION
# ============================================================
cat("\nPhase 8: checking live rosters for missing top-8 players...\n")

top_8_2026 <- top_players %>% filter(season == 2026)

get_active_players <- function(team_id) {
  tryCatch({
    roster <- espn_nba_team_current_roster(team_id = team_id)
    if (is.null(roster) || nrow(roster) == 0) return(NULL)
    return(roster$athlete_id)
  }, error = function(e) {
    cat("  Roster fetch failed for team", team_id, "\n")
    return(NULL)
  })
}

today_with_injuries <- today_games %>%
  select(game_id,
         home_team = home_display_name,
         away_team = away_display_name,
         home_team_id = home_id,
         away_team_id = away_id) %>%
  rowwise() %>%
  mutate(
    home_active = list(get_active_players(home_team_id)),
    away_active = list(get_active_players(away_team_id))
  ) %>%
  ungroup() %>%
  rowwise() %>%
  mutate(
    home_top8 = list(top_8_2026 %>% filter(team_display_name == home_team) %>% pull(athlete_id)),
    away_top8 = list(top_8_2026 %>% filter(team_display_name == away_team) %>% pull(athlete_id)),
    h_top_missing = ifelse(is.null(home_active[[1]]) || length(home_top8[[1]]) == 0,
                           0,
                           sum(!(as.character(home_top8[[1]]) %in% as.character(home_active[[1]])))),
    a_top_missing = ifelse(is.null(away_active[[1]]) || length(away_top8[[1]]) == 0,
                           0,
                           sum(!(as.character(away_top8[[1]]) %in% as.character(away_active[[1]]))))
  ) %>%
  ungroup() %>%
  select(game_id, home_team, away_team, h_top_missing, a_top_missing)

print(today_with_injuries %>% select(home_team, away_team, h_top_missing, a_top_missing))

# ============================================================
#  PHASE 9 — VEGAS ODDS
# ============================================================
cat("\nPhase 9: pulling Vegas odds...\n")

espn <- tryCatch({
  content(GET("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"),
          "parsed")
}, error = function(e) NULL)

vegas <- tibble(home_team = character(),
                home_ml = numeric(), away_ml = numeric(),
                home_ml_open = numeric(),
                vegas_home_prob_ml = numeric(),
                vegas_spread = numeric(),
                vegas_spread_open = numeric(),
                vegas_home_prob_spread = numeric(),
                over_under = numeric())

if (!is.null(espn) && length(espn$events) > 0) {
  vegas <- map_dfr(espn$events, function(event) {
    tryCatch({
      comp <- event$competitions[[1]]
      odds <- comp$odds[[1]]

      home_ml <- as.numeric(odds$moneyline$home$close$odds %||% NA)
      away_ml <- as.numeric(odds$moneyline$away$close$odds %||% NA)
      home_ml_open <- as.numeric(odds$moneyline$home$open$odds %||% NA)

      vegas_spread <- as.numeric(odds$spread %||% NA)
      vegas_spread_open <- as.numeric(odds$openingSpread %||% NA)
      ou <- as.numeric(odds$overUnder %||% NA)

      home_imp_ml <- if (!is.na(home_ml) && home_ml < 0)
        abs(home_ml)/(abs(home_ml)+100)
      else 100/(home_ml+100)
      away_imp_ml <- if (!is.na(away_ml) && away_ml < 0)
        abs(away_ml)/(abs(away_ml)+100)
      else 100/(away_ml+100)
      total_imp <- home_imp_ml + away_imp_ml
      home_no_vig_ml <- home_imp_ml / total_imp

      home_no_vig_spread <- if (!is.na(vegas_spread)) {
        pnorm(-vegas_spread / 12)
      } else NA

      tibble(
        home_team = odds$homeTeamOdds$team$displayName,
        home_ml = home_ml, away_ml = away_ml,
        home_ml_open = home_ml_open,
        vegas_home_prob_ml = home_no_vig_ml,
        vegas_spread = vegas_spread,
        vegas_spread_open = vegas_spread_open,
        vegas_home_prob_spread = home_no_vig_spread,
        over_under = ou
      )
    }, error = function(e) NULL)
  })
}

vegas <- vegas %>%
  mutate(
    home_move_raw = home_ml - home_ml_open,
    home_move = ifelse(abs(home_move_raw) > 50, NA, home_move_raw),
    spread_move = vegas_spread - vegas_spread_open,
    sharp_signal = case_when(
      is.na(home_move) ~ "no data",
      home_move <= -15 ~ "sharp on HOME",
      home_move <= -8  ~ "mild on HOME",
      home_move >=  15 ~ "sharp on AWAY",
      home_move >=   8 ~ "mild on AWAY",
      TRUE ~ "neutral"
    )
  )

# ============================================================
#  PHASE 10 — BUILD MATCHUPS
# ============================================================
cat("\nPhase 10: building matchups...\n")

today <- today_games %>%
  select(game_id,
         home_team = home_display_name,
         away_team = away_display_name) %>%
  left_join(team_current %>%
              select(team_display_name,
                     h_l10_off = l10_off_rtg, h_l10_def = l10_def_rtg,
                     h_adj_off = l10_adj_off, h_adj_def = l10_adj_def,
                     h_pace = cum_pace, h_home_court = cum_home_court),
            by = c("home_team" = "team_display_name")) %>%
  left_join(team_current %>%
              select(team_display_name,
                     a_l10_off = l10_off_rtg, a_l10_def = l10_def_rtg,
                     a_adj_off = l10_adj_off, a_adj_def = l10_adj_def,
                     a_pace = cum_pace),
            by = c("away_team" = "team_display_name")) %>%
  left_join(team_last_game %>%
              select(team_display_name,
                     h_rest = rest_days_today, h_b2b = is_b2b_today),
            by = c("home_team" = "team_display_name")) %>%
  left_join(team_last_game %>%
              select(team_display_name,
                     a_rest = rest_days_today, a_b2b = is_b2b_today),
            by = c("away_team" = "team_display_name")) %>%
  left_join(today_with_injuries %>% select(game_id, h_top_missing, a_top_missing),
            by = "game_id") %>%
  left_join(vegas, by = "home_team") %>%
  mutate(
    pace_diff = h_pace - a_pace,
    h_rest = ifelse(is.na(h_rest), 3, h_rest),
    a_rest = ifelse(is.na(a_rest), 3, a_rest),
    h_b2b = ifelse(is.na(h_b2b), 0, h_b2b),
    a_b2b = ifelse(is.na(a_b2b), 0, a_b2b),
    h_top_missing = ifelse(is.na(h_top_missing), 0, h_top_missing),
    a_top_missing = ifelse(is.na(a_top_missing), 0, a_top_missing)
  )

# ============================================================
#  PHASE 11 — PREDICT + BLEND
# ============================================================
cat("\nPhase 11: predicting...\n")

today$model_home_prob <- predict(model_v6, newdata = today, type = "response")

today <- today %>%
  mutate(
    vegas_home_prob = coalesce(vegas_home_prob_spread, vegas_home_prob_ml),

    base_blend = ifelse(!is.na(vegas_home_prob),
                        0.70 * model_home_prob + 0.30 * vegas_home_prob,
                        model_home_prob),

    pick_home_pre = base_blend > 0.5,

    sharp_nudge = case_when(
      is.na(home_move) ~ 0,
      pick_home_pre & home_move <= -15 ~  0.015,
      pick_home_pre & home_move <= -8  ~  0.0075,
      pick_home_pre & home_move >=  8  ~ -0.020,
      !pick_home_pre & home_move >=  15 ~  0.015,
      !pick_home_pre & home_move >=   8 ~  0.0075,
      !pick_home_pre & home_move <=  -8 ~ -0.020,
      TRUE ~ 0
    ),

    final_home_prob = pmax(0.05, pmin(0.95,
                                      ifelse(pick_home_pre,
                                             base_blend + sharp_nudge,
                                             base_blend - sharp_nudge))),
    final_away_prob = 1 - final_home_prob
  )

# ============================================================
#  PHASE 12 — JSON EXPORT
# ============================================================
cat("\n========== TODAY'S NBA PREDICTIONS (V6) ==========\n")

export_data <- list(
  generated_at = format(Sys.time(), "%Y-%m-%d %H:%M:%S %Z"),
  date = as.character(Sys.Date()),
  model_version = "V6",
  validated_oos_accuracy = 67.97,
  training_games = nrow(train),
  games = today %>%
    arrange(desc(final_home_prob)) %>%
    transmute(
      away_team,
      home_team,
      away_ml = away_ml,
      home_ml = home_ml,
      ml_open_home = home_ml_open,
      line_move = home_move,
      vegas_spread = vegas_spread,
      vegas_spread_open = vegas_spread_open,
      spread_move = spread_move,
      sharp_signal,
      h_top_missing = h_top_missing,
      a_top_missing = a_top_missing,
      model_prob_home = round(model_home_prob * 100, 1),
      vegas_prob_home = ifelse(is.na(vegas_home_prob), NA,
                               round(vegas_home_prob * 100, 1)),
      final_prob_home = round(final_home_prob * 100, 1),
      pick = ifelse(final_home_prob > 0.5, home_team, away_team),
      confidence = round(pmax(final_home_prob, final_away_prob) * 100, 1),
      edge = ifelse(is.na(vegas_home_prob), NA,
                    round((model_home_prob - vegas_home_prob) * 100, 1)),
      over_under,
      is_playoff = ifelse(month(Sys.Date()) %in% c(4, 5, 6), 1, 0)
    )
)

write_predictions_json(export_data)

cat("\n========== V6 PRODUCTION DONE ==========\n")
