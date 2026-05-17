import { getPredictions, getResults } from "@/lib/data";
import { computeTier, TIER_ORDER } from "@/lib/tier";
import { toDisplayTier, passReason } from "@/lib/display-tier";
import { generateNarrative } from "@/lib/narrative";
import StickyHeader from "@/app/components/StickyHeader";
import HeroSection from "@/app/components/HeroSection";
import LeanCard from "@/app/components/LeanCard";
import PassLine from "@/app/components/PassLine";
import YesterdaySection from "@/app/components/YesterdaySection";
import HowItWorks from "@/app/components/HowItWorks";
import type { PassItem } from "@/app/components/PassLine";
import type { HeroGame } from "@/app/components/HeroSection";

function timeDescription(generatedAt: string): string {
  const hour = parseInt(generatedAt.split(" ")[1]?.split(":")[0] ?? "9", 10);
  if (hour < 12) return "Updated this morning";
  if (hour < 17) return "Updated this afternoon";
  return "Updated this evening";
}

export default async function MLBPage() {
  const [predictions, results] = await Promise.all([
    getPredictions("mlb"),
    getResults("mlb"),
  ]);

  const withTiers = predictions.games
    .map((game) => {
      const internal = computeTier(game);
      const display = toDisplayTier(internal);
      const narrative = generateNarrative(game, internal);
      const reason = passReason(internal);
      return { game, internal, display, narrative, reason };
    })
    .sort((a, b) => TIER_ORDER.indexOf(a.internal) - TIER_ORDER.indexOf(b.internal));

  const topGames: HeroGame[] = withTiers.filter(
    (g) => g.display === "LOCK" || g.display === "PLAY"
  );
  const leans = withTiers.filter((g) => g.display === "LEAN");
  const passes: PassItem[] = withTiers
    .filter((g) => g.display === "PASS")
    .map(({ game, internal, reason }) => ({ game, internalTier: internal, reason }));

  const dateLabel = new Date(predictions.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const timeDesc = timeDescription(predictions.generated_at);

  return (
    <div className="min-h-screen bg-black text-white">
      <StickyHeader
        modelVersion={predictions.model_version}
        accuracy={predictions.training_accuracy}
        sport="mlb"
      />

      {/* Date strip */}
      <div className="max-w-3xl mx-auto px-5 pt-7 pb-0 flex items-center justify-between">
        <span style={{ fontSize: "13px", color: "#555" }}>{dateLabel}</span>
        <span style={{ fontSize: "13px", color: "#333" }}>{timeDesc}</span>
      </div>

      {/* Hero */}
      <HeroSection topGames={topGames} />

      {/* Leans */}
      {leans.length > 0 && (
        <section className="max-w-3xl mx-auto px-5 pb-10">
          <h2
            className="uppercase mb-4"
            style={{ fontSize: "11px", letterSpacing: "0.12em", color: "#555" }}
          >
            Leans
          </h2>
          <div className="space-y-2">
            {leans.map(({ game, narrative }) => (
              <LeanCard
                key={`${game.away_team}-${game.home_team}`}
                game={game}
                narrative={narrative}
              />
            ))}
          </div>
        </section>
      )}

      {/* Pass line */}
      {passes.length > 0 && <PassLine items={passes} />}

      {/* Yesterday */}
      <YesterdaySection results={results} />

      {/* How it works */}
      <HowItWorks />

      {/* Footer */}
      <footer
        className="py-8"
        style={{ borderTop: "1px solid #1a1a1a" }}
      >
        <p className="text-center" style={{ fontSize: "12px", color: "#444" }}>
          Linerup · For entertainment only · Not gambling advice · 21+
        </p>
      </footer>
    </div>
  );
}
