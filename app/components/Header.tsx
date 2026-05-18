"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const SPORTS = [
  { label: "MLB", href: "/mlb" },
  { label: "NBA", href: "/nba" },
  { label: "NFL", href: "/nfl" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-200"
      style={{
        background: scrolled ? "rgba(10,14,26,0.96)" : "#0a0e1a",
        borderBottom: scrolled ? "1px solid #1a2335" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
      }}
    >
      <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link href="/mlb" style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.03em", color: "#e6edf3" }}>
            Line<span style={{ color: "#00e088" }}>r</span>up
          </Link>
          <span
            className="hidden sm:inline-block px-2 py-0.5 rounded-full"
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "#fb923c",
              background: "rgba(251,146,60,0.1)",
              border: "1px solid rgba(251,146,60,0.2)",
            }}
          >
            SPORTS ANALYTICS RESEARCH
          </span>
        </div>

        <nav className="flex items-center gap-1">
          {SPORTS.map(({ label, href }) => {
            const isCurrent = pathname?.startsWith(href);
            return (
              <Link
                key={label}
                href={href}
                className="px-3 py-1.5 rounded-md transition-colors duration-150"
                style={{
                  fontSize: 13,
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? "#e6edf3" : "#4a5568",
                  background: isCurrent ? "#1a2335" : "transparent",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
