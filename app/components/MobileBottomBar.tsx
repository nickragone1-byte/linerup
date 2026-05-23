"use client";

interface Props {
  playCount: number;
  leanCount: number;
  modelInfo?: string;
}

export default function MobileBottomBar({ playCount, leanCount, modelInfo = "V10 · 57.4%" }: Props) {
  const total = playCount + leanCount;
  if (total === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 sm:hidden z-40"
      style={{
        background: "rgba(10,14,26,0.97)",
        borderTop: "1px solid #1a2335",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center justify-center gap-6 px-5 py-3">
        <div className="text-center">
          <div
            className="font-mono font-semibold"
            style={{ fontSize: 18, color: "#10b981", fontVariantNumeric: "tabular-nums" }}
          >
            {playCount}
          </div>
          <div style={{ fontSize: 9, color: "#2a3a55", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Plays
          </div>
        </div>
        <div style={{ width: 1, height: 28, background: "#1a2335" }} />
        <div className="text-center">
          <div
            className="font-mono font-semibold"
            style={{ fontSize: 18, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}
          >
            {leanCount}
          </div>
          <div style={{ fontSize: 9, color: "#2a3a55", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Leans
          </div>
        </div>
        <div style={{ width: 1, height: 28, background: "#1a2335" }} />
        <div className="text-center">
          <div
            className="font-mono"
            style={{ fontSize: 11, color: "#4a5568" }}
          >
            {modelInfo}
          </div>
          <div style={{ fontSize: 9, color: "#2a3a55", letterSpacing: "0.08em" }}>
            OOS accuracy
          </div>
        </div>
      </div>
    </div>
  );
}
