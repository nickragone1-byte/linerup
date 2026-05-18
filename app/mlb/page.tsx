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

// "2026-05-15 09:01:32 PDT" → "Updated at 9:01 AM"
function formatUpdatedAt(generatedAt: string): string {
  const timePart = generatedAt.split(" ")[1];
  if (!timePart) return "";
  const [hStr, mStr] = timePart.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const hour = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `Updated at ${hour}:${String(m).padStart(2, "0")} ${ampm}`;
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

  const updatedLabel = formatUpdatedAt(predictions.generated_at);
  const playCount = topGames.length;
  const leanCount = leans.length;

  return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      <Header />

      {/* Date strip — inline on desktop, stacked on mobile */}
      <div className="max-w-3xl mx-auto px-5 pt-6 pb-0">
        {/* Desktop: single line */}
        <div className="hidden sm:flex items-center gap-3">
          <span style={{ fontSize: 13, color: "#4a5568" }}>{dateLabel}</span>
          {updatedLabel && (
            <span style={{ fontSize: 13, color: "#7d8590" }}>· {updatedLabel}</span>
          )}
        </div>
        {/* Mobile: stacked */}
        <div className="sm:hidden">
          <div style={{ fontSize: 13, color: "#4a5568" }}>{dateLabel}</div>
          {updatedLabel && (
            <div style={{ fontSize: 12, color: "#7d8590", marginTop: 2 }}>{updatedLabel}</div>
          )}
        </div>
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
      <YesterdaySection data={results} />

      {/* How it works */}
      <HowItWorks />

      {/* Footer */}
      <Footer />

      {/* Mobile bottom bar */}
      <MobileBottomBar playCount={playCount} leanCount={leanCount} />

      {/* Bottom padding so content isn't hidden behind mobile bar */}
      <div className="h-24 sm:hidden" />
    </div>
  );
}
