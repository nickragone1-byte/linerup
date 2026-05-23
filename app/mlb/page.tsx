import type { Metadata } from "next";
import { getPredictions, getResults } from "@/lib/data";

export const metadata: Metadata = {
  title: "Linerup — MLB Analytics",
  description: "Public, transparent MLB analytics model. Every prediction published before first pitch. Every result tracked.",
};
import { computeTier, TIER_ORDER } from "@/lib/tier";
import { toDisplayTier, passReason } from "@/lib/display-tier";
import { generateNarrative } from "@/lib/narrative";
import Header from "@/app/components/Header";
import HeroCard from "@/app/components/HeroCard";
import LeanCard from "@/app/components/LeanCard";
import PassRow from "@/app/components/PassRow";
import YesterdaySection from "@/app/components/YesterdaySection";
import HowItWorks from "@/app/components/HowItWorks";
import Footer from "@/app/components/Footer";
import MobileBottomBar from "@/app/components/MobileBottomBar";
import type { PassItem } from "@/app/components/PassRow";


export default async function MLBPage() {
  const [predictions, results] = await Promise.all([
    getPredictions("mlb"),
    getResults("mlb"),
  ]);

  // Deduplicate games by matchup key
  const seenGames = new Set<string>();
  const uniqueGames = predictions.games.filter((game) => {
    const key = `${game.away_team}|${game.home_team}`;
    if (seenGames.has(key)) return false;
    seenGames.add(key);
    return true;
  });

  const withTiers = uniqueGames
    .map((game) => {
      const internal = computeTier(game);
      const display = toDisplayTier(internal);
      const narrative = generateNarrative(game, internal);
      const reason = passReason(internal, game);
      return { game, internal, display, narrative, reason };
    })
    .sort((a, b) => TIER_ORDER.indexOf(a.internal) - TIER_ORDER.indexOf(b.internal));

  const topGames = withTiers.filter(
    (g) => g.display === "LOCK" || g.display === "PLAY"
  );
  const leans = withTiers.filter((g) => g.display === "LEAN");
  const passes: PassItem[] = withTiers
    .filter((g) => g.display === "PASS")
    .map(({ game, internal, reason }) => ({ game, internalTier: internal, reason }));

  const dateLabel = (() => {
    if (!predictions.date) return "";
    const [year, month, day] = predictions.date.split("-").map(Number);
    if (!year || !month || !day) return "";
    return new Date(year, month - 1, day).toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  })();

  const playCount = topGames.length;
  const leanCount = leans.length;

  return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      <Header />

      {/* Date strip — inline on desktop, stacked on mobile */}
      <div className="max-w-3xl mx-auto px-5 pt-6 pb-0">
        <div style={{ fontSize: 13, color: "#4a5568" }}>{dateLabel}</div>
      </div>

      {/* Hero section */}
      {topGames.length > 0 ? (
        <section className="max-w-3xl mx-auto px-5 pt-6 pb-4">
          <h2
            className="uppercase mb-4"
            style={{ fontSize: 12, letterSpacing: "0.2em", color: "#c9d1d9", fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}
          >
            Model Favorites
          </h2>
          <div>
            {topGames.map(({ game, display, narrative }) => (
              <HeroCard
                key={`${game.away_team}-${game.home_team}`}
                game={game}
                display={display}
                narrative={narrative}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="max-w-3xl mx-auto px-5 pt-6 pb-4">
          <h2
            className="uppercase mb-4"
            style={{ fontSize: 12, letterSpacing: "0.2em", color: "#c9d1d9", fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}
          >
            Model Favorites
          </h2>
          <div
            className="rounded-xl px-8 py-12 text-center"
            style={{ background: "#0f1422", border: "1px solid #1a2335" }}
          >
            <p style={{ fontSize: 15, color: "#4a5568" }}>
              No strong model edges today.
            </p>
            <p className="mt-2" style={{ fontSize: 13, color: "#2a3a55" }}>
              V10 passes when there is no clear edge over the market.
            </p>
          </div>
        </section>
      )}

      {/* Leans */}
      {leans.length > 0 && (
        <section className="max-w-3xl mx-auto px-5 pb-8">
          <h2
            className="uppercase mb-4"
            style={{ fontSize: 12, letterSpacing: "0.2em", color: "#c9d1d9", fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}
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

      {/* Passes */}
      <PassRow items={passes} />

      {/* Yesterday results */}
      <YesterdaySection data={results} sport="mlb" />

      {/* How it works */}
      <HowItWorks />

      {/* Footer */}
      <Footer />

      {/* Mobile bottom bar */}
      <MobileBottomBar playCount={playCount} leanCount={leanCount} modelInfo="V10 · 55.3%" />

      {/* Bottom padding so content isn't hidden behind mobile bar */}
      <div className="h-24 sm:hidden" />
    </div>
  );
}
