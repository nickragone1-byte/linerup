"use client";

interface Props {
  generatedAt: string;
  mobile?: boolean;
}

function parseToLocal(generatedAt: string): string {
  const parts = generatedAt.split(" ");
  if (parts.length < 2) return "";
  const [datePart, timePart, tzPart = "PDT"] = parts;
  const [yr, mo, da] = datePart.split("-").map(Number);
  const timePieces = timePart.split(":").map(Number);
  const h = timePieces[0] ?? 0;
  const m = timePieces[1] ?? 0;
  const s = timePieces[2] ?? 0;
  // PDT = UTC-7, PST = UTC-8
  const offsetHours = tzPart === "PST" ? 8 : 7;
  const utcDate = new Date(Date.UTC(yr, mo - 1, da, h + offsetHours, m, s));
  return utcDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function UpdatedLabel({ generatedAt, mobile = false }: Props) {
  if (!generatedAt) return null;
  const timeStr = parseToLocal(generatedAt);
  if (!timeStr) return null;

  if (mobile) {
    return (
      <div style={{ fontSize: 12, color: "#7d8590", marginTop: 2 }}>
        Updated at {timeStr}
      </div>
    );
  }
  return (
    <span style={{ fontSize: 13, color: "#7d8590" }}>· Updated at {timeStr}</span>
  );
}
