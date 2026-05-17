import Link from "next/link";
import { getResults } from "@/lib/data";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export default async function TrackRecordPage() {
  const results = await getResults("mlb");

  const allPicks = results.flatMap((day) => day.results);
  const plays = allPicks.filter((p) => p.tier === "PLAY");
  const leans = allPicks.filter((p) => p.tier === "LEAN");

  function rec(picks: typeof allPicks) {
    const w = picks.filter((p) => p.result === "W").length;
    const l = picks.filter((p) => p.result === "L").length;
    const pct = w + l > 0 ? ((w / (w + l)) * 100).toFixed(1) : null;
    return { w, l, pct };
  }

  const overallRec = rec(allPicks);
  const playsRec = rec(plays);
  const leansRec = rec(leans);

  return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      <Header />
      <div className="max-w-3xl mx-auto px-5 py-12">
        <h1
          className="mb-2 tracking-tight"
          style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "#e6edf3" }}
        >
          Track Record
        </h1>
        <p className="mb-10" style={{ fontSize: 15, color: "#4a5568" }}>
          Every pick. Every result. 2026 season.
        </p>

        {allPicks.length === 0 ? (
          <div
            className="rounded-xl px-8 py-12 text-center"
            style={{ background: "#0f1422", border: "1px solid #1a2335" }}
          >
            <p style={{ fontSize: 15, color: "#4a5568" }}>
              Results tracking begins once games complete.
            </p>
            <p className="mt-2" style={{ fontSize: 13, color: "#2a3a55" }}>
              V8 training accuracy: 57.1% on 7,619 games (2023–2026)
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div
              className="grid grid-cols-3 gap-px rounded-xl overflow-hidden mb-8"
              style={{ background: "#1a2335", border: "1px solid #1a2335" }}
            >
              {[
                { label: "Overall", rec: overallRec },
                { label: "Plays", rec: playsRec },
                { label: "Leans", rec: leansRec },
              ].map(({ label, rec: r }) => (
                <div key={label} className="px-5 py-5" style={{ background: "#0f1422" }}>
                  <div
                    className="uppercase mb-2"
                    style={{ fontSize: 10, color: "#2a3a55", letterSpacing: "0.1em" }}
                  >
                    {label}
                  </div>
                  <div
                    className="font-mono font-semibold"
                    style={{ fontSize: 22, color: "#e6edf3", fontVariantNumeric: "tabular-nums" }}
                  >
                    {r.w}-{r.l}
                  </div>
                  {r.pct && (
                    <div
                      className="font-mono"
                      style={{ fontSize: 12, color: "#4a5568", fontVariantNumeric: "tabular-nums" }}
                    >
                      {r.pct}%
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Full history */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid #1a2335" }}
            >
              {results
                .slice()
                .reverse()
                .map((day) => (
                  <div key={day.date} style={{ borderBottom: "1px solid #1a2335" }}>
                    <div
                      className="px-5 py-3 uppercase"
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        color: "#2a3a55",
                        background: "#0a0e1a",
                      }}
                    >
                      {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    {day.results.map((pick, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-5 py-3"
                        style={{ borderTop: "1px solid #1a2335", background: "#0f1422" }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span style={{ fontSize: 14, color: "#8b95a8" }}>{pick.pick}</span>
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
                              pick.result === "W"
                                ? "#10b981"
                                : pick.result === "L"
                                ? "#ef4444"
                                : "#4a5568",
                          }}
                        >
                          {pick.result}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </>
        )}

        <div className="flex items-center gap-6 pt-8 mt-8" style={{ borderTop: "1px solid #1a2335" }}>
          <Link href="/methodology" style={{ fontSize: 13, color: "#2a3a55" }}>
            Methodology →
          </Link>
          <Link href="/about" style={{ fontSize: 13, color: "#2a3a55" }}>
            About →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
