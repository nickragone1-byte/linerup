"use client";

import { useState, useEffect } from "react";

interface Props {
  generatedAt: string;
  mobile?: boolean;
}

export default function UpdatedLabel({ generatedAt, mobile = false }: Props) {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    if (!generatedAt) return;

    // "2026-05-21 09:00:00 PDT" — Chrome/V8 parses this correctly, but
    // Firefox and Safari do not recognise "PDT"/"PST" as timezone identifiers.
    // Normalise to an unambiguous ISO-8601 offset string first, then fall back
    // to a straight new Date() if the string is already in another format.
    let d = new Date(
      generatedAt
        .replace(" PDT", "-07:00")
        .replace(" PST", "-08:00")
        .replace(" ", "T")   // "2026-05-21T09:00:00-07:00"
    );

    // Fallback: try the raw string (works in Chrome for PDT/PST abbreviations)
    if (isNaN(d.getTime())) {
      d = new Date(generatedAt);
    }

    if (isNaN(d.getTime())) return;

    // toLocaleTimeString with no timeZone option → always uses the
    // browser's local timezone, never UTC.
    setTimeStr(d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  }, [generatedAt]);

  // Render nothing until the effect has run in the browser.
  // This prevents the server-rendered HTML from ever containing a UTC time.
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
