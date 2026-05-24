// Shared "Live model take" banner.
// Shown when the live model has materially diverged from the locked snapshot pick.
// The locked pick stays for the track record — this is purely informational.

interface LiveDriftBannerProps {
  lockedPick: string;
  lockedConfidence: number;
  livePick?: string | null;
  liveConfidence?: number | null;
  liveEdge?: number | null;
  liveModelDiverged?: boolean;
  livePickChanged?: boolean;
  liveUpdatedAt?: string | null;
}

export function LiveDriftBanner({
  lockedPick,
  lockedConfidence,
  livePick,
  liveConfidence,
  liveEdge,
  liveModelDiverged,
  livePickChanged,
  liveUpdatedAt,
}: LiveDriftBannerProps) {
  if (!liveModelDiverged || livePick == null || liveConfidence == null) return null;

  const confDelta = liveConfidence - lockedConfidence;
  const confDeltaStr = `${confDelta > 0 ? "+" : ""}${confDelta.toFixed(1)}pp`;

  // Abbreviate team name to last token for compactness
  const liveAbbr = livePick.split(" ").pop() ?? livePick;

  return (
    <div
      style={{
        background: "rgba(110,118,129,0.08)",
        border: "1px solid rgba(110,118,129,0.2)",
        borderRadius: 6,
        padding: "8px 10px",
        marginBottom: 10,
      }}
    >
      <div style={{ fontSize: 9, color: "#7d8590", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>
        Live Model Take
      </div>
      <div style={{ fontSize: 12, color: "#c9d1d9", lineHeight: 1.4 }}>
        {livePickChanged ? (
          <>
            Model now favors <span style={{ color: "#fb923c", fontWeight: 600 }}>{liveAbbr}</span> at {liveConfidence.toFixed(1)}%
            {liveEdge != null && <span style={{ color: "#6e7681" }}> (edge {liveEdge > 0 ? "+" : ""}{liveEdge.toFixed(1)})</span>}
          </>
        ) : (
          <>
            Confidence on {liveAbbr} now {liveConfidence.toFixed(1)}% <span style={{ color: "#6e7681" }}>({confDeltaStr} vs lock)</span>
          </>
        )}
      </div>
      <div style={{ fontSize: 10, color: "#6e7681", marginTop: 2 }}>
        Locked pick stays {lockedPick.split(" ").pop()} for track record.
      </div>
    </div>
  );
}
