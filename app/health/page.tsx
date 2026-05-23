import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

type CheckStatus = "OK" | "WARN" | "FAIL";

type Check = {
  status: CheckStatus;
  msg: string;
};

type HealthData = {
  generated_at: string;
  overall: CheckStatus;
  checks: Record<string, Check>;
};

const STATUS_COLOR: Record<CheckStatus, { bg: string; border: string; text: string; dot: string }> = {
  OK:   { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.25)",  text: "#22c55e", dot: "#22c55e" },
  WARN: { bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.25)", text: "#fb923c", dot: "#fb923c" },
  FAIL: { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.25)",  text: "#ef4444", dot: "#ef4444" },
};

async function loadHealth(): Promise<HealthData | null> {
  try {
    const p = path.join(process.cwd(), "public/data/health.json");
    const raw = await fs.readFile(p, "utf-8");
    return JSON.parse(raw) as HealthData;
  } catch {
    return null;
  }
}

export default async function HealthPage() {
  const health = await loadHealth();

  if (!health) {
    return (
      <main className="min-h-screen px-4 py-12" style={{ background: "#0a0e17", color: "#c9d1d9" }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Pipeline Health</h1>
          <p style={{ color: "#7d8590" }}>
            No health data available. The health check script may not have run yet.
          </p>
        </div>
      </main>
    );
  }

  const overall = STATUS_COLOR[health.overall];

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: "#0a0e17", color: "#c9d1d9" }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Pipeline Health</h1>
        <p style={{ fontSize: 12, color: "#7d8590", marginBottom: 24 }}>
          Last checked: {health.generated_at}
        </p>

        <div
          className="rounded-lg px-4 py-3 mb-6 flex items-center gap-3"
          style={{ background: overall.bg, border: `1px solid ${overall.border}` }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: overall.dot,
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: overall.text }}>
              Overall: {health.overall}
            </div>
            <div style={{ fontSize: 11, color: "#7d8590", marginTop: 2 }}>
              {health.overall === "OK"
                ? "All systems operational."
                : health.overall === "WARN"
                ? "Some non-critical issues — see details below."
                : "Critical issue detected — see details below."}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(health.checks).map(([key, check]) => {
            const c = STATUS_COLOR[check.status];
            return (
              <div
                key={key}
                className="rounded-md px-3 py-2 flex items-start gap-3"
                style={{ background: c.bg, border: `1px solid ${c.border}` }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: c.dot,
                    flexShrink: 0,
                    marginTop: 6,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 11, color: "#7d8590", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {key.replace(/_/g, " ")}
                  </div>
                  <div style={{ fontSize: 13, color: "#c9d1d9", marginTop: 2 }}>
                    {check.msg}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: c.text, fontWeight: 600 }}>
                  {check.status}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
