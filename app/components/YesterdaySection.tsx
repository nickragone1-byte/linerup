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
  if (playsRec) parts.push(`PLAYS ${playsRec}`);
  if (leansRec) parts.push(`LEANS ${leansRec}`);

  const dateLabel = new Date(yesterday.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <section
      className="max-w-3xl mx-auto px-5 py-8"
      style={{ borderTop: "1px solid #1a2335" }}
    >
      <div className="flex items-baseline justify-between mb-4">
        <h2
          className="uppercase"
          style={{ fontSize: 11, letterSpacing: "0.12em", color: "#4a5568" }}
        >
          Yesterday · {dateLabel}
        </h2>
        <Link
          href="/track-record"
          style={{ fontSize: 12, color: "#2a3a55" }}
        >
          Full history →
        </Link>
      </div>

      {parts.length > 0 && (
        <p
          className="font-mono mb-4"
          style={{ fontSize: 13, color: "#4a5568", fontVariantNumeric: "tabular-nums" }}
        >
          {parts.join(" · ")}
        </p>
      )}

      <div>
        {all.map((pick, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3"
            style={{ borderBottom: i < all.length - 1 ? "1px solid #1a2335" : "none" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span style={{ fontSize: 14, color: "#8b95a8" }} className="truncate">{pick.pick}</span>
              <span style={{ fontSize: 12, color: "#2a3a55" }}>vs {pick.opponent}</span>
              <span
                className="uppercase shrink-0"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  color: pick.tier === "PLAY" ? "#10b981" : "#f59e0b",
                }}
              >
                {pick.tier}
              </span>
            </div>
            <span
              className="font-mono font-medium shrink-0 ml-3"
              style={{
                fontSize: 14,
                color:
                  pick.result === "W" ? "#10b981" : pick.result === "L" ? "#ef4444" : "#4a5568",
              }}
            >
              {pick.result}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
