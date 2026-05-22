"use client";

import { useState, useEffect } from "react";

interface Props {
  generatedAt: string;
  mobile?: boolean;
}

/**
 * Convert "2026-05-21 09:00:00 PDT" to a Date by building a proper
 * ISO-8601 string with a numeric offset. The Date constructor reliably
 * parses "2026-05-21T09:00:00-07:00" in every browser; it does NOT
 * reliably parse timezone abbreviations like "PDT".
 */
function parseGeneratedAt(generatedAt: string): Date | null {
  const parts = generatedAt.trim().split(" ");
  if (parts.length < 2) return null;
  const [datePart, timePart, tzPart = "PDT"] = parts;
  // PDT = UTC-7, PST = UTC-8; anything else treated as PDT
  const offset = tzPart === "PST" ? "-08:00" : "-07:00";
  const iso = `${datePart}T${timePart}${offset}`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export default function UpdatedLabel({ generatedAt, mobile = false }: Props) {
  // Start empty so server HTML and initial client render match (no hydration mismatch).
  // useEffect fires only in the browser, where toLocaleTimeString uses the real local TZ.
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    if (!generatedAt) return;
    const d = parseGeneratedAt(generatedAt);
    if (!d) return;
    setTimeStr(d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  }, [generatedAt]);

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
