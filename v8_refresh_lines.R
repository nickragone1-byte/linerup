# ============================================================
#  V8 HOURLY LINE REFRESH
#  Reads today's predictions JSON, fetches current ESPN moneylines,
#  updates market-derived fields only. Model predictions stay locked.
#
#  Updated fields: away_ml, home_ml, line_move, sharp_signal,
#                  vegas_prob_home, final_prob_home, edge, generated_at
#  Unchanged:      model_prob_home, pick, confidence, all SP/lineup/park data
# ============================================================

suppressPackageStartupMessages({
  library(jsonlite)
  library(httr)
  library(dplyr)
})

`%||%` <- function(a, b) if (is.null(a) || length(a) == 0 || is.na(a)) b else a

# ── Load today's predictions JSON ─────────────────────────────────────────────
today_file <- file.path("predictions", paste0("predictions_", Sys.Date(), ".json"))

if (!file.exists(today_file)) {
  cat("No predictions file for today (", as.character(Sys.Date()), ") — 9am run hasn't happened yet. Skipping.\n", sep = "")
  quit(status = 0)
}

cat("Reading:", today_file, "\n")
predictions <- fromJSON(today_file, simplifyVector = FALSE)
n_games <- length(predictions$games)
cat("Games in file:", n_games, "\n")

# ── Fetch current ESPN odds ────────────────────────────────────────────────────
cat("Fetching ESPN scoreboard...\n")
espn <- tryCatch(
  content(GET("https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard"), "parsed"),
  error = function(e) { cat("ESPN fetch failed:", conditionMessage(e), "\n"); NULL }
)

if (is.null(espn) || length(espn$events) == 0) {
  cat("No ESPN data available — aborting line refresh.\n")
  quit(status = 1)
}

# ── Parse ESPN odds into a lookup table keyed by home_team name ───────────────
ml_to_imp <- function(ml) {
  if (is.null(ml) || is.na(ml)) return(NA_real_)
  ml <- as.numeric(ml)
  if (ml < 0) abs(ml) / (abs(ml) + 100) else 100 / (ml + 100)
}

odds_list <- lapply(espn$events, function(event) {
  tryCatch({
    comp  <- event$competitions[[1]]
    odds  <- comp$odds[[1]]

    home_ml      <- as.numeric(odds$moneyline$home$close$odds %||% NA)
    away_ml      <- as.numeric(odds$moneyline$away$close$odds %||% NA)
    home_ml_open <- as.numeric(odds$moneyline$home$open$odds  %||% NA)
    home_team    <- odds$homeTeamOdds$team$displayName %||% NA_character_

    if (is.na(home_team) || is.na(home_ml) || is.na(away_ml)) return(NULL)

    home_imp  <- ml_to_imp(home_ml)
    away_imp  <- ml_to_imp(away_ml)
    total_imp <- home_imp + away_imp
    vegas_home_prob <- if (!is.na(total_imp) && total_imp > 0) home_imp / total_imp else NA_real_

    home_move_raw <- if (!is.na(home_ml) && !is.na(home_ml_open)) home_ml - home_ml_open else NA_real_
    home_move     <- if (!is.na(home_move_raw) && abs(home_move_raw) <= 50) home_move_raw else NA_real_

    sharp_signal <- dplyr::case_when(
      is.na(home_move)    ~ "no data",
      home_move <= -15    ~ "\U0001f525 sharp on HOME",
      home_move <= -8     ~ "→ mild on HOME",
      home_move >=  15    ~ "\U0001f525 sharp on AWAY",
      home_move >=   8    ~ "← mild on AWAY",
      TRUE                ~ "neutral"
    )

    list(
      home_team       = home_team,
      home_ml         = home_ml,
      away_ml         = away_ml,
      line_move       = home_move,
      sharp_signal    = sharp_signal,
      vegas_home_prob = vegas_home_prob   # decimal 0–1
    )
  }, error = function(e) NULL)
})

odds_by_team <- Filter(Negate(is.null), odds_list)
names(odds_by_team) <- sapply(odds_by_team, `[[`, "home_team")
cat("ESPN odds parsed for", length(odds_by_team), "games\n")

# ── Update each game in predictions$games ─────────────────────────────────────
updated <- 0

predictions$games <- lapply(predictions$games, function(game) {
  live <- odds_by_team[[game$home_team]]
  if (is.null(live)) {
    cat("  No ESPN match for:", game$home_team, "\n")
    return(game)
  }

  # Market-derived updates
  game$home_ml      <- live$home_ml
  game$away_ml      <- live$away_ml
  game$line_move    <- if (!is.null(live$line_move)) round(live$line_move, 0) else NULL
  game$sharp_signal <- live$sharp_signal

  # Recompute vegas_prob_home (as percentage, 0–100)
  if (!is.null(live$vegas_home_prob) && !is.na(live$vegas_home_prob)) {
    new_vegas <- round(live$vegas_home_prob * 100, 1)
    game$vegas_prob_home <- new_vegas

    # Recompute final_prob_home = 70% model + 30% Vegas (as percentage)
    model_prob <- game$model_prob_home  # already percentage
    if (!is.null(model_prob) && !is.na(model_prob)) {
      game$final_prob_home <- round(0.70 * model_prob + 0.30 * new_vegas, 1)
      game$edge            <- round(model_prob - new_vegas, 1)
    }
  }

  updated <<- updated + 1
  cat("  Updated:", game$home_team, "| ML:", game$away_ml, "/", game$home_ml,
      "| Edge:", game$edge, "| Sharp:", game$sharp_signal, "\n")
  game
})

cat("\nUpdated", updated, "of", n_games, "games\n")

if (updated == 0) {
  cat("No games matched ESPN data — aborting write.\n")
  quit(status = 1)
}

# ── Update timestamp and write back ───────────────────────────────────────────
predictions$generated_at <- format(Sys.time(), "%Y-%m-%d %H:%M:%S %Z")

write_json(predictions, today_file, pretty = TRUE, auto_unbox = TRUE, na = "null")
cat("✓ Wrote updated predictions to:", today_file, "\n")
