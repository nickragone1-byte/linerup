"use client";

import { useState } from "react";
import TeamLogo from "./TeamLogo";
import type { Game } from "@/lib/types";
import { MODEL_TRAINING_GAMES, MODEL_ACCURACY } from "@/lib/constants";
import { computeEV, fmtEV, evColor } from "@/lib/ev";
import { LiveDriftBanner } from "./LiveDriftBanner";

interface Props {
  game: Game;
  narrative: string;
}

function fmtMLSafe(ml: number | null | undefined): string {
  if (ml == null) return "—";
  return ml > 0 ? `+${ml}` : `${ml}`;
}

export default function LeanCard({ game, narrative }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isHome = game.pick === game.home_team;
  const opponent = (isHome ? game.away_team : game.home_team).split(" ").pop();
  const pickName = game.pick.split(" ").pop();

  const pickML = isHome ? game.home_ml : game.away_ml;
  const ev = computeEV(game.confidence, pickML);
  const evClr = ev !== null ? evColor(ev) : "#4a5568";
  const evPositive = ev !== null && ev >= 0;

  const awayML = fmtMLSafe(game.away_ml);
  const homeML = fmtMLSafe(game.home_ml);
  const hasLine = game.away_ml != null && game.home_ml != null;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: "#0f1422", border: "1px solid #1a2335" }}
    >
      <div className="px-4 py-3">
        {/* Main row */}
        <div className="flex items-center gap-4">
          <TeamLogo teamName={game.pick} size={36} />

          {/* Left: matchup + narrative */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap" style={{ gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap" }}>
                {pickName}
              </span>
              <span style={{ fontSize: 12, color: "#c9d1d9", whiteSpace: "nowrap" }}>
                vs {opponent}
              </span>
              {game.series_game_number > 1 && (
                <span style={{ fontSize: 10, color: game.series_finale ? "#fb923c" : "#4a5568", whiteSpace: "nowrap" }}>
                  {game.series_finale ? "Series finale" : `Game ${game.series_game_number}`}
                </span>
              )}
            </div>
            <p className="truncate" style={{ fontSize: 12, color: "#7d8590", marginTop: 2, lineHeight: 1.5 }}>
              {narrative}
            </p>
          </div>

          {/* Right: EV pill + amount + moneyline + chevron */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="text-right">
              {ev !== null ? (
                <>
                  <div className="flex justify-end mb-1">
                    <span
                      className="font-semibold"
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.04em",
                        padding: "2px 8px",
                        borderRadius: 999,
                        color: evClr,
                        background: evPositive ? "rgba(0,224,136,0.1)" : "rgba(251,146,60,0.1)",
                        border: `1px solid ${evPositive ? "rgba(0,224,136,0.25)" : "rgba(251,146,60,0.25)"}`,
                      }}
                    >
                      {evPositive ? "+EV" : "−EV"}
                    </span>
                  </div>
                  <div className="font-mono" style={{ fontSize: 12, color: evClr, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {fmtEV(ev)} / $100
                  </div>
                  <div className="font-mono" style={{ fontSize: 10, color: "#6e7681", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
                    {hasLine ? `${awayML} / ${homeML}` : "Line TBA"}
                  </div>
                </>
              ) : (
                <span style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {hasLine ? "No Line" : "Line TBA"}
                </span>
              )}
            </div>

            {/* Chevron expand button */}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="touch-manipulation flex items-center justify-center"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                width: 44,
                height: 44,
                color: "#7d8590",
                flexShrink: 0,
              }}
            >
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="none"
                style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
              >
                <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Proof line */}
        <div
          className="flex items-start gap-2 rounded-md px-3 py-2 mt-2"
          style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.12)" }}
        >
          <span style={{ fontSize: 12, lineHeight: 1 }}>📊</span>
          <p style={{ fontSize: 11, color: "#fb923c", lineHeight: 1.5 }}>
            V10 trained on {MODEL_TRAINING_GAMES.toLocaleString()} MLB games · {MODEL_ACCURACY}% honest out-of-sample accuracy.
          </p>
        </div>

        {expanded && (game.starter_changed_home || game.starter_changed_away) && (
          <div
            className="mt-3 rounded-md px-3 py-2 flex items-start gap-2"
            style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.25)" }}
          >
            <span style={{ fontSize: 12, lineHeight: 1 }}>⚠️</span>
            <p style={{ fontSize: 11, color: "#fb923c", lineHeight: 1.4 }}>
              Starter changed since this pick was locked. Pick remains frozen for track record integrity, but conditions have changed.
            </p>
          </div>
        )}
        {expanded && (
          <>
            <LiveDriftBanner
              lockedPick={game.pick}
              lockedConfidence={game.confidence}
              livePick={game.live_pick}
              liveConfidence={game.live_confidence}
              liveEdge={game.live_edge}
              liveModelDiverged={game.live_model_diverged}
              livePickChanged={game.live_pick_changed}
              liveUpdatedAt={game.live_updated_at}
            />
            <div className="mt-3 pt-3 grid grid-cols-2 gap-3" style={{ borderTop: "1px solid #1a2335" }}>
            {[
              { label: "Model %", value: `${isHome ? game.final_prob_home.toFixed(1) : (100 - game.final_prob_home).toFixed(1)}%`, full: false },
              { label: "Vegas %", value: game.vegas_prob_home != null ? `${(isHome ? game.vegas_prob_home : 100 - game.vegas_prob_home).toFixed(1)}%` : "—", full: false },
              { label: "Game Time", value: (() => {
                if (!game.game_time) return "TBD";
                const d = new Date(game.game_time);
                return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York", hour12: true }) + " ET";
              })(), full: false },
              { label: "Venue", value: game.venue, full: false },
              { label: "Series", value: game.series_game_number > 1 ? (game.series_finale ? `Game ${game.series_game_number} (finale)` : `Game ${game.series_game_number}`) : "Game 1", full: false },
              { label: "Line", value: hasLine ? `${awayML} / ${homeML}` : "Line TBA", full: false },
              { label: (game.away_team.split(" ").pop() ?? "Away") + " SP", value: `${game.away_pitcher} (${game.away_sp_ip} IP${game.away_sp_siera != null ? ` · ${game.away_sp_siera} SIERA` : ""})${game.starter_changed_away ? ` — was ${game.original_away_pitcher ?? "?"}` : ""}`, full: true },
              { label: (game.home_team.split(" ").pop() ?? "Home") + " SP", value: `${game.home_pitcher} (${game.home_sp_ip} IP${game.home_sp_siera != null ? ` · ${game.home_sp_siera} SIERA` : ""})${game.starter_changed_home ? ` — was ${game.original_home_pitcher ?? "?"}` : ""}`, full: true },
              { label: "Sharp Signal", value: game.sharp_signal ?? "—", full: false },
              { label: "Park Factor", value: game.park_factor.toFixed(2), full: false },
            ].map(({ label, value, full }) => (
              <div key={label} className={full ? "col-span-2" : ""}>
                <div style={{ fontSize: 9, color: "#7d8590", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, color: "#c9d1d9" }}>{value}</div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
