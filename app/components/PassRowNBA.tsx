"use client";

import { useState } from "react";
import TeamLogo from "./TeamLogo";
import { teamAbbr } from "@/lib/teams";
import type { NBAGame } from "@/lib/types-nba";
import type { NBATier } from "@/lib/types-nba";

export interface NBAPassItem {
  game: NBAGame;
  internalTier: NBATier;
  reason: string;
}

interface Props {
  items: NBAPassItem[];
}

function fmtML(ml: number): string {
  return ml > 0 ? `+${ml}` : `${ml}`;
}

function fmtSpread(spread: number): string {
  // spread is home-relative (negative = home favored)
  return spread > 0 ? `+${spread.toFixed(1)}` : spread.toFixed(1);
}

function reasonColor(reason: string): string {
  const r = reason.toLowerCase();
  if (r.includes("disagree") || r.includes("sharp") || r.includes("market"))
    return "#fb923c"; // amber — sharp fade
  return "#6e7681";   // gray — no edge
}

export default function PassRowNBA({ items }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  return (
    <section className="max-w-3xl mx-auto px-5 pb-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 touch-manipulation rounded-lg px-4"
        style={{
          background: "#0f1422",
          border: "1px solid #1a2335",
          outline: "none",
          cursor: "pointer",
          minHeight: 44,
          paddingTop: 10,
          paddingBottom: 10,
        }}
      >
        <span
          className="uppercase"
          style={{ fontSize: 12, letterSpacing: "0.2em", color: "#c9d1d9", fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}
        >
          Passes
        </span>
        <span
          className="font-mono"
          style={{ fontSize: 12, color: "#fb923c", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}
        >
          {items.length}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className="ml-auto"
          style={{ color: "#ffffff", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div className="rounded-lg overflow-hidden mt-1" style={{ border: "1px solid #1a2335" }}>
          {items.map(({ game, reason }, i) => {
            const awayML = fmtML(game.away_ml);
            const homeML = fmtML(game.home_ml);
            const awayName = game.away_team.split(" ").pop()!;
            const homeName = game.home_team.split(" ").pop()!;

            // V7's favored side even when no edge
            const v6FavorsHome = game.model_prob_home >= 50;
            const v6Prob = v6FavorsHome ? game.model_prob_home : 100 - game.model_prob_home;
            const v6Abbr = teamAbbr(v6FavorsHome ? game.home_team : game.away_team);
            const rColor = reasonColor(reason);

            return (
              <div
                key={`${game.away_team}-${game.home_team}`}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: i > 0 ? "1px solid #1a2335" : "none", background: "#0f1422" }}
              >
                {/* Logos */}
                <div className="flex items-center shrink-0" style={{ gap: 4 }}>
                  <TeamLogo teamName={game.away_team} size={24} />
                  <TeamLogo teamName={game.home_team} size={24} />
                </div>

                {/* Left: matchup + V7 read */}
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 13, color: "#c9d1d9", fontWeight: 600, lineHeight: 1.3 }}>
                    {awayName} @ {homeName}
                  </div>
                  <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                    <span className="font-mono" style={{ fontSize: 11, color: "#6e7681", fontVariantNumeric: "tabular-nums" }}>
                      V7: {v6Prob.toFixed(1)}% {v6Abbr}
                    </span>
                    <span style={{ fontSize: 11, color: "#2a3a55" }}>·</span>
                    <span style={{ fontSize: 11, color: "#6e7681" }}>
                      {game.is_playoff ? "Playoff" : "Regular season"} · Spread {fmtSpread(game.vegas_spread)}
                    </span>
                  </div>
                </div>

                {/* Right: moneyline + reason */}
                <div className="shrink-0 text-right" style={{ minWidth: 80 }}>
                  <div className="font-mono" style={{ fontSize: 12, color: "#7d8590", fontVariantNumeric: "tabular-nums" }}>
                    {awayML} / {homeML}
                  </div>
                  <div
                    className="uppercase"
                    style={{ fontSize: 9, color: rColor, letterSpacing: "0.08em", marginTop: 2, fontWeight: 600 }}
                  >
                    {reason}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
