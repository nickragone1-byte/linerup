import Link from "next/link";
import { getResults } from "@/lib/data";
import type { PickRecord } from "@/lib/types";

function outcomeColor(outcome: string) {
  if (outcome === "WIN") return "#10b981";
  if (outcome === "LOSS") return "#ef4444";
  if (outcome === "PUSH") return "#6b7280";
  return "#4a5568";
}

function outcomeLabel(outcome: string) {
  if (outcome === "WIN") return "W";
  if (outcome === "LOSS") return "L";
  if (outcome === "PUSH") return "P";
  return "—";
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString([], {
    weekday: "short", month: "short", day: "numeric"
  });
}

function groupByDate(results: PickRecord[]) {
  const map = new Map<string, PickRecord[]>();
  for (const r of results) {
    if (!map.has(r.date)) map.set(r.date, []);
    map.get(r.date)!.push(r);
  }
  return map;
}

function DaySummary({ records }: { records: PickRecord[] }) {
  const wins = records.filter(r => r.outcome === "WIN").length;
  const losses = records.filter(r => r.outcome === "LOSS").length;
  const total = wins + losses;
  return (
    <span style={{ fontSize: 12, color: "#7d8590" }}>
      {wins}-{losses}{total > 0 ? ` (${Math.round(wins/total*100)}%)` : ""}
    </span>
  );
}

function PickRow({ record }: { record: PickRecord }) {
  const clr = outcomeColor(record.outcome);
  const lbl = outcomeLabel(record.outcome);
  const edgeStr = record.edge > 0 ? `+${record.edge}%` : `${record.edge}%`;
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #1a2335" }}>
      <div className="shrink-0 flex items-center justify-center font-bold"
        style={{ width: 28, height: 28, borderRadius: 6, background: `${clr}18`, color: clr, fontSize: 12, border: `1px solid ${clr}40` }}>
        {lbl}
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13, fontWeight: 600, color: "#c9d1d9" }}>{record.pick}</div>
        <div style={{ fontSize: 11, color: "#7d8590", marginTop: 2 }}>{record.matchup}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-1"
          style={{ background: record.tier === "PLAY" ? "rgba(16,185,129,0.1)" : "rgba(234,179,8,0.1)", color: record.tier === "PLAY" ? "#10b981" : "#eab308", fontSize: 10 }}>
          {record.tier}
        </div>
        <div style={{ fontSize: 11, color: "#4a5568" }}>
          {Math.round(record.model_prob * 100)}% · {edgeStr}
        </div>
        {record.final_score && (
          <div style={{ fontSize: 10, color: "#374151", marginTop: 2 }}>{record.final_score}</div>
        )}
      </div>
    </div>
  );
}

export default async function ResultsPage() {
  const [mlbResults, nbaResults] = await Promise.all([
    getResults("mlb"),
    getResults("nba"),
  ]);

  const allResults = [
    ...mlbResults.results.map(r => ({ ...r, sport: "MLB" })),
    ...nbaResults.results.map(r => ({ ...r, sport: "NBA" })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const mlbWins = mlbResults.results.filter(r => r.outcome === "WIN").length;
  const mlbLosses = mlbResults.results.filter(r => r.outcome === "LOSS").length;
  const nbaWins = nbaResults.results.filter(r => r.outcome === "WIN").length;
  const nbaLosses = nbaResults.results.filter(r => r.outcome === "LOSS").length;
  const totalWins = mlbWins + nbaWins;
  const totalLosses = mlbLosses + nbaLosses;
  const totalGames = totalWins + totalLosses;
  const winPct = totalGames > 0 ? Math.round(totalWins / totalGames * 100) : null;
  const byDate = groupByDate(allResults as PickRecord[]);

  return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 mb-8" style={{ fontSize: 12, color: "#4a5568" }}>
          ← Back to today
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Track Record</h1>
        <p style={{ fontSize: 13, color: "#4a5568", marginBottom: 32 }}>
          Every pick published before game time. Every result tracked.
        </p>

        {totalGames > 0 ? (
          <div className="grid grid-cols-3 gap-4 rounded-xl p-5 mb-8" style={{ background: "#0f1422", border: "1px solid #1a2335" }}>
            <div className="text-center">
              <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}>{totalWins}</div>
              <div style={{ fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.08em" }}>Wins</div>
            </div>
            <div className="text-center" style={{ borderLeft: "1px solid #1a2335", borderRight: "1px solid #1a2335" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: winPct && winPct >= 55 ? "#10b981" : "#c9d1d9" }}>
                {winPct !== null ? `${winPct}%` : "—"}
              </div>
              <div style={{ fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.08em" }}>Win Rate</div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: 28, fontWeight: 700, color: "#ef4444" }}>{totalLosses}</div>
              <div style={{ fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.08em" }}>Losses</div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-6 mb-8 text-center" style={{ background: "#0f1422", border: "1px solid #1a2335" }}>
            <p style={{ fontSize: 13, color: "#4a5568" }}>Results populate automatically after each day's games complete.</p>
            <p style={{ fontSize: 11, color: "#2a3a55", marginTop: 8 }}>Tracking started {mlbResults.tracking_start_date}</p>
          </div>
        )}

        {(mlbWins + mlbLosses > 0 || nbaWins + nbaLosses > 0) && (
          <div className="flex gap-3 mb-8">
            {mlbWins + mlbLosses > 0 && (
              <div className="flex-1 rounded-lg px-4 py-3" style={{ background: "#0f1422", border: "1px solid #1a2335" }}>
                <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>MLB V10</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#c9d1d9" }}>{mlbWins}-{mlbLosses}</div>
                <div style={{ fontSize: 11, color: "#4a5568" }}>57.4% OOS accuracy</div>
              </div>
            )}
            {nbaWins + nbaLosses > 0 && (
              <div className="flex-1 rounded-lg px-4 py-3" style={{ background: "#0f1422", border: "1px solid #1a2335" }}>
                <div style={{ fontSize: 10, color: "#4a5568", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>NBA V7</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#c9d1d9" }}>{nbaWins}-{nbaLosses}</div>
                <div style={{ fontSize: 11, color: "#4a5568" }}>68.2% OOS accuracy</div>
              </div>
            )}
          </div>
        )}

        {byDate.size > 0 && (
          <div className="space-y-4">
            {Array.from(byDate.entries()).map(([date, records]) => (
              <div key={date} className="rounded-xl overflow-hidden" style={{ border: "1px solid #1a2335" }}>
                <div className="flex items-center justify-between px-4 py-2" style={{ background: "#0f1422", borderBottom: "1px solid #1a2335" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#c9d1d9" }}>{formatDate(date)}</span>
                  <DaySummary records={records} />
                </div>
                {records.map((r, i) => (
                  <div key={i} style={{ background: "#0a0e1a" }}>
                    <PickRow record={r} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
