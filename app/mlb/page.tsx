import { getPredictions, getResults } from "@/lib/data";
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

  const withTiers = predictions.games
    .map((game) => {
      const internal = computeTier(game);
      const display = toDisplayTier(internal);
      const narrative = generateNarrative(game, internal);
      const reason = passReason(internal);
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

  const dateLabel = new Date(predictions.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const playCount = topGames.length;
  const leanCount = leans.length;

  return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      <Header />

      {/* Date strip */}
      <div className="max-w-3xl mx-auto px-5 pt-6 pb-0">
        <span style={{ fontSize: 13, color: "#2a3a55" }}>{dateLabel}</span>
      </div>

      {/* Hero section */}
      {topGames.length > 0 ? (
        <section className="max-w-3xl mx-auto px-5 pt-6 pb-4">
          <h2
            className="uppercase mb-4"
            style={{ fontSize: 11, letterSpacing: "0.12em", color: "#4a5568" }}
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
          <div
            className="rounded-xl px-8 py-12 text-center"
            style={{ background: "#0f1422", border: "1px solid #1a2335" }}
          >
            <p style={{ fontSize: 15, color: "#4a5568" }}>
              No strong model edges today.
            </p>
            <p className="mt-2" style={{ fontSize: 13, color: "#2a3a55" }}>
              V8 passes when there is no clear edge over the market.
            </p>
          </div>
        </section>
      )}

      {/* Leans */}
      {leans.length > 0 && (
        <section className="max-w-3xl mx-auto px-5 pb-8">
          <h2
            className="uppercase mb-4"
            style={{ fontSize: 11, letterSpacing: "0.12em", color: "#4a5568" }}
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
      <YesterdaySection results={results} />

      {/* How it works */}
      <HowItWorks />

      {/* Footer */}
      <Footer />

      {/* Mobile bottom bar */}
      <MobileBottomBar playCount={playCount} leanCount={leanCount} />

      {/* Bottom padding for mobile bar */}
      <div className="h-20 sm:hidden" />
    </div>
  );
}
