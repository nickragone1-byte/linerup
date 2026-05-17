"use client";

import { useState } from "react";
import type { Game } from "@/lib/types";
import type { Tier } from "@/lib/types";

export interface PassItem {
  game: Game;
  internalTier: Tier;
  reason: string;
}

interface Props {
  items: PassItem[];
}

export default function PassRow({ items }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  return (
    <section className="max-w-3xl mx-auto px-5 pb-10">
      {/* 44px tap target for the toggle header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 touch-manipulation"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "10px 0",
          minHeight: 44,
          marginBottom: 4,
        }}
      >
        <span
          className="uppercase"
          style={{ fontSize: 11, letterSpacing: "0.12em", color: "#555" }}
        >
          Passes
        </span>
        <span
          className="font-mono"
          style={{ fontSize: 11, color: "#2a3a55", fontVariantNumeric: "tabular-nums" }}
        >
          ({items.length})
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{ color: "#2a3a55", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: "1px solid #1a2335" }}
        >
          {items.map(({ game, reason }, i) => (
            <div
              key={`${game.away_team}-${game.home_team}`}
              className="flex items-center justify-between px-4 py-3"
              style={{
                borderTop: i > 0 ? "1px solid #1a2335" : "none",
                background: "#0f1422",
                minHeight: 44,
              }}
            >
              <span style={{ fontSize: 13, color: "#4a5568" }}>
                {game.away_team.split(" ").pop()} @ {game.home_team.split(" ").pop()}
              </span>
              <span style={{ fontSize: 11, color: "#2a3a55", flexShrink: 0, marginLeft: 12 }}>{reason}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
