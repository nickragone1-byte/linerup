"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  modelVersion: string;
  accuracy: number;
  sport?: string;
}

export default function StickyHeader({ modelVersion, accuracy, sport = "mlb" }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 transition-colors duration-200"
      style={{
        background: scrolled ? "rgba(0,0,0,0.92)" : "#000",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #1a1a1a" : "1px solid transparent",
      }}
    >
      <div
        className="max-w-3xl mx-auto px-5 flex items-center justify-between"
        style={{ height: "52px" }}
      >
        {/* Wordmark */}
        <Link
          href="/mlb"
          className="text-[15px] font-semibold tracking-[-0.02em] text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          Liner<span style={{ color: "#00ff88" }}>u</span>p
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-6">
          {/* Sport tabs */}
          <nav className="flex items-center gap-5">
            <Link
              href="/mlb"
              className="text-[13px] font-medium pb-px"
              style={{
                color: sport === "mlb" ? "#fff" : "#555",
                borderBottom: sport === "mlb" ? "1px solid #00ff88" : "1px solid transparent",
                transition: "color 150ms",
              }}
            >
              MLB
            </Link>
            <span
              className="text-[13px] cursor-default select-none hidden sm:inline"
              style={{ color: "#3a3a3a" }}
            >
              NBA · October
            </span>
            <span
              className="text-[13px] cursor-default select-none hidden md:inline"
              style={{ color: "#3a3a3a" }}
            >
              NFL · August
            </span>
          </nav>

          {/* Model info */}
          <span
            className="font-mono text-[11px] whitespace-nowrap hidden sm:inline"
            style={{ color: "#555", fontVariantNumeric: "tabular-nums" }}
          >
            {modelVersion} · {accuracy.toFixed(1)}% all-time
          </span>
        </div>
      </div>
    </header>
  );
}
