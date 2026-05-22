"use client";

import { useState } from "react";
import TeamLogo from "./TeamLogo";
import { teamAbbr } from "@/lib/teams";
import type { Game } from "@/lib/types";
import type { Tier } from "@/lib/types";
import { computeEV, fmtEV, evColor } from "@/lib/ev";

export interface PassItem {
  game: Game;
  internalTier: Tier;
  reason: string;
}

interface Props {
  items: PassItem[];
}

function fmtMLSafe(ml: number | null | undefined): string {
  if (ml == null) return "—";
  return ml > 0 ? `+${ml}` : `${ml}`;
}

function fmtSP(name: string, ip: number): string {
  if (!name || name === "TBD") return "TBD";
  return `${name.split(",")[0].split(" ").pop() ?? name} (${ip} IP)`;
}

export default function PassRow({ items }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  return (
    <section className="max-w-3xl mx-auto px-5 pb-4">
      {/* Trigger button */}
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
          Cautious Plays
        </span>
        <span
          className="font-mono"
          style={{ fontSize: 12, color: "#7d8590", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}
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
          {items.map(({ game }, i) => {
            const awaySP = fmtSP(game.away_pitcher, game.away_sp_ip);
            const homeSP = fmtSP(game.home_pitcher, game.home_sp_ip);
            const awayName = game.away_team.split(" ").pop()!;
            const homeName = game.home_team.split(" ").pop()!;

            // Model's favored side (for EV context)
            const favorsHome = game.model_prob_home >= 50;
            const favProb = favorsHome ? game.model_prob_home : 100 - game.model_prob_home;
            const favML = favorsHome ? game.home_ml : game.away_ml;
            const favAbbr = teamAbbr(favorsHome ? game.home_team : game.away_team);

            const ev = computeEV(favProb, favML);
            const evClr = ev !== null ? evColor(ev) : "#4a5568";
            const evPositive = ev !== null && ev >= 0;

            const awayML = fmtMLSafe(game.away_ml);
            const homeML = fmtMLSafe(game.home_ml);
            const hasLine = game.away_ml != null && game.home_ml != null;

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

                {/* Left: matchup + model read */}
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 13, color: "#c9d1d9", fontWeight: 600, lineHeight: 1.3 }}>
                    {awayName} @ {homeName}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 2 }}>
                    <span className="font-mono" style={{ fontSize: 11, color: "#6e7681", fontVariantNumeric: "tabular-nums" }}>
                      V10: {favProb.toFixed(1)}% {favAbbr}
                    </span>
                    <span style={{ fontSize: 11, color: "#2a3a55" }}>·</span>
                    <span style={{ fontSize: 11, color: "#6e7681" }}>{awaySP} vs {homeSP}</span>
                  </div>
                </div>

                {/* Right: EV pill + amount + moneyline */}
                <div className="shrink-0 text-right" style={{ minWidth: 90 }}>
                  {ev !== null ? (
                    <>
                      <div className="flex justify-end mb-1">
                        <span
                          className="font-semibold"
                          style={{
                            fontSize: 10,
                            letterSpacing: "0.04em",
                            padding: "1px 7px",
                            borderRadius: 999,
                            color: evClr,
                            background: evPositive ? "rgba(0,224,136,0.1)" : "rgba(251,146,60,0.1)",
                            border: `1px solid ${evPositive ? "rgba(0,224,136,0.25)" : "rgba(251,146,60,0.25)"}`,
                          }}
                        >
                          {evPositive ? "+EV" : "−EV"}
                        </span>
                      </div>
                      <div className="font-mono" style={{ fontSize: 11, color: evClr, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                        {fmtEV(ev)} / $100
                      </div>
                      <div className="font-mono" style={{ fontSize: 10, color: "#6e7681", fontVariantNumeric: "tabular-nums", marginTop: 1 }}>
                        {hasLine ? `${awayML} / ${homeML}` : "Line TBA"}
                      </div>
                    </>
                  ) : (
                    <span style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Line TBA
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
