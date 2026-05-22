# ============================================================
#  MLB PREDICTION MODEL — V8 (THE ONE)
#  Best-performing model (57.15% accuracy from V5)
#  Plus V7's flexible decision tiers (INFO, LEAN)
#  Variables: 8 (h_wRC, a_wRC, h_BB, a_BB, h_SIERA, a_SIERA, h_bp, a_bp)
#  Adjustments: park factor, lineup OPS, IP-weighted SP SIERA
#  Final: 70% model + 30% Vegas + sharp action probability nudges
# ============================================================

library(baseballr)
library(tidyverse)
library(httr)
library(jsonlite)

`%||%` <- function(a, b) if (is.null(a) || length(a) == 0) b else a

# ============================================================
#  PHASE 1 — HISTORICAL DATA (2023–2026)
# ============================================================
cat("Phase 1: pulling 2023–2026 data... ~5 min\n")

results_raw <- map_dfr(2023:2026, function(yr) {
  Sys.sleep(1)
  mlb_schedule(season = yr) %>%
    filter(status_detailed_state == "Final", game_type == "R") %>%
    mutate(season = yr)
})
cat("Games pulled:", nrow(results_raw), "\n")

batting_hist <- map_dfr(2023:2026, function(yr) {
  Sys.sleep(1)
  fg_team_batter(startseason = yr, endseason = yr) %>% mutate(season = yr)
})
pitching_hist <- map_dfr(2023:2026, function(yr) {
  Sys.sleep(1)
  fg_team_pitcher(startseason = yr, endseason = yr) %>% mutate(season = yr)
})

# ============================================================
#  PHASE 2 — REFERENCE TABLES
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

slot_weights <- tibble(
  batting_order = 1:9,
  slot_weight   = c(0.124, 0.121, 0.118, 0.115, 0.112,
                    0.108, 0.103, 0.099, 0.094)
)

# ============================================================
#  PHASE 3 — TRAINING SET (8 variables, no diff)
# ============================================================
cat("\nPhase 3: building training set...\n")

bat_train <- batting_hist %>%
  select(season, team_name_abb, wRC_plus, BB_pct) %>%
  left_join(team_map, by = "team_name_abb")

pit_train <- pitching_hist %>%
  select(season, team_name_abb, SIERA, bullpen_WAR = Relieving) %>%
  left_join(team_map, by = "team_name_abb")

results_clean <- results_raw %>%
  select(game_pk, season, game_date,
         home_team = teams_home_team_name,
         away_team = teams_away_team_name,
         home_score = teams_home_score,
         away_score = teams_away_score) %>%
  mutate(home_win = as.integer(home_score > away_score))

train <- results_clean %>%
  left_join(bat_train %>% select(-team_name_abb) %>%
              rename(h_wRC = wRC_plus, h_BB = BB_pct),
            by = c("season", "home_team" = "full")) %>%
  left_join(bat_train %>% select(-team_name_abb) %>%
              rename(a_wRC = wRC_plus, a_BB = BB_pct),
            by = c("season", "away_team" = "full")) %>%
  left_join(pit_train %>% select(-team_name_abb) %>%
              rename(h_SIERA = SIERA, h_bp = bullpen_WAR),
            by = c("season", "home_team" = "full")) %>%
  left_join(pit_train %>% select(-team_name_abb) %>%
              rename(a_SIERA = SIERA, a_bp = bullpen_WAR),
            by = c("season", "away_team" = "full")) %>%
  filter(!is.na(h_wRC), !is.na(a_wRC),
         !is.na(h_SIERA), !is.na(a_SIERA)) %>%
  mutate(season_weight = case_when(
    season == 2023 ~ 1, season == 2024 ~ 2,
    season == 2025 ~ 3, season == 2026 ~ 5
  ))

cat("Training rows:", nrow(train), "\n")

# ============================================================
#  PHASE 4 — FIT MODEL (8 variables)
# ============================================================
cat("\nPhase 4: fitting model...\n")

model <- glm(home_win ~ h_wRC + a_wRC + h_BB + a_BB +
               h_SIERA + a_SIERA + h_bp + a_bp,
             data = train, family = binomial, weights = season_weight)

print(summary(model))

train$pred <- predict(model, type = "response")
acc <- mean((train$pred > 0.5) == (train$home_win == 1))
cat("Training accuracy:", round(acc * 100, 2), "%\n")

# ============================================================
#  PHASE 5 — TODAY'S DATA (PRE-GAME ONLY)
# ============================================================
cat("\nPhase 5: pulling today's data...\n")

today_games <- mlb_schedule(season = 2026) %>%
  filter(date == as.character(Sys.Date()),
         status_abstract_game_state == "Preview")
cat("Pre-game today:", nrow(today_games), "\n")

if (nrow(today_games) == 0) stop("No pre-game games — exiting.")

probables <- map_dfr(today_games$game_pk, function(pk) {
  tryCatch(mlb_probables(game_pk = pk), error = function(e) NULL)
})

sp_stats <- fg_pitcher_leaders(startseason = 2026, endseason = 2026,
                               ind = 1, qual = 1)
sp_lookup <- sp_stats %>%
  select(pitcher = PlayerName, SP_SIERA = SIERA, SP_IP = IP) %>%
  filter(!is.na(SP_SIERA), SP_IP >= 5)

lineups <- map_dfr(today_games$game_pk, function(pk) {
  tryCatch(mlb_batting_orders(game_pk = pk), error = function(e) NULL)
})

batter_stats <- tryCatch(
  mlb_stats(stat_type = "season", stat_group = "hitting",
            season = 2026, player_pool = "all", limit = 2000),
  error = function(e) NULL
)

# ============================================================
#  PHASE 6 — VEGAS ODDS + LINE MOVEMENT
# ============================================================
cat("\nPhase 6: pulling Vegas odds + line movement...\n")

espn <- tryCatch({
  content(GET("https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard"),
          "parsed")
}, error = function(e) NULL)

vegas <- tibble(home_team = character(),
                home_ml = numeric(), away_ml = numeric(),
                home_ml_open = numeric(), away_ml_open = numeric(),
                vegas_home_prob = numeric(), over_under = numeric())

if (!is.null(espn) && length(espn$events) > 0) {
  vegas <- map_dfr(espn$events, function(event) {
    tryCatch({
      comp <- event$competitions[[1]]
      odds <- comp$odds[[1]]
      home_ml <- as.numeric(odds$moneyline$home$close$odds %||% NA)
      away_ml <- as.numeric(odds$moneyline$away$close$odds %||% NA)
      home_ml_open <- as.numeric(odds$moneyline$home$open$odds %||% NA)
      away_ml_open <- as.numeric(odds$moneyline$away$open$odds %||% NA)
      ou <- as.numeric(odds$overUnder %||% NA)
      home_imp <- if (!is.na(home_ml) && home_ml < 0)
        abs(home_ml)/(abs(home_ml)+100)
      else 100/(home_ml+100)
      away_imp <- if (!is.na(away_ml) && away_ml < 0)
        abs(away_ml)/(abs(away_ml)+100)
      else 100/(away_ml+100)
      total_imp <- home_imp + away_imp
      home_no_vig <- home_imp / total_imp
      tibble(
        home_team = odds$homeTeamOdds$team$displayName,
        home_ml = home_ml, away_ml = away_ml,
        home_ml_open = home_ml_open, away_ml_open = away_ml_open,
        vegas_home_prob = home_no_vig, over_under = ou
      )
    }, error = function(e) NULL)
  })
}

vegas <- vegas %>%
  mutate(
    home_move_raw = home_ml - home_ml_open,
    home_move = ifelse(abs(home_move_raw) > 50, NA, home_move_raw),
    sharp_signal = case_when(
      is.na(home_move) ~ "no data",
      home_move <= -15 ~ "🔥 sharp on HOME",
      home_move <= -8  ~ "→ mild on HOME",
      home_move >=  15 ~ "🔥 sharp on AWAY",
      home_move >=   8 ~ "← mild on AWAY",
      TRUE ~ "neutral"
    )
  )
cat("Vegas data for", nrow(vegas), "games\n")

# ============================================================
#  PHASE 7 — LINEUP QUALITY
# ============================================================
cat("\nPhase 7: building lineup quality...\n")

lineup_quality <- tibble(teamName = character(),
                         lineup_ops = numeric(),
                         players_matched = integer())
league_avg_ops <- 0.720

if (!is.null(batter_stats) && nrow(lineups) > 0) {
  bs <- batter_stats %>%
    select(player_id, ops, plate_appearances) %>%
    mutate(ops = as.numeric(ops),
           plate_appearances = as.numeric(plate_appearances)) %>%
    filter(plate_appearances >= 30)
  
  league_avg_ops <- mean(bs$ops, na.rm = TRUE)
  
  lineup_quality <- lineups %>%
    mutate(batting_order = as.integer(substr(batting_order, 1, 1))) %>%
    filter(!is.na(batting_order), batting_order >= 1, batting_order <= 9) %>%
    left_join(bs %>% select(player_id, ops),
              by = c("id" = "player_id")) %>%
    left_join(slot_weights, by = "batting_order") %>%
    group_by(teamName) %>%
    summarise(
      lineup_ops = sum(ops * slot_weight, na.rm = TRUE) /
        sum(slot_weight[!is.na(ops)], na.rm = TRUE),
      players_matched = sum(!is.na(ops)),
      .groups = "drop"
    ) %>%
    filter(players_matched >= 6)
}

cat("Lineups for", nrow(lineup_quality), "teams |",
    "Avg OPS:", round(league_avg_ops, 3), "\n")

# ============================================================
#  PHASE 8 — BUILD MATCHUPS
# ============================================================
cat("\nPhase 8: building matchups...\n")

bat_2026 <- batting_hist %>% filter(season == 2026) %>%
  select(team_name_abb, wRC_plus, BB_pct) %>%
  left_join(team_map, by = "team_name_abb")
pit_2026 <- pitching_hist %>% filter(season == 2026) %>%
  select(team_name_abb, SIERA, bullpen_WAR = Relieving) %>%
  left_join(team_map, by = "team_name_abb")

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

today <- today_games %>%
  select(game_pk,
         away_team = teams_away_team_name,
         home_team = teams_home_team_name,
         away_w = teams_away_league_record_wins,
         away_l = teams_away_league_record_losses,
         home_w = teams_home_league_record_wins,
         home_l = teams_home_league_record_losses,
         venue_name) %>%
  left_join(prob_home, by = "game_pk") %>%
  left_join(prob_away, by = "game_pk") %>%
  left_join(bat_2026 %>% select(full, h_wRC_raw = wRC_plus, h_BB = BB_pct),
            by = c("home_team" = "full")) %>%
  left_join(bat_2026 %>% select(full, a_wRC_raw = wRC_plus, a_BB = BB_pct),
            by = c("away_team" = "full")) %>%
  left_join(pit_2026 %>% select(full, team_SIERA_h = SIERA, h_bp = bullpen_WAR),
            by = c("home_team" = "full")) %>%
  left_join(pit_2026 %>% select(full, team_SIERA_a = SIERA, a_bp = bullpen_WAR),
            by = c("away_team" = "full")) %>%
  left_join(sp_lookup %>% rename(home_pitcher = pitcher,
                                 hsp_SIERA = SP_SIERA,
                                 hsp_IP = SP_IP),
            by = "home_pitcher") %>%
  left_join(sp_lookup %>% rename(away_pitcher = pitcher,
                                 asp_SIERA = SP_SIERA,
                                 asp_IP = SP_IP),
            by = "away_pitcher") %>%
  left_join(park_factor, by = "venue_name") %>%
  left_join(lineup_quality %>%
              rename(home_lineup_ops = lineup_ops,
                     h_matched = players_matched),
            by = c("home_team" = "teamName")) %>%
  left_join(lineup_quality %>%
              rename(away_lineup_ops = lineup_ops,
                     a_matched = players_matched),
            by = c("away_team" = "teamName")) %>%
  left_join(vegas, by = "home_team") %>%
  mutate(
    pf = coalesce(pf, 1.00),
    
    home_tbd = is.na(home_pitcher) | home_pitcher == "TBD",
    away_tbd = is.na(away_pitcher) | away_pitcher == "TBD",
    tbd_flag = case_when(
      home_tbd & away_tbd ~ "⚠️ both TBD",
      home_tbd ~ "⚠️ HOME TBD",
      away_tbd ~ "⚠️ AWAY TBD",
      TRUE ~ ""
    ),
    
    h_sample_w = pmin(1, pmax(0, (coalesce(hsp_IP, 0) - 5) / 25)),
    a_sample_w = pmin(1, pmax(0, (coalesce(asp_IP, 0) - 5) / 25)),
    h_SIERA = case_when(
      !is.na(hsp_SIERA) ~ hsp_SIERA * h_sample_w +
        team_SIERA_h * (1 - h_sample_w),
      TRUE ~ team_SIERA_h
    ),
    a_SIERA = case_when(
      !is.na(asp_SIERA) ~ asp_SIERA * a_sample_w +
        team_SIERA_a * (1 - a_sample_w),
      TRUE ~ team_SIERA_a
    ),
    
    h_wRC_park = h_wRC_raw * pf,
    a_wRC_park = a_wRC_raw * pf,
    
    h_lineup_adj = ifelse(!is.na(home_lineup_ops),
                          pmax(-8, pmin(8,
                                        ((home_lineup_ops - league_avg_ops) / 0.010))),
                          0),
    a_lineup_adj = ifelse(!is.na(away_lineup_ops),
                          pmax(-8, pmin(8,
                                        ((away_lineup_ops - league_avg_ops) / 0.010))),
                          0),
    h_wRC = h_wRC_park + h_lineup_adj,
    a_wRC = a_wRC_park + a_lineup_adj
  )

# ============================================================
#  PHASE 9 — PREDICT + 70/30 BLEND + SHARP NUDGE
# ============================================================
today$model_home_prob <- predict(model, newdata = today, type = "response")

today <- today %>%
  mutate(
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
    final_away_prob = 1 - final_home_prob,
    
    pick_home = final_home_prob > 0.5,
    sharp_confirms = case_when(
      is.na(home_move) ~ FALSE,
      pick_home & home_move <= -8 ~ TRUE,
      !pick_home & home_move >= 8 ~ TRUE,
      TRUE ~ FALSE
    ),
    sharp_fades = case_when(
      is.na(home_move) ~ FALSE,
      pick_home & home_move >= 8 ~ TRUE,
      !pick_home & home_move <= -8 ~ TRUE,
      TRUE ~ FALSE
    )
  )

# ============================================================
#  PHASE 10 — OUTPUT WITH FLEXIBLE TIERS
# ============================================================
cat("\n\n========== TODAY'S PREDICTIONS (V8) ==========\n")
cat("Model accuracy:", round(acc * 100, 2), "% on", nrow(train), "games\n")
cat("70/30 Vegas blend | Sharp nudges | SP sample floor | Decision-support tiers\n\n")

today %>%
  mutate(
    matchup = paste0(away_team, " (", away_w, "-", away_l, ") @ ",
                     home_team, " (", home_w, "-", home_l, ")"),
    pitchers = paste0(coalesce(away_pitcher, "TBD"), " vs ",
                      coalesce(home_pitcher, "TBD")),
    sp_w = paste0(round(a_sample_w * 100, 0), "/",
                  round(h_sample_w * 100, 0), "%"),
    ml = ifelse(is.na(home_ml), "—",
                paste0(ifelse(away_ml > 0, "+", ""), away_ml, " / ",
                       ifelse(home_ml > 0, "+", ""), home_ml)),
    move = ifelse(is.na(home_move), "—",
                  paste0(ifelse(home_move > 0, "+", ""),
                         round(home_move, 0))),
    model_pct = paste0(round(model_home_prob * 100, 1), "%"),
    vegas_pct = ifelse(is.na(vegas_home_prob), "—",
                       paste0(round(vegas_home_prob * 100, 1), "%")),
    final_pct = paste0(round(final_home_prob * 100, 1), "%"),
    pick = ifelse(final_home_prob > 0.5, home_team, away_team),
    confidence = round(pmax(final_home_prob, final_away_prob) * 100, 1),
    edge = ifelse(is.na(vegas_home_prob), NA,
                  round((model_home_prob - vegas_home_prob) * 100, 1)),
    
    sp_floor_fail = a_sample_w < 0.5 | h_sample_w < 0.5,
    
    tier = case_when(
      is.na(edge) ~ "⚪ NO LINE",
      home_tbd | away_tbd ~ "⚠️ TBD",
      sp_floor_fail ~ "⚠️ THIN SP",
      sharp_fades & abs(edge) > 5 ~ "🔴 FADE — sharps disagree",
      abs(edge) > 12 & !sharp_confirms ~ "🔴 FADE",
      abs(edge) > 12 & sharp_confirms ~ "⚠️ INFO — your call",
      confidence >= 60 & abs(edge) <= 4 & sharp_confirms ~ "🔒 LOCK",
      confidence >= 60 & abs(edge) <= 4 ~ "🟢 BET",
      confidence >= 60 & abs(edge) <= 10 & sharp_confirms ~ "🟢 BET (sharp)",
      confidence >= 60 & abs(edge) <= 10 ~ "🟡 LEAN",
      confidence >= 55 & edge >= 4 & edge <= 8 & sharp_confirms ~ "🟢 BET (sharp)",
      confidence >= 55 & edge >= 4 & edge <= 8 ~ "🟡 VALUE",
      confidence < 55 ~ "⚪ SKIP",
      TRUE ~ "⚪ PASS"
    )
  ) %>%
  arrange(desc(confidence)) %>%
  select(matchup, pitchers,
         Flags = tbd_flag,
         `SP%` = sp_w,
         `ML (A/H)` = ml,
         Move = move,
         Model = model_pct,
         Vegas = vegas_pct,
         Final = final_pct,
         Pick = pick,
         Conf = confidence,
         Edge = edge,
         Sharp = sharp_signal,
         Tier = tier) %>%
  print(n = Inf, width = Inf)

cat("\n--- V8 TIER LEGEND ---\n")
cat("🔒 LOCK:        Conf ≥ 60% + |Edge| ≤ 4 + sharps confirm\n")
cat("🟢 BET:         Conf ≥ 60% + |Edge| ≤ 4 (model + Vegas agree)\n")
cat("🟢 BET (sharp): Sharps confirm + edge 4–10\n")
cat("🟡 LEAN:        Conf ≥ 60% + edge 5–10 (no sharp confirm)\n")
cat("🟡 VALUE:       Conf ≥ 55% + edge 4–8\n")
cat("⚠️ INFO:        Edge > 12 + sharps confirm — your call\n")
cat("⚠️ TBD:         Unannounced starter\n")
cat("⚠️ THIN SP:     SP sample < 50%\n")
cat("⚪ SKIP:        Conf < 55%\n")
cat("🔴 FADE:        Edge > 12 no confirm OR sharps disagree\n")
cat("\nMove: line movement on home (negative = home shortened)\n")
# ============================================================
#  PHASE 11 — JSON EXPORT FOR WEBSITE
# ============================================================
cat("\nPhase 11: writing JSON for website...\n")

library(jsonlite)

export_data <- list(
  generated_at = format(Sys.time(), "%Y-%m-%d %H:%M:%S %Z"),
  date = as.character(Sys.Date()),
  model_version = "V8",
  training_accuracy = round(acc * 100, 2),
  training_games = nrow(train),
  games = today %>%
    arrange(desc(final_home_prob)) %>%
    transmute(
      away_team,
      home_team,
      away_record = paste0(away_w, "-", away_l),
      home_record = paste0(home_w, "-", home_l),
      away_pitcher = coalesce(away_pitcher, "TBD"),
      home_pitcher = coalesce(home_pitcher, "TBD"),
      away_sp_ip = coalesce(asp_IP, 0),
      home_sp_ip = coalesce(hsp_IP, 0),
      away_sp_weight = round(a_sample_w * 100, 0),
      home_sp_weight = round(h_sample_w * 100, 0),
      venue = venue_name,
      park_factor = pf,
      away_ml = away_ml,
      home_ml = home_ml,
      ml_open_home = home_ml_open,
      line_move = home_move,
      sharp_signal,
      model_prob_home = round(model_home_prob * 100, 1),
      vegas_prob_home = ifelse(is.na(vegas_home_prob), NA,
                               round(vegas_home_prob * 100, 1)),
      final_prob_home = round(final_home_prob * 100, 1),
      pick = ifelse(final_home_prob > 0.5, home_team, away_team),
      confidence = round(pmax(final_home_prob, final_away_prob) * 100, 1),
      edge = ifelse(is.na(vegas_home_prob), NA,
                    round((model_home_prob - vegas_home_prob) * 100, 1)),
      over_under,
      tbd_flag = ifelse(tbd_flag == "", NA, tbd_flag),
      thin_sp = a_sample_w < 0.5 | h_sample_w < 0.5
    )
)

output_dir <- "predictions"
if (!dir.exists(output_dir)) dir.create(output_dir)

filename <- file.path(output_dir,
                      paste0("predictions_", Sys.Date(), ".json"))

write_json(export_data, filename, pretty = TRUE, auto_unbox = TRUE,
           na = "null")

cat("✓ Wrote", nrow(today), "games to:", filename, "\n")