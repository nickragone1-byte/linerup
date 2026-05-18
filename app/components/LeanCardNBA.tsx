"use client";

import { useState } from "react";
import TeamLogo from "./TeamLogo";
import type { NBAGame } from "@/lib/types-nba";

interface Props {
  game: NBAGame;
  narrative: string;
}

export default function LeanCardNBA({ game, narrative }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isHome = game.pick === game.home_team;
  const pickEdge = isHome ? game.edge : -game.edge;
  const opponent = (isHome ? game.away_team : game.home_team).split(" ").pop();
  const pickName = game.pick.split(" ").pop();

  const awayName = game.away_team.split(" ").pop() ?? "Away";
  const homeName = game.home_team.split(" ").pop() ?? "Home";

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: "#0f1422", border: "1px solid #1a2335" }}
    >
      <div className="px-4 py-3">
        {/* Main row */}
        <div className="flex items-center gap-3">
          <TeamLogo teamName={game.pick} size={40} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap" }}>
                {pickName}
              </span>
              <span style={{ fontSize: 12, color: "#c9d1d9", whiteSpace: "nowrap" }}>
                vs {opponent}
              </span>
            </div>
            <p className="truncate" style={{ fontSize: 12, color: "#7d8590", marginTop: 2, lineHeight: 1.5 }}>
              {narrative}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <div className="font-mono" style={{ fontSize: 14, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>
                {game.confidence.toFixed(0)}%
              </div>
              <div style={{ fontSize: 10, color: "#6e7681" }}>
                +{pickEdge.toFixed(1)}%
              </div>
            </div>
            <span
              className="hidden sm:inline-block px-2 py-0.5 rounded-full uppercase font-semibold"
              style={{
                fontSize: 9,
                letterSpacing: "0.1em",
                color: "#f59e0b",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              LEAN
            </span>
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
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
              >
                <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Validated accuracy footnote */}
        <div
          className="flex items-start gap-2 rounded-md px-3 py-2 mt-2"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}
        >
          <span style={{ fontSize: 12, lineHeight: 1 }}>📊</span>
          <p style={{ fontSize: 11, color: "#10b981", lineHeight: 1.5 }}>
            V6 validated at 68.0% out-of-sample on 1,305 NBA games.
          </p>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 grid grid-cols-2 gap-3" style={{ borderTop: "1px solid #1a2335" }}>
            {[
              { label: "Spread", value: `${game.vegas_spread > 0 ? "+" : ""}${game.vegas_spread.toFixed(1)}` },
              { label: "Line", value: `${game.away_ml > 0 ? "+" : ""}${game.away_ml} / ${game.home_ml > 0 ? "+" : ""}${game.home_ml}` },
              { label: `${awayName} injuries`, value: `${game.a_top_missing} top-8 out` },
              { label: `${homeName} injuries`, value: `${game.h_top_missing} top-8 out` },
              { label: "Sharp Signal", value: game.sharp_signal },
              { label: "O/U", value: game.over_under.toFixed(1) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 9, color: "#7d8590", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, color: "#c9d1d9" }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
