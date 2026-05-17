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
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 touch-manipulation rounded-lg px-4"
        style={{
          background: "#0f1422",
          border: "1px solid #1a2335",
          cursor: "pointer",
          minHeight: 44,
          paddingTop: 10,
          paddingBottom: 10,
        }}
      >
        <span
          className="uppercase"
          style={{ fontSize: 12, letterSpacing: "0.10em", color: "#c9d1d9", fontWeight: 600 }}
        >
          Passes
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 12,
            color: "#fb923c",
            fontVariantNumeric: "tabular-nums",
            fontWeight: 700,
          }}
        >
          {items.length}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="ml-auto"
          style={{
            color: "#ffffff",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div
          className="rounded-lg overflow-hidden mt-1"
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
              <span style={{ fontSize: 13, color: "#c9d1d9" }}>
                {game.away_team.split(" ").pop()} @ {game.home_team.split(" ").pop()}
              </span>
              <span style={{ fontSize: 11, color: "#4a5568", flexShrink: 0, marginLeft: 12 }}>{reason}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
