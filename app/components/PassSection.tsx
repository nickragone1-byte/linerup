"use client";

import { useState } from "react";
import type { Game } from "@/lib/types";
import type { Tier } from "@/lib/types";

export interface PassGame {
  game: Game;
  internalTier: Tier;
  reason: string;
  narrative: string;
}

function formatML(ml: number): string {
  return ml > 0 ? `+${ml}` : `${ml}`;
}

function PassRow({ item }: { item: PassGame }) {
  const [expanded, setExpanded] = useState(false);
  const { game, reason, narrative } = item;
  const isHome = game.pick === game.home_team;
  const pickML = formatML(isHome ? game.home_ml : game.away_ml);

  return (
    <div className="border-b border-zinc-800/40 last:border-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 py-3 px-1 text-left hover:bg-zinc-800/20 rounded transition-colors min-h-[44px] touch-manipulation"
      >
        <div className="flex items-center gap-3 min-w-0">
          <svg
            className={`w-3 h-3 text-zinc-700 shrink-0 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-sm text-zinc-500 truncate">
            {game.away_team} @ {game.home_team}
          </span>
        </div>
        <span className="text-xs text-zinc-700 whitespace-nowrap shrink-0">{reason}</span>
      </button>

      {expanded && (
        <div className="pb-4 pl-6 pr-1 space-y-3">
          <p className="text-xs text-zinc-600 leading-relaxed">{narrative}</p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-xs">
            <div>
              <span className="text-zinc-700">Pick </span>
              <span className="text-zinc-500">
                {game.pick} {pickML}
              </span>
            </div>
            <div>
              <span className="text-zinc-700">Conf </span>
              <span className="text-zinc-500">{game.confidence.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-zinc-700">Edge </span>
              <span className="text-zinc-500">
                {game.edge > 0 ? "+" : ""}
                {game.edge.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-zinc-700">Away SP </span>
              <span className="text-zinc-500">{game.away_pitcher}</span>
            </div>
            <div>
              <span className="text-zinc-700">Home SP </span>
              <span className="text-zinc-500">{game.home_pitcher}</span>
            </div>
            <div>
              <span className="text-zinc-700">O/U </span>
              <span className="text-zinc-500">{game.over_under ?? "—"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PassSection({ items }: { items: PassGame[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-zinc-900/40 transition-colors min-h-[52px] touch-manipulation"
      >
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-zinc-700 shrink-0" />
          <span className="text-sm text-zinc-500">
            {items.length} game{items.length !== 1 ? "s" : ""} with no clean edge
          </span>
          <span className="text-[11px] bg-zinc-800 text-zinc-600 px-2 py-0.5 rounded-full tabular-nums">
            {items.length}
          </span>
        </div>
        <span className="text-xs text-zinc-700 whitespace-nowrap">
          {expanded ? "Collapse" : "Expand"} ↕
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-1 border-t border-zinc-800/60">
          {items.map((item) => (
            <PassRow
              key={`${item.game.away_team}-${item.game.home_team}`}
              item={item}
            />
          ))}
        </div>
      )}
    </div>
  );
}
