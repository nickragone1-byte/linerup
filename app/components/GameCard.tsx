"use client";

import { useState } from "react";
import type { Game } from "@/lib/types";
import type { Tier } from "@/lib/types";
import type { DisplayTier } from "@/lib/display-tier";

function formatML(ml: number): string {
  return ml > 0 ? `+${ml}` : `${ml}`;
}

const TIER_CONFIG = {
  LOCK: {
    label: "LOCK",
    badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    accent: "border-l-emerald-500",
    dot: "bg-emerald-500",
  },
  PLAY: {
    label: "PLAY",
    badge: "bg-green-500/10 text-green-400 border border-green-500/20",
    accent: "border-l-green-500",
    dot: "bg-green-500",
  },
  LEAN: {
    label: "LEAN",
    badge: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    accent: "border-l-yellow-500",
    dot: "bg-yellow-500",
  },
} as const;

interface Props {
  game: Game;
  displayTier: Exclude<DisplayTier, "PASS">;
  internalTier: Tier;
  narrative: string;
}

export default function GameCard({ game, displayTier, internalTier, narrative }: Props) {
  const [whyOpen, setWhyOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);

  const cfg = TIER_CONFIG[displayTier];
  const isHome = game.pick === game.home_team;
  const pickML = formatML(isHome ? game.home_ml : game.away_ml);
  const modelPct = isHome ? game.model_prob_home : 100 - game.model_prob_home;
  const vegasPct = isHome ? game.vegas_prob_home : 100 - game.vegas_prob_home;
  const edgePos = game.edge > 0;

  // Suppress internalTier lint — it's available via View data for future use
  void internalTier;

  return (
    <div
      className={`rounded-lg border border-zinc-800 border-l-4 ${cfg.accent} bg-zinc-900/40`}
    >
      <div className="p-4 sm:p-5">
        {/* Tier badge + venue */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-widest ${cfg.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          <span className="text-[11px] text-zinc-600 truncate">{game.venue}</span>
        </div>

        {/* Pick */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xl font-semibold text-zinc-100 leading-snug">
            {game.pick}
          </span>
          <span className="text-base text-zinc-500 font-medium">{pickML}</span>
        </div>

        {/* Matchup */}
        <p className="text-sm text-zinc-500 mb-2">
          {game.away_team} ({game.away_record}) @ {game.home_team} ({game.home_record})
        </p>

        {/* Pitchers */}
        <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
          {game.away_pitcher}
          {game.away_sp_ip > 0 ? ` · ${game.away_sp_ip} IP` : ""} vs{" "}
          {game.home_pitcher}
          {game.home_sp_ip > 0 ? ` · ${game.home_sp_ip} IP` : ""}
        </p>

        {/* Toggle buttons */}
        <div className="flex gap-2 flex-wrap">
          <ToggleButton
            open={whyOpen}
            onClick={() => {
              setWhyOpen(!whyOpen);
              if (dataOpen) setDataOpen(false);
            }}
            label="Why this play"
          />
          <ToggleButton
            open={dataOpen}
            onClick={() => {
              setDataOpen(!dataOpen);
              if (whyOpen) setWhyOpen(false);
            }}
            label="View data"
          />
        </div>

        {/* Why this play */}
        {whyOpen && (
          <div className="mt-3 pt-3 border-t border-zinc-800/80 text-sm text-zinc-400 leading-relaxed">
            {narrative}
          </div>
        )}

        {/* View data */}
        {dataOpen && (
          <div className="mt-3 pt-3 border-t border-zinc-800/80">
            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              <Stat label="Confidence" value={`${game.confidence.toFixed(1)}%`} />
              <Stat label="Model" value={`${modelPct.toFixed(1)}%`} />
              <Stat label="Vegas" value={`${vegasPct.toFixed(1)}%`} />
              <Stat
                label="Edge"
                value={`${edgePos ? "+" : ""}${game.edge.toFixed(1)}%`}
                color={
                  game.edge > 8
                    ? "text-green-400"
                    : game.edge < 0
                    ? "text-red-400"
                    : "text-zinc-200"
                }
              />
              <Stat
                label="Line move"
                value={
                  game.line_move === 0
                    ? "None"
                    : `${game.line_move > 0 ? "+" : ""}${game.line_move}`
                }
              />
              <Stat label="O/U" value={String(game.over_under)} />
              <Stat
                label="Sharp"
                value={
                  game.sharp_signal === "neutral" ? "Neutral" : game.sharp_signal
                }
              />
              <Stat label="Park" value={`${game.park_factor}×`} />
              <Stat label="Away wt" value={`${game.away_sp_weight}%`} />
              <Stat label="Home wt" value={`${game.home_sp_weight}%`} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleButton({
  open,
  onClick,
  label,
}: {
  open: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors px-3 py-2 rounded-md bg-zinc-800/50 hover:bg-zinc-800 min-h-[36px]"
    >
      <svg
        className={`w-3 h-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
      {label}
    </button>
  );
}

function Stat({
  label,
  value,
  color = "text-zinc-200",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-sm font-medium ${color}`}>{value}</div>
    </div>
  );
}
