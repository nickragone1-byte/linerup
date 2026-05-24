"use client";

import { useState } from "react";
import type { Game } from "@/lib/types";
import type { DisplayTier } from "@/lib/display-tier";
import { LiveDriftBanner } from "./LiveDriftBanner";

function formatML(ml: number): string {
  return ml > 0 ? `+${ml}` : `${ml}`;
}

const TIER_STYLE: Record<Exclude<DisplayTier, "PASS">, { color: string; bg: string; border: string }> = {
  LOCK: { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  PLAY: { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  LEAN: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
};

interface Props {
  game: Game;
  displayTier: Exclude<DisplayTier, "PASS">;
  narrative: string;
  compact?: boolean;
}

export default function HeroPlayCard({ game, displayTier, narrative, compact = false }: Props) {
  const [expanded, setExpanded] = useState(false);

  const isHome = game.pick === game.home_team;
  const _hpML = isHome ? game.home_ml : game.away_ml;
  const pickML = _hpML != null ? formatML(_hpML as number) : "TBA";
  const ts = TIER_STYLE[displayTier];
  const modelPct = isHome ? game.model_prob_home : 100 - game.model_prob_home;
  const vegasPct = game.vegas_prob_home != null ? (isHome ? game.vegas_prob_home : 100 - game.vegas_prob_home) : null;

  return (
    <div
      className="rounded-lg px-6 py-7 sm:px-8 sm:py-9"
      style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}
    >
      {/* Tier badge + venue */}
      <div className="flex items-center justify-between mb-7">
        <span
          className="text-[10px] font-bold tracking-[0.14em] px-2.5 py-1 rounded-full"
          style={{ color: ts.color, background: ts.bg, border: `1px solid ${ts.border}` }}
        >
          {displayTier}
        </span>
        <span className="text-[12px]" style={{ color: "#444" }}>
          {game.venue}
        </span>
      </div>

      {/* Confidence — the visual centerpiece */}
      <div
        className="font-mono font-bold leading-none mb-5"
        style={{
          fontSize: compact ? "clamp(44px,10vw,54px)" : "clamp(52px,12vw,68px)",
          letterSpacing: "-0.04em",
          fontVariantNumeric: "tabular-nums",
          color: "#fff",
        }}
      >
        {game.confidence.toFixed(1)}
        <span
          className="font-normal"
          style={{
            fontSize: compact ? "clamp(20px,4vw,24px)" : "clamp(24px,5vw,30px)",
            color: "#444",
            marginLeft: "4px",
          }}
        >
          %
        </span>
      </div>

      {/* Pick + line */}
      <div className="flex items-baseline gap-3 mb-2">
        <span
          className="font-semibold leading-none tracking-[-0.02em]"
          style={{
            fontSize: compact ? "clamp(22px,5vw,28px)" : "clamp(26px,6vw,32px)",
            color: "#fff",
          }}
        >
          {game.pick}
        </span>
        <span
          className="font-mono font-medium"
          style={{ fontSize: "17px", color: "#555", fontVariantNumeric: "tabular-nums" }}
        >
          {pickML}
        </span>
      </div>

      {/* Matchup context */}
      <p className="mb-6" style={{ fontSize: "14px", color: "#555", lineHeight: 1.5 }}>
        {game.away_team} ({game.away_record}) @ {game.home_team} ({game.home_record})
      </p>

      {/* Narrative */}
      <p
        className="mb-6"
        style={{ fontSize: compact ? "15px" : "17px", color: "#ccc", lineHeight: 1.7 }}
      >
        {narrative}
      </p>

      {/* Expand trigger */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="touch-manipulation transition-colors duration-150"
        style={{
          fontSize: "13px",
          color: expanded ? "#fff" : "#555",
          minHeight: "44px",
          display: "flex",
          alignItems: "center",
        }}
      >
        {expanded ? "Hide the math ↑" : "View the math →"}
      </button>

      {/* Stats grid */}
      {expanded && (game.starter_changed_home || game.starter_changed_away) && (
        <div
          className="mt-5 rounded-md px-3 py-2 flex items-start gap-2"
          style={{ background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.25)" }}
        >
          <span style={{ fontSize: 12, lineHeight: 1 }}>⚠️</span>
          <p style={{ fontSize: 11, color: "#fb923c", lineHeight: 1.4 }}>
            Starter changed since this pick was locked. Pick remains frozen for track record integrity, but conditions have changed.
          </p>
        </div>
      )}
      {expanded && (
        <>
          <LiveDriftBanner
            lockedPick={game.pick}
            lockedConfidence={game.confidence}
            livePick={game.live_pick}
            liveConfidence={game.live_confidence}
            liveEdge={game.live_edge}
            liveModelDiverged={game.live_model_diverged}
            livePickChanged={game.live_pick_changed}
            liveUpdatedAt={game.live_updated_at}
          />
          <div
          className="mt-5 pt-6 grid grid-cols-3 sm:grid-cols-4 gap-y-5 gap-x-4"
          style={{ borderTop: "1px solid #1a1a1a" }}
        >
          <MathStat label="Model" value={`${modelPct.toFixed(1)}%`} />
          <MathStat label="Vegas" value={vegasPct != null ? `${vegasPct.toFixed(1)}%` : "—"} />
          <MathStat
            label="Edge"
            value={game.edge != null ? `${game.edge > 0 ? "+" : ""}${game.edge.toFixed(1)}%` : "—"}
            highlight={(game.edge ?? 0) > 6}
          />
          <MathStat label="O/U" value={game.over_under != null ? String(game.over_under) : "—"} />
          <MathStat
            label="Line move"
            value={
              game.line_move == null ? "—" : game.line_move === 0
                ? "—"
                : game.line_move != null ? `${game.line_move > 0 ? "+" : ""}${game.line_move}` : "—"
            }
          />
          <MathStat
            label="Sharp"
            value={game.sharp_signal == null ? "—" : game.sharp_signal === "neutral" ? "Neutral" : game.sharp_signal}
          />
          <MathStat label="Park" value={`${game.park_factor}×`} />
          <MathStat label="Away wt" value={`${game.away_sp_weight}%`} />
          <div className="col-span-2">
            <div
              className="uppercase mb-1"
              style={{ fontSize: "10px", color: "#444", letterSpacing: "0.1em" }}
            >
              Away SP
            </div>
            <div className="font-mono" style={{ fontSize: "12px", color: "#888" }}>
              {game.away_pitcher} · {game.away_sp_ip} IP{game.away_sp_siera != null ? ` · ${game.away_sp_siera} SIERA` : ""}{game.starter_changed_away ? ` (was ${game.original_away_pitcher ?? "?"})` : ""}
            </div>
          </div>
          <div className="col-span-2">
            <div
              className="uppercase mb-1"
              style={{ fontSize: "10px", color: "#444", letterSpacing: "0.1em" }}
            >
              Home SP
            </div>
            <div className="font-mono" style={{ fontSize: "12px", color: "#888" }}>
              {game.home_pitcher} · {game.home_sp_ip} IP{game.home_sp_siera != null ? ` · ${game.home_sp_siera} SIERA` : ""}{game.starter_changed_home ? ` (was ${game.original_home_pitcher ?? "?"})` : ""}
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

function MathStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div
        className="uppercase mb-1"
        style={{ fontSize: "10px", color: "#444", letterSpacing: "0.1em" }}
      >
        {label}
      </div>
      <div
        className="font-mono font-medium"
        style={{
          fontSize: "13px",
          color: highlight ? "#00ff88" : "#888",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}
