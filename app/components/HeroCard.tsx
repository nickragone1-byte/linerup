"use client";

import { useState } from "react";
import TeamLogo from "./TeamLogo";
import ProbabilityBar from "./ProbabilityBar";
import StatBox from "./StatBox";
import type { Game } from "@/lib/types";
import type { DisplayTier } from "@/lib/display-tier";

interface Props {
  game: Game;
  display: DisplayTier;
  narrative: string;
}

const TIER_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  LOCK: { color: "#fb923c", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)" },
  PLAY: { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  LEAN: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  PASS: { color: "#475569", bg: "rgba(71,85,105,0.08)", border: "rgba(71,85,105,0.2)" },
};

export default function HeroCard({ game, display, narrative }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isHome = game.pick === game.home_team;
  const pickedSide: "away" | "home" = isHome ? "home" : "away";
  const pickEdge = isHome ? game.edge : -game.edge;
  const confidenceWeight = (game.confidence - 52.4).toFixed(1);
  const vegasImplied = isHome ? game.vegas_prob_home : 100 - game.vegas_prob_home;

  const style = TIER_STYLES[display] ?? TIER_STYLES.PLAY;

  const stats = [
    { label: "Win Probability", value: `${game.confidence.toFixed(1)}%`, highlight: true },
    {
      label: "Edge vs Market",
      value: `+${pickEdge.toFixed(1)}%`,
      highlight: false,
    },
    {
      label: "Confidence Weight",
      value: `+${confidenceWeight}%`,
      highlight: false,
    },
  ];

  return (
    <div
      className="rounded-xl overflow-hidden mb-4"
      style={{ background: "#0f1422", border: `1px solid ${style.border}` }}
    >
      {/* Tier badge */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid #1a2335" }}
      >
        <span
          className="uppercase font-semibold tracking-widest"
          style={{
            fontSize: 10,
            color: style.color,
            letterSpacing: "0.14em",
          }}
        >
          {display === "LOCK" ? "Model Favorite · Lock" : "Model Favorite"}
        </span>
        <span style={{ fontSize: 12, color: "#4a5568" }}>
          {isHome ? "Home" : "Away"}
        </span>
      </div>

      <div className="px-5 pt-5 pb-4">
        {/* Teams row */}
        <div className="flex items-center gap-3 mb-5">
          <TeamLogo teamName={game.away_team} size={36} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span
                className="font-semibold truncate"
                style={{
                  fontSize: 15,
                  color: pickedSide === "away" ? "#e6edf3" : "#4a5568",
                }}
              >
                {game.away_team.split(" ").pop()}
              </span>
              <span className="font-mono shrink-0" style={{ fontSize: 12, color: "#4a5568" }}>
                {game.away_record}
              </span>
            </div>
          </div>
          <span style={{ fontSize: 11, color: "#2a3a55" }}>vs</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono shrink-0" style={{ fontSize: 12, color: "#4a5568" }}>
                {game.home_record}
              </span>
              <span
                className="font-semibold truncate text-right"
                style={{
                  fontSize: 15,
                  color: pickedSide === "home" ? "#e6edf3" : "#4a5568",
                }}
              >
                {game.home_team.split(" ").pop()}
              </span>
            </div>
          </div>
          <TeamLogo teamName={game.home_team} size={36} />
        </div>

        {/* Probability bar */}
        <div className="mb-4">
          <ProbabilityBar
            awayProb={100 - game.model_prob_home}
            homeProb={game.model_prob_home}
            pickedTeam={pickedSide}
          />
        </div>

        {/* Stat boxes */}
        <div className="mb-4">
          <StatBox stats={stats} />
        </div>

        {/* THE READ */}
        <div>
          <div
            className="uppercase mb-2"
            style={{ fontSize: 9, letterSpacing: "0.12em", color: "#2a3a55" }}
          >
            The Read
          </div>
          <p style={{ fontSize: 14, color: "#8b95a8", lineHeight: 1.7 }}>{narrative}</p>
        </div>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 flex items-center gap-1 touch-manipulation"
          style={{ fontSize: 12, color: "#2a3a55", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <span>{expanded ? "Less" : "More"}</span>
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
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid #1a2335" }}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Away Pitcher", value: game.away_pitcher, sub: `${game.away_sp_ip} IP` },
                { label: "Home Pitcher", value: game.home_pitcher, sub: `${game.home_sp_ip} IP` },
                { label: "Venue", value: game.venue, sub: `Park factor ${game.park_factor}` },
                { label: "Vegas Line", value: `${game.away_ml > 0 ? "+" : ""}${game.away_ml} / ${game.home_ml > 0 ? "+" : ""}${game.home_ml}`, sub: `O/U ${game.over_under}` },
                { label: "Vegas Implied", value: `${vegasImplied.toFixed(1)}%`, sub: "market win prob" },
                { label: "Sharp Signal", value: game.sharp_signal, sub: `Line move ${game.line_move > 0 ? "+" : ""}${game.line_move}` },
              ].map(({ label, value, sub }) => (
                <div key={label}>
                  <div style={{ fontSize: 9, color: "#2a3a55", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 13, color: "#8b95a8" }}>{value}</div>
                  <div style={{ fontSize: 11, color: "#2a3a55" }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
