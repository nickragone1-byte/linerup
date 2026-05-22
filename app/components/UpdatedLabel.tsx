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

    const parseGeneratedAt = (str: string) => {
      return new Date(str
        .replace(' PDT', '-07:00')
        .replace(' PST', '-08:00')
        .replace(' UTC', '+00:00')
        .replace(' ', 'T')
      );
    };

    const d = parseGeneratedAt(generatedAt);

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
