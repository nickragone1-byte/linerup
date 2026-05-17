"use client";

import { useState } from "react";
import TeamLogo from "./TeamLogo";
import type { Game } from "@/lib/types";

interface Props {
  game: Game;
  narrative: string;
}

export default function LeanCard({ game, narrative }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isHome = game.pick === game.home_team;
  const pickEdge = isHome ? game.edge : -game.edge;

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
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>
                {game.pick.split(" ").pop()}
              </span>
              <span style={{ fontSize: 12, color: "#c9d1d9" }}>
                vs {(isHome ? game.away_team : game.home_team).split(" ").pop()}
              </span>
            </div>
            <p className="truncate" style={{ fontSize: 12, color: "#7d8590", marginTop: 2, lineHeight: 1.5 }}>
              {narrative}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="font-mono" style={{ fontSize: 14, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>
                {game.confidence.toFixed(0)}%
              </div>
              <div style={{ fontSize: 10, color: "#6e7681" }}>
                +{pickEdge.toFixed(1)}% edge
              </div>
            </div>
            <span
              className="px-2 py-0.5 rounded-full uppercase font-semibold"
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
              className="touch-manipulation"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#7d8590" }}
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

        {expanded && (
          <div className="mt-3 pt-3 grid grid-cols-2 gap-3" style={{ borderTop: "1px solid #1a2335" }}>
            {[
              { label: "Venue", value: game.venue },
              { label: "Line", value: `${game.away_ml > 0 ? "+" : ""}${game.away_ml} / ${game.home_ml > 0 ? "+" : ""}${game.home_ml}` },
              { label: (game.away_team.split(" ").pop() ?? "Away") + " SP", value: `${game.away_pitcher} (${game.away_sp_ip} IP)` },
              { label: (game.home_team.split(" ").pop() ?? "Home") + " SP", value: `${game.home_pitcher} (${game.home_sp_ip} IP)` },
              { label: "Sharp Signal", value: game.sharp_signal },
              { label: "Park Factor", value: game.park_factor.toFixed(2) },
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
