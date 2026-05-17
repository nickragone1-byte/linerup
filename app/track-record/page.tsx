import Link from "next/link";
import { getResults } from "@/lib/data";

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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-5 py-12">
        <Link
          href="/mlb"
          className="inline-block transition-colors duration-150 mb-10"
          style={{ fontSize: "13px", color: "#555" }}
        >
          ← Back
        </Link>

        <h1
          className="mb-2 tracking-tight"
          style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.03em" }}
        >
          Track Record
        </h1>
        <p className="mb-10" style={{ fontSize: "15px", color: "#555" }}>
          Every pick. Every result. 2026 season.
        </p>

        {allPicks.length === 0 ? (
          <div
            className="rounded-lg px-8 py-12 text-center"
            style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}
          >
            <p style={{ fontSize: "15px", color: "#555" }}>
              Results tracking begins once games complete.
            </p>
            <p className="mt-2" style={{ fontSize: "13px", color: "#333" }}>
              V8 training accuracy: 57.1% on 7,619 games (2023–2026)
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div
              className="grid grid-cols-3 gap-4 rounded-lg p-6 mb-8"
              style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}
            >
              {[
                { label: "Overall", rec: overallRec },
                { label: "Plays", rec: playsRec },
                { label: "Leans", rec: leansRec },
              ].map(({ label, rec: r }) => (
                <div key={label}>
                  <div
                    className="uppercase mb-2"
                    style={{ fontSize: "10px", color: "#444", letterSpacing: "0.1em" }}
                  >
                    {label}
                  </div>
                  <div
                    className="font-mono font-semibold"
                    style={{ fontSize: "22px", color: "#fff", fontVariantNumeric: "tabular-nums" }}
                  >
                    {r.w}-{r.l}
                  </div>
                  {r.pct && (
                    <div
                      className="font-mono"
                      style={{ fontSize: "12px", color: "#555", fontVariantNumeric: "tabular-nums" }}
                    >
                      {r.pct}%
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Full history */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid #1a1a1a" }}
            >
              {results
                .slice()
                .reverse()
                .map((day) => (
                  <div key={day.date} style={{ borderBottom: "1px solid #111" }}>
                    <div
                      className="px-5 py-3 uppercase"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                        color: "#444",
                        background: "#0a0a0a",
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
                        style={{ borderTop: "1px solid #0f0f0f" }}
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
                          {pick.result}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
