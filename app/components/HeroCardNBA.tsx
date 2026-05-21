"use client";

import { useState } from "react";
import TeamLogo from "./TeamLogo";
import ProbabilityBar from "./ProbabilityBar";
import StatBox from "./StatBox";
import type { NBAGame } from "@/lib/types-nba";
import type { NBADisplayTier } from "@/lib/display-tier-nba";
import { computeEV, fmtEV, evColor } from "@/lib/ev";

interface Props {
  game: NBAGame;
  display: NBADisplayTier;
  narrative: string;
}

const TIER_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  LOCK: { color: "#fb923c", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)" },
  PLAY: { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  LEAN: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  PASS: { color: "#475569", bg: "rgba(71,85,105,0.08)", border: "rgba(71,85,105,0.2)" },
};

export default function HeroCardNBA({ game, display, narrative }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isHome = game.pick === game.home_team;
  const pickedSide: "away" | "home" = isHome ? "home" : "away";
  const pickEdge = isHome ? game.edge : -game.edge;
  const confidenceWeight = (game.confidence - 52.4).toFixed(1);
  const vegasImplied = isHome ? game.vegas_prob_home : 100 - game.vegas_prob_home;

  const style = TIER_STYLES[display] ?? TIER_STYLES.PLAY;

  const awayName = game.away_team.split(" ").pop()!;
  const homeName = game.home_team.split(" ").pop()!;

  // Spread display: pick's spread relative to their side
  const pickSpread = isHome ? game.vegas_spread : -game.vegas_spread;
  const spreadStr = pickSpread > 0 ? `+${pickSpread.toFixed(1)}` : pickSpread.toFixed(1);

  const stats = [
    { label: "Win Probability", mobileLabel: "Win %", value: `${game.confidence.toFixed(1)}%`, highlight: true },
    { label: "Edge vs Market", mobileLabel: "Edge", value: `+${pickEdge.toFixed(1)}%` },
    { label: "Confidence Weight", mobileLabel: "Weight", value: `+${confidenceWeight}%` },
  ];

  return (
    <div
      className="rounded-xl overflow-hidden mb-4"
      style={{ background: "#0f1422", border: `1px solid ${style.border}` }}
    >
      {/* ── DESKTOP header ── */}
      <div
        className="hidden sm:flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid #1a2335" }}
      >
        <span
          className="uppercase font-semibold"
          style={{ fontSize: 10, color: style.color, letterSpacing: "0.14em" }}
        >
          {display === "LOCK" ? "Model Favorite · Lock" : "Model Favorite"}
        </span>
        <span style={{ fontSize: 12, color: "#c9d1d9" }}>
          {isHome ? "Home" : "Away"}
        </span>
      </div>

      {/* ── MOBILE header ── */}
      <div
        className="flex sm:hidden items-center justify-end px-4 py-2"
        style={{ borderBottom: "1px solid #1a2335" }}
      >
        <span style={{ fontSize: 12, color: "#c9d1d9" }}>
          {isHome ? "Home" : "Away"}
        </span>
      </div>

      <div className="px-4 sm:px-5" style={{ paddingTop: 16, paddingBottom: 16 }}>

        {/* ── MOBILE matchup ── */}
        <div className="sm:hidden" style={{ marginBottom: 16 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <div className="flex items-center" style={{ gap: 12 }}>
              <TeamLogo teamName={game.away_team} size={40} />
              <span style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", lineHeight: 1.1, whiteSpace: "nowrap" }}>
                {awayName}
              </span>
            </div>
            <div className="flex items-center" style={{ gap: 12 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", lineHeight: 1.1, whiteSpace: "nowrap" }}>
                {homeName}
              </span>
              <TeamLogo teamName={game.home_team} size={40} />
            </div>
          </div>
          {/* Spread row instead of records for NBA */}
          <div className="flex items-center justify-center" style={{ gap: 8, userSelect: "none" }}>
            <span style={{ fontSize: 12, color: "#7d8590" }}>Spread</span>
            <span style={{ fontSize: 15, color: "#c9d1d9", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
              {game.pick.split(" ").pop()} {spreadStr}
            </span>
          </div>
        </div>

        {/* ── DESKTOP matchup ── */}
        <div className="hidden sm:flex items-center gap-3" style={{ marginBottom: 20 }}>
          <TeamLogo teamName={game.away_team} size={48} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span
                className="font-bold"
                style={{ fontSize: 28, color: "#ffffff", lineHeight: 1.1 }}
              >
                {awayName}
              </span>
            </div>
          </div>
          <span style={{ fontSize: 11, color: "#2a3a55" }}>vs</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span
                className="font-bold"
                style={{ fontSize: 28, color: "#ffffff", lineHeight: 1.1 }}
              >
                {homeName}
              </span>
            </div>
          </div>
          <TeamLogo teamName={game.home_team} size={48} />
        </div>

        {/* Probability bar */}
        <div style={{ marginBottom: 16 }}>
          <ProbabilityBar
            awayProb={100 - game.model_prob_home}
            homeProb={game.model_prob_home}
            pickedTeam={pickedSide}
          />
        </div>

        {/* Stat boxes */}
        <div style={{ marginBottom: 16 }}>
          <StatBox stats={stats} />
        </div>

        {/* THE READ */}
        <div style={{ marginBottom: 10 }}>
          <div
            className="uppercase"
            style={{ fontSize: 9, letterSpacing: "0.12em", color: "#7d8590", marginBottom: 6 }}
          >
            The Read
          </div>
          <p style={{ fontSize: 14, color: "#c9d1d9", lineHeight: 1.7 }}>{narrative}</p>
        </div>

        {/* EV display */}
        {(() => {
          const pickML = isHome ? game.home_ml : game.away_ml;
          const ev = computeEV(game.confidence, pickML);
          if (ev === null) return null;
          const color = evColor(ev);
          return (
            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: 11, color: "#7d8590" }}>EV per $100:</span>
              <span className="font-mono" style={{ fontSize: 12, color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {fmtEV(ev)}
              </span>
            </div>
          );
        })()}

        {/* Validated accuracy footnote */}
        <div
          className="flex items-start gap-2 rounded-md px-3 py-2"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)", marginBottom: 12 }}
        >
          <span style={{ fontSize: 13, lineHeight: 1 }}>📊</span>
          <p style={{ fontSize: 12, color: "#10b981", lineHeight: 1.5 }}>
            V7 validated at 68.2% out-of-sample on 6,258 NBA games.
          </p>
        </div>

        {/* View full data button */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 touch-manipulation rounded-md"
          style={{
            fontSize: 12,
            color: "#c9d1d9",
            background: "#0f1422",
            border: "1px solid #2a3548",
            cursor: "pointer",
            padding: "8px 16px",
            minHeight: 36,
          }}
        >
          <span>{expanded ? "Hide data" : "View full data"}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {expanded && (
          <div style={{ borderTop: "1px solid #1a2335", marginTop: 12, paddingTop: 16 }}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: `${awayName} Injuries`, value: `${game.a_top_missing} top-8 out`, sub: game.a_top_missing > 0 ? "rotation impacted" : "fully healthy" },
                { label: `${homeName} Injuries`, value: `${game.h_top_missing} top-8 out`, sub: game.h_top_missing > 0 ? "rotation impacted" : "fully healthy" },
                { label: "Vegas Spread", value: `${game.vegas_spread > 0 ? "+" : ""}${game.vegas_spread.toFixed(1)}`, sub: `Opened ${game.vegas_spread_open > 0 ? "+" : ""}${game.vegas_spread_open.toFixed(1)}` },
                { label: "Vegas Line", value: `${game.away_ml > 0 ? "+" : ""}${game.away_ml} / ${game.home_ml > 0 ? "+" : ""}${game.home_ml}`, sub: `O/U ${game.over_under}` },
                { label: "Vegas Implied", value: `${vegasImplied.toFixed(1)}%`, sub: "market win prob" },
                { label: "Sharp Signal", value: game.sharp_signal, sub: `Line move ${game.line_move > 0 ? "+" : ""}${game.line_move}` },
              ].map(({ label, value, sub }) => (
                <div key={label}>
                  <div style={{ fontSize: 9, color: "#7d8590", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 13, color: "#c9d1d9" }}>{value}</div>
                  <div style={{ fontSize: 11, color: "#6e7681" }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
