import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import type { PredictionsData } from "@/lib/types";
import { computeTier, TIER_ORDER } from "@/lib/tier";
import { toDisplayTier, passReason } from "@/lib/display-tier";
import { generateNarrative } from "@/lib/narrative";
import StickyHeader from "@/app/components/StickyHeader";
import GameCard from "@/app/components/GameCard";
import PassSection from "@/app/components/PassSection";
import type { PassGame } from "@/app/components/PassSection";

async function getPredictions(): Promise<PredictionsData> {
  const filePath = path.join(process.cwd(), "public", "data", "predictions.json");
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as PredictionsData;
}

export default async function Home() {
  const data = await getPredictions();

  const withTiers = data.games
    .map((game) => {
      const internal = computeTier(game);
      const display = toDisplayTier(internal);
      const narrative = generateNarrative(game, internal);
      const reason = passReason(internal);
      return { game, internal, display, narrative, reason };
    })
    .sort(
      (a, b) => TIER_ORDER.indexOf(a.internal) - TIER_ORDER.indexOf(b.internal)
    );

  const locks = withTiers.filter((g) => g.display === "LOCK");
  const plays = withTiers.filter((g) => g.display === "PLAY");
  const leans = withTiers.filter((g) => g.display === "LEAN");
  const passes = withTiers.filter((g) => g.display === "PASS");

  const topGames = [...locks, ...plays];

  const dateObj = new Date(data.date + "T12:00:00");
  const dateLabel = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // e.g. "09:01:32 PDT" → "9:01 AM PDT"
  const timeParts = data.generated_at.split(" ");
  const timeStr = timeParts.slice(1).join(" ");

  const summaryParts: string[] = [];
  if (topGames.length > 0)
    summaryParts.push(`${topGames.length} ${topGames.length === 1 ? "play" : "plays"}`);
  if (leans.length > 0)
    summaryParts.push(`${leans.length} ${leans.length === 1 ? "lean" : "leans"}`);
  if (passes.length > 0) summaryParts.push(`${passes.length} pass`);

  const passItems: PassGame[] = passes.map(({ game, internal, narrative, reason }) => ({
    game,
    internalTier: internal,
    narrative,
    reason,
  }));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <StickyHeader
        modelVersion={`Model ${data.model_version}`}
        accuracy={data.training_accuracy}
      />

      {/* Date strip */}
      <div className="border-b border-zinc-800/60">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-zinc-200">{dateLabel}</span>
            <span className="text-xs text-zinc-600">Updated {timeStr}</span>
          </div>
          <span className="text-xs text-zinc-600">{summaryParts.join(" · ")}</span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12 pb-24 md:pb-12">
        {/* Today's Plays */}
        {topGames.length > 0 && (
          <section>
            <SectionLabel title="Today's Plays" count={topGames.length} />
            <div className="grid gap-3 md:grid-cols-2">
              {topGames.map(({ game, internal, display, narrative }) => (
                <GameCard
                  key={`${game.away_team}-${game.home_team}`}
                  game={game}
                  displayTier={display as "LOCK" | "PLAY"}
                  internalTier={internal}
                  narrative={narrative}
                />
              ))}
            </div>
          </section>
        )}

        {/* Leans */}
        {leans.length > 0 && (
          <section>
            <SectionLabel title="Leans" count={leans.length} />
            <div className="grid gap-3 md:grid-cols-2">
              {leans.map(({ game, internal, narrative }) => (
                <GameCard
                  key={`${game.away_team}-${game.home_team}`}
                  game={game}
                  displayTier="LEAN"
                  internalTier={internal}
                  narrative={narrative}
                />
              ))}
            </div>
          </section>
        )}

        {/* Pass */}
        {passes.length > 0 && (
          <section>
            <SectionLabel title="Pass" />
            <PassSection items={passItems} />
          </section>
        )}

        {/* Yesterday's Card */}
        <section>
          <SectionLabel title="Yesterday's Card" />
          <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/20 p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-400">Results tracking coming soon</p>
              <p className="text-xs text-zinc-600 mt-0.5">Full W-L breakdown by tier launches with the data pipeline</p>
            </div>
            <Link
              href="/results"
              className="shrink-0 text-xs text-zinc-600 hover:text-zinc-300 transition-colors px-3 py-2 rounded-md border border-zinc-800 hover:border-zinc-700 whitespace-nowrap"
            >
              All results →
            </Link>
          </div>
        </section>
      </main>

      {/* Mobile sticky bottom bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">{dateLabel}</span>
        <span className="text-xs text-zinc-600">{data.games.length} games</span>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <nav className="flex items-center gap-5 text-xs text-zinc-600">
            <Link href="/methodology" className="hover:text-zinc-400 transition-colors">
              Methodology
            </Link>
            <Link href="/track-record" className="hover:text-zinc-400 transition-colors">
              Track record
            </Link>
          </nav>
          <p className="text-xs text-zinc-700 max-w-sm leading-relaxed">
            For entertainment only. Not financial or gambling advice. Past performance does not
            guarantee future results. 21+ where applicable.
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionLabel({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest">
        {title}
      </h2>
      {count !== undefined && (
        <span className="text-[11px] bg-zinc-800/80 text-zinc-600 px-2 py-px rounded-full tabular-nums">
          {count}
        </span>
      )}
    </div>
  );
}
