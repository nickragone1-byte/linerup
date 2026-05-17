import Link from "next/link";
import type { DayResult } from "@/lib/types";

interface Props {
  results: DayResult[];
}

export default function YesterdaySection({ results }: Props) {
  const yesterday = results[results.length - 1];

  if (!yesterday || yesterday.results.length === 0) return null;

  const plays = yesterday.results.filter((r) => r.tier === "PLAY");
  const leans = yesterday.results.filter((r) => r.tier === "LEAN");
  const all = yesterday.results;

  function record(picks: typeof all) {
    const w = picks.filter((p) => p.result === "W").length;
    const l = picks.filter((p) => p.result === "L").length;
    return picks.length > 0 ? `${w}-${l}` : null;
  }

  const parts: string[] = [];
  const playsRec = record(plays);
  const leansRec = record(leans);
  const overallRec = record(all);
  if (playsRec) parts.push(`PLAYS ${playsRec}`);
  if (leansRec) parts.push(`LEANS ${leansRec}`);
  if (overallRec) parts.push(`Overall ${overallRec}`);

  const dateLabel = new Date(yesterday.date + "T12:00:00")
    .toLocaleDateString("en-US", { month: "long", day: "numeric" })
    .toUpperCase();

  return (
    <section
      className="max-w-3xl mx-auto px-5 py-8"
      style={{ borderTop: "1px solid #1a1a1a" }}
    >
      <div className="flex items-baseline justify-between mb-4">
        <h2
          className="uppercase"
          style={{ fontSize: "11px", letterSpacing: "0.12em", color: "#555" }}
        >
          Yesterday · {dateLabel}
        </h2>
        <Link
          href="/track-record"
          className="transition-colors duration-150"
          style={{ fontSize: "12px", color: "#444" }}
        >
          Full history →
        </Link>
      </div>

      <p
        className="font-mono mb-5"
        style={{ fontSize: "13px", color: "#666", fontVariantNumeric: "tabular-nums" }}
      >
        {parts.join(" · ")}
      </p>

      <div className="space-y-0">
        {all.map((pick, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3"
            style={{
              borderBottom: i < all.length - 1 ? "1px solid #111" : "none",
            }}
          >
            <div>
              <span style={{ fontSize: "14px", color: "#ccc" }}>{pick.pick}</span>
              <span className="ml-2" style={{ fontSize: "12px", color: "#444" }}>
                vs {pick.opponent}
              </span>
              <span
                className="ml-2 uppercase"
                style={{ fontSize: "10px", color: "#333", letterSpacing: "0.08em" }}
              >
                {pick.tier}
              </span>
            </div>
            <span
              className="font-mono font-medium"
              style={{
                fontSize: "14px",
                color:
                  pick.result === "W"
                    ? "#10b981"
                    : pick.result === "L"
                    ? "#ef4444"
                    : "#888",
              }}
            >
              {pick.result === "W" ? "W" : pick.result === "L" ? "L" : "P"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
