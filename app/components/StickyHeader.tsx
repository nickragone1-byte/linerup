"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  modelVersion: string;
  accuracy: number;
}

export default function StickyHeader({ modelVersion, accuracy }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md transition-all duration-150 ${
        scrolled ? "border-b border-zinc-800/80 shadow-lg shadow-black/30" : "border-b border-transparent"
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 min-w-0">
          <Link href="/" className="text-base font-bold tracking-tight text-zinc-100 shrink-0">
            Liner<span className="text-green-400">u</span>p
          </Link>

          <nav className="flex items-center gap-0.5">
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold text-zinc-100 bg-zinc-800">
              MLB
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-600">
              NBA
              <span className="text-[9px] bg-zinc-800 text-zinc-600 px-1 py-px rounded-full leading-none">
                Soon
              </span>
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-600">
              NFL
              <span className="text-[9px] bg-zinc-800 text-zinc-600 px-1 py-px rounded-full leading-none">
                Soon
              </span>
            </span>
          </nav>
        </div>

        <div className="text-right shrink-0 hidden sm:block">
          <div className="text-xs font-medium text-zinc-400">{modelVersion}</div>
          <div className="text-[11px] text-zinc-700">{accuracy}% acc</div>
        </div>
      </div>
    </header>
  );
}
