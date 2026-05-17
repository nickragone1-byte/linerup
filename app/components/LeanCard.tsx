"use client";

import { useState } from "react";
import type { Game } from "@/lib/types";

function formatML(ml: number): string {
  return ml > 0 ? `+${ml}` : `${ml}`;
}

interface Props {
  game: Game;
  narrative: string;
}

export default function LeanCard({ game, narrative }: Props) {
  const [open, setOpen] = useState(false);

  const isHome = game.pick === game.home_team;
  const pickML = formatML(isHome ? game.home_ml : game.away_ml);
  const modelPct = isHome ? game.model_prob_home : 100 - game.model_prob_home;
  const vegasPct = isHome ? game.vegas_prob_home : 100 - game.vegas_prob_home;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left flex items-center gap-4 px-5 touch-manipulation transition-colors duration-150"
        style={{
          minHeight: "64px",
          background: open ? "#111" : "transparent",
          paddingTop: "14px",
          paddingBottom: "14px",
        }}
      >
        {/* Confidence */}
        <span
          className="font-mono font-semibold leading-none shrink-0"
          style={{
            fontSize: "26px",
            color: "#fff",
            width: "72px",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {game.confidence.toFixed(1)}
          <span style={{ fontSize: "13px", color: "#555", marginLeft: "2px" }}>%</span>
        </span>

        {/* Team + summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-medium text-white truncate" style={{ fontSize: "15px" }}>
              {game.pick}
            </span>
            <span
              className="font-mono shrink-0"
              style={{ fontSize: "13px", color: "#555", fontVariantNumeric: "tabular-nums" }}
            >
              {pickML}
            </span>
          </div>
          <p className="truncate" style={{ fontSize: "12px", color: "#555" }}>
            {narrative}
          </p>
        </div>

        {/* Chevron */}
        <svg
          className="shrink-0 transition-transform duration-200"
          style={{
            width: "14px",
            height: "14px",
            color: "#444",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5" style={{ borderTop: "1px solid #1a1a1a" }}>
          <p
            className="pt-4 mb-5"
            style={{ fontSize: "14px", color: "#666", lineHeight: 1.7 }}
          >
            {narrative}
          </p>
          <div className="grid grid-cols-3 gap-y-4 gap-x-4 mb-4">
            <LStat label="Model" value={`${modelPct.toFixed(1)}%`} />
            <LStat label="Vegas" value={`${vegasPct.toFixed(1)}%`} />
            <LStat
              label="Edge"
              value={`${game.edge > 0 ? "+" : ""}${game.edge.toFixed(1)}%`}
            />
            <LStat
              label="Line"
              value={
                game.line_move === 0
                  ? "—"
                  : `${game.line_move > 0 ? "+" : ""}${game.line_move}`
              }
            />
            <LStat
              label="Sharp"
              value={game.sharp_signal === "neutral" ? "—" : game.sharp_signal}
            />
            <LStat label="O/U" value={String(game.over_under)} />
          </div>
          <p style={{ fontSize: "12px", color: "#444" }}>
            {game.away_pitcher} ({game.away_sp_ip} ip) vs {game.home_pitcher} ({game.home_sp_ip} ip) · {game.venue}
          </p>
          <p className="mt-1" style={{ fontSize: "12px", color: "#333" }}>
            {game.away_team} ({game.away_record}) @ {game.home_team} ({game.home_record})
          </p>
        </div>
      )}
    </div>
  );
}

function LStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="uppercase mb-0.5"
        style={{ fontSize: "10px", color: "#444", letterSpacing: "0.1em" }}
      >
        {label}
      </div>
      <div
        className="font-mono"
        style={{ fontSize: "12px", color: "#888", fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </div>
    </div>
  );
}
