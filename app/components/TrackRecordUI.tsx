"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import TeamLogo from "./TeamLogo";
import type { ResultsData, PickRecord } from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function fmtTrackingDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function hitRateColor(rate: number | null): string {
  if (rate === null) return "#7d8590";
  if (rate >= 55) return "#00e088";
  if (rate >= 50) return "#fb923c";
  return "#7d8590";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: "PLAY" | "LEAN" }) {
  const isPlay = tier === "PLAY";
  return (
    <span
      className="shrink-0 uppercase font-semibold"
      style={{
        fontSize: 9,
        letterSpacing: "0.12em",
        padding: "2px 8px",
        borderRadius: 999,
        color: isPlay ? "#10b981" : "#f59e0b",
        background: isPlay ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
        border: `1px solid ${isPlay ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
      }}
    >
      {tier}
    </span>
  );
}

function ResultBadge({ outcome }: { outcome: string }) {
  const map: Record<string, { icon: string; color: string; label: string }> = {
    WIN:     { icon: "✓", color: "#00e088", label: "WIN" },
    LOSS:    { icon: "✗", color: "#fb923c", label: "LOSS" },
    PUSH:    { icon: "—", color: "#7d8590", label: "PUSH" },
    PENDING: { icon: "·", color: "#7d8590", label: "Pending" },
  };
  const c = map[outcome] ?? map.PENDING;
  return (
    <span
      className="font-mono shrink-0"
      style={{ fontSize: 13, color: c.color, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}
    >
      {c.icon} {c.label}
    </span>
  );
}

function StatCell({
  value,
  label,
  valueColor = "#ffffff",
}: {
  value: string;
  label: string;
  valueColor?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 px-4"
      style={{ background: "#0f1422", borderBottom: "1px solid #1a2335" }}
    >
      <div
        className="font-mono font-bold"
        style={{ fontSize: 48, color: valueColor, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}
      >
        {value}
      </div>
      <div
        className="uppercase font-mono mt-3"
        style={{ fontSize: 11, color: "#7d8590", letterSpacing: "0.12em" }}
      >
        {label}
      </div>
    </div>
  );
}

// ── Sport stats panel ─────────────────────────────────────────────────────────

function SportPanel({ data, sportLabel }: { data: ResultsData; sportLabel: string }) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const completed = data.results.filter((r) => r.outcome !== "PENDING");
  const wins  = completed.filter((r) => r.outcome === "WIN").length;
  const losses = completed.filter((r) => r.outcome === "LOSS").length;
  const wl = wins + losses;
  const rate = wl > 0 ? (wins / wl) * 100 : null;

  const plays = data.results.filter((r) => r.tier === "PLAY");
  const playsC = plays.filter((r) => r.outcome !== "PENDING");
  const playsW = playsC.filter((r) => r.outcome === "WIN").length;
  const playsL = playsC.filter((r) => r.outcome === "LOSS").length;
  const playsRate = (playsW + playsL) > 0 ? (playsW / (playsW + playsL)) * 100 : null;

  const leans = data.results.filter((r) => r.tier === "LEAN");
  const leansC = leans.filter((r) => r.outcome !== "PENDING");
  const leansW = leansC.filter((r) => r.outcome === "WIN").length;
  const leansL = leansC.filter((r) => r.outcome === "LOSS").length;
  const leansRate = (leansW + leansL) > 0 ? (leansW / (leansW + leansL)) * 100 : null;

  const sampleSize = completed.length;
  const sorted = [...data.results].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      {/* Subtitle */}
      <p style={{ fontSize: 14, color: "#7d8590", marginBottom: 32 }}>
        {sportLabel} · Tracking since {fmtTrackingDate(data.tracking_start_date)}
      </p>

      {/* Hero stats */}
      <div className="mb-10">
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-xl overflow-hidden"
          style={{ background: "#1a2335", border: "1px solid #1a2335" }}
        >
          <StatCell value={`${wins}-${losses}`} label="Overall" />
          <StatCell
            value={rate !== null ? `${rate.toFixed(1)}%` : "—"}
            label="Hit Rate"
            valueColor={hitRateColor(rate)}
          />
          <StatCell value={String(sampleSize)} label="Picks" />
        </div>
        <p className="mt-3 text-center" style={{ fontSize: 12, color: "#7d8590" }}>
          Sample size will grow with the season — early results have high variance.
        </p>
      </div>

      {/* By-tier breakdown */}
      <div className="mb-10">
        <h2
          className="uppercase mb-4"
          style={{ fontSize: 12, letterSpacing: "0.2em", color: "#c9d1d9", fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}
        >
          By Tier
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ background: "#0f1422", border: "2px solid rgba(16,185,129,0.3)" }}>
            <TierBadge tier="PLAY" />
            <div className="font-mono font-bold mt-4" style={{ fontSize: 36, color: "#ffffff", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {playsW}-{playsL}
            </div>
            <div className="font-mono mt-1" style={{ fontSize: 18, color: hitRateColor(playsRate), fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
              {playsRate !== null ? `${playsRate.toFixed(1)}%` : "—"}
            </div>
            <div style={{ fontSize: 12, color: "#7d8590", marginTop: 6 }}>Expected: 60%</div>
          </div>
          <div className="rounded-xl p-5" style={{ background: "#0f1422", border: "2px solid rgba(245,158,11,0.3)" }}>
            <TierBadge tier="LEAN" />
            <div className="font-mono font-bold mt-4" style={{ fontSize: 36, color: "#ffffff", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
              {leansW}-{leansL}
            </div>
            <div className="font-mono mt-1" style={{ fontSize: 18, color: hitRateColor(leansRate), fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
              {leansRate !== null ? `${leansRate.toFixed(1)}%` : "—"}
            </div>
            <div style={{ fontSize: 12, color: "#7d8590", marginTop: 6 }}>Expected: 54%</div>
          </div>
        </div>
      </div>

      {/* Recent picks */}
      <div className="mb-10">
        <h2
          className="uppercase mb-4"
          style={{ fontSize: 12, letterSpacing: "0.2em", color: "#c9d1d9", fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}
        >
          Recent Picks
        </h2>

        {/* Archive note when track record has been reset */}
        {data.note && sampleSize === 0 && (
          <div
            className="rounded-xl px-5 py-4 mb-6 flex items-start gap-3"
            style={{ background: "#0f1422", border: "1px solid #2a3548" }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>📁</span>
            <p style={{ fontSize: 13, color: "#7d8590", lineHeight: 1.6 }}>
              {data.note}
            </p>
          </div>
        )}

        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1a2335" }}>
          {sorted.length === 0 ? (
            <div className="px-5 py-10 text-center" style={{ background: "#0f1422" }}>
              <p style={{ fontSize: 14, color: "#4a5568" }}>No picks recorded yet.</p>
            </div>
          ) : (
            sorted.map((pick: PickRecord, i: number) => {
              const key = `${pick.date}-${pick.matchup}`;
              const isOpen = expandedKeys.has(key);
              const awayName = pick.away_team.split(" ").pop()!;
              const homeName = pick.home_team.split(" ").pop()!;

              return (
                <div key={key} style={{ borderTop: i > 0 ? "1px solid #1a2335" : "none" }}>
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className="w-full text-left touch-manipulation"
                    style={{ background: "#0f1422", border: "none", cursor: "pointer", padding: 0, display: "block" }}
                  >
                    {/* Desktop row */}
                    <div className="hidden sm:flex items-center gap-3 px-4 py-3">
                      <span className="font-mono shrink-0" style={{ fontSize: 12, color: "#c9d1d9", fontVariantNumeric: "tabular-nums", minWidth: 48 }}>
                        {fmtDate(pick.date)}
                      </span>
                      <div className="flex items-center shrink-0" style={{ gap: 3 }}>
                        <TeamLogo teamName={pick.away_team} size={24} />
                        <TeamLogo teamName={pick.home_team} size={24} />
                      </div>
                      <span className="flex-1 min-w-0" style={{ fontSize: 14, color: "#ffffff", fontWeight: 500 }}>
                        {awayName} @ {homeName}
                      </span>
                      <TierBadge tier={pick.tier} />
                      <span className="shrink-0" style={{ fontSize: 13, color: "#c9d1d9", minWidth: 110 }}>
                        {pick.pick}
                      </span>
                      <ResultBadge outcome={pick.outcome} />
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0"
                        style={{ color: "#7d8590", transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s" }}>
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>

                    {/* Mobile row */}
                    <div className="sm:hidden px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex items-center shrink-0" style={{ gap: 3 }}>
                            <TeamLogo teamName={pick.away_team} size={20} />
                            <TeamLogo teamName={pick.home_team} size={20} />
                          </div>
                          <span style={{ fontSize: 14, color: "#ffffff", fontWeight: 500 }}>
                            {awayName} @ {homeName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <ResultBadge outcome={pick.outcome} />
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
                            style={{ color: "#7d8590", transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s" }}>
                            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="font-mono" style={{ fontSize: 11, color: "#7d8590" }}>{fmtDate(pick.date)}</span>
                        <TierBadge tier={pick.tier} />
                        <span style={{ fontSize: 12, color: "#7d8590" }}>{pick.pick}</span>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 py-5" style={{ background: "#0a0e1a", borderTop: "1px solid #1a2335" }}>
                      <div className="mb-4">
                        <div className="uppercase mb-2" style={{ fontSize: 9, letterSpacing: "0.12em", color: "#7d8590" }}>
                          The Read
                        </div>
                        <p style={{ fontSize: 14, color: "#c9d1d9", lineHeight: 1.65 }}>{pick.the_read}</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
                        {[
                          { label: "Model Prob", value: `${(pick.model_prob * 100).toFixed(1)}%` },
                          { label: "Edge vs Market", value: `+${(pick.edge * 100).toFixed(1)}%` },
                          { label: "Confidence Weight", value: `+${(pick.confidence_weight * 100).toFixed(1)}%` },
                          { label: "Final Score", value: pick.final_score ?? "Pending" },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <div style={{ fontSize: 9, color: "#7d8590", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>
                              {label}
                            </div>
                            <div className="font-mono" style={{ fontSize: 13, color: "#c9d1d9", fontVariantNumeric: "tabular-nums" }}>
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Calibration placeholder */}
      <div className="mb-10 rounded-xl px-8 py-10 text-center" style={{ background: "#0f1422", border: "1px solid #1a2335" }}>
        <h2
          className="uppercase mb-5"
          style={{ fontSize: 12, letterSpacing: "0.2em", color: "#c9d1d9", fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}
        >
          Calibration
        </h2>
        <p style={{ fontSize: 15, color: "#c9d1d9", lineHeight: 1.75, maxWidth: 560, margin: "0 auto 12px" }}>
          Calibration measures whether the model&apos;s predicted probabilities match real-world outcomes.
          When the model predicts 60%, those picks should win 60% of the time over a meaningful sample.
        </p>
        <p style={{ fontSize: 15, color: "#c9d1d9", lineHeight: 1.75, maxWidth: 560, margin: "0 auto" }}>
          Full calibration chart will appear after 50+ picks. Current sample:{" "}
          <span style={{ fontWeight: 700, color: "#ffffff" }}>
            {sampleSize} game{sampleSize !== 1 ? "s" : ""}
          </span>
          .
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  mlbData: ResultsData;
  nbaData: ResultsData;
}

const SPORT_LABELS: Record<string, string> = {
  mlb: "MLB · V10",
  nba: "NBA · V7",
  nfl: "NFL · V1",
};

const VALID_SPORTS = ["mlb", "nba"] as const;
type Sport = typeof VALID_SPORTS[number];

function TrackRecordContent({ mlbData, nbaData }: Props) {
  const searchParams = useSearchParams();
  const rawSport = searchParams.get("sport") ?? "mlb";
  const initial: Sport = VALID_SPORTS.includes(rawSport as Sport) ? (rawSport as Sport) : "mlb";

  const [sport, setSport] = useState<Sport>(initial);
  const data = sport === "mlb" ? mlbData : nbaData;

  function handleTabClick(s: Sport) {
    setSport(s);
    // Shallow URL update — no reload, preserves back/forward
    window.history.replaceState(null, "", `/track-record?sport=${s}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">

      {/* Page title */}
      <div className="mb-8">
        <h1
          className="uppercase"
          style={{ fontSize: 12, letterSpacing: "0.2em", color: "#c9d1d9", fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}
        >
          Track Record
        </h1>

        {/* Sport tabs */}
        <div className="flex items-center gap-1 mt-4">
          {VALID_SPORTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleTabClick(s)}
              className="px-4 py-1.5 rounded-md uppercase font-semibold transition-colors duration-150"
              style={{
                fontSize: 12,
                letterSpacing: "0.08em",
                color: sport === s ? "#e6edf3" : "#4a5568",
                background: sport === s ? "#1a2335" : "transparent",
                border: sport === s ? "1px solid #2a3548" : "1px solid transparent",
                cursor: "pointer",
                outline: "none",
                fontFamily: "var(--font-geist-mono)",
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <SportPanel
        key={sport}
        data={data}
        sportLabel={SPORT_LABELS[sport] ?? sport.toUpperCase()}
      />

      {/* Footer link */}
      <div className="pt-6" style={{ borderTop: "1px solid #1a2335" }}>
        <Link href="/methodology" className="nav-link" style={{ fontSize: 13, color: "#c9d1d9" }}>
          → Full methodology
        </Link>
      </div>
    </div>
  );
}

// Suspense wrapper keeps the parent page statically renderable
export default function TrackRecordUI(props: Props) {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-5 py-10" style={{ minHeight: "60vh" }} />}>
      <TrackRecordContent {...props} />
    </Suspense>
  );
}
