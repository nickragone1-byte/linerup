"use client";

import Link from "next/link";
import TeamLogo from "./TeamLogo";
import type { ResultsData } from "@/lib/types";

interface Props {
  data: ResultsData;
}

function fmtYesterdayLabel(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }).toUpperCase();
}

function fmtTrackingDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getYesterdayPT(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

function TierBadge({ tier }: { tier: "PLAY" | "LEAN" }) {
  const isPlay = tier === "PLAY";
  return (
    <span
      className="shrink-0 uppercase font-semibold"
      style={{
        fontSize: 9,
        letterSpacing: "0.1em",
        padding: "2px 7px",
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

function ResultMark({ outcome }: { outcome: string }) {
  if (outcome === "WIN")  return <span style={{ fontSize: 13, color: "#00e088", fontWeight: 600 }}>✓ WIN</span>;
  if (outcome === "LOSS") return <span style={{ fontSize: 13, color: "#fb923c", fontWeight: 600 }}>✗ LOSS</span>;
  if (outcome === "PUSH") return <span style={{ fontSize: 13, color: "#7d8590" }}>— PUSH</span>;
  return <span style={{ fontSize: 13, color: "#7d8590" }}>Pending</span>;
}

export default function YesterdaySection({ data }: Props) {
  const yesterday = getYesterdayPT();
  const picks = data.results.filter((r) => r.date === yesterday);

  const trackingStart = data.tracking_start_date;
  const beforeTracking = trackingStart && yesterday < trackingStart;

  if (picks.length === 0) {
    return (
      <section
        className="max-w-3xl mx-auto px-5 py-8"
        style={{ borderTop: "1px solid #1a2335" }}
      >
        <h2
          className="uppercase mb-3"
          style={{ fontSize: 12, letterSpacing: "0.2em", color: "#c9d1d9", fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}
        >
          Yesterday
        </h2>
        <p style={{ fontSize: 14, color: "#4a5568" }}>
          {beforeTracking && trackingStart
            ? `Track record begins ${fmtTrackingDate(trackingStart)}.`
            : "No picks recorded for yesterday."}
        </p>
        <Link
          href="/track-record"
          className="nav-link"
          style={{ fontSize: 13, color: "#c9d1d9", display: "inline-block", marginTop: 12 }}
        >
          → Full track record
        </Link>
      </section>
    );
  }

  const completed = picks.filter((p) => p.outcome !== "PENDING");
  const wins  = completed.filter((p) => p.outcome === "WIN").length;
  const losses = completed.filter((p) => p.outcome === "LOSS").length;
  const recordColor = wins > losses ? "#00e088" : "#fb923c";

  return (
    <section
      className="max-w-3xl mx-auto px-5 py-8"
      style={{ borderTop: "1px solid #1a2335" }}
    >
      <div className="flex items-baseline justify-between mb-4">
        <h2
          className="uppercase"
          style={{ fontSize: 12, letterSpacing: "0.2em", color: "#c9d1d9", fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}
        >
          Yesterday · {fmtYesterdayLabel(yesterday)}
        </h2>
        <span
          className="font-mono font-semibold uppercase"
          style={{ fontSize: 12, color: recordColor, fontVariantNumeric: "tabular-nums", letterSpacing: "0.06em" }}
        >
          {wins}-{losses} Overall
        </span>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #1a2335" }}>
        {picks.map((pick, i) => {
          const awayName = pick.away_team.split(" ").pop()!;
          const homeName = pick.home_team.split(" ").pop()!;
          return (
            <div
              key={`${pick.date}-${pick.matchup}`}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderTop: i > 0 ? "1px solid #1a2335" : "none", background: "#0f1422" }}
            >
              <div className="flex items-center shrink-0" style={{ gap: 3 }}>
                <TeamLogo teamName={pick.away_team} size={22} />
                <TeamLogo teamName={pick.home_team} size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <span style={{ fontSize: 14, color: "#ffffff", fontWeight: 500 }}>
                  {awayName} @ {homeName}
                </span>
                <span className="ml-2" style={{ fontSize: 12, color: "#7d8590" }}>{pick.pick}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <TierBadge tier={pick.tier} />
                <ResultMark outcome={pick.outcome} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <Link href="/track-record" className="nav-link" style={{ fontSize: 13, color: "#c9d1d9" }}>
          → Full track record
        </Link>
      </div>
    </section>
  );
}
