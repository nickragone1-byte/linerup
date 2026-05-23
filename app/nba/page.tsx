import type { Metadata } from "next";
import { getNBAPredictions, getNBAResults } from "@/lib/data-nba";

export const metadata: Metadata = {
  title: "Linerup — NBA Analytics",
  description: "Public, transparent NBA analytics model. V7 validated at 68.2% out-of-sample on 6,258 games. Every prediction published before tip-off. Every result tracked.",
};
import { computeNBATier, NBA_TIER_ORDER } from "@/lib/tier-nba";
import { toNBADisplayTier } from "@/lib/display-tier-nba";
import { generateNBANarrative } from "@/lib/narrative-nba";
import Header from "@/app/components/Header";
import HeroCardNBA from "@/app/components/HeroCardNBA";
import LeanCardNBA from "@/app/components/LeanCardNBA";
import PassRowNBA from "@/app/components/PassRowNBA";
import YesterdaySection from "@/app/components/YesterdaySection";
import HowItWorksNBA from "@/app/components/HowItWorksNBA";
import Footer from "@/app/components/Footer";
import MobileBottomBar from "@/app/components/MobileBottomBar";
import type { NBAPassItem } from "@/app/components/PassRowNBA";
import { nbaPassReason } from "@/lib/display-tier-nba";


export default async function NBAPage() {
  const [predictions, results] = await Promise.all([
    getNBAPredictions(),
    getNBAResults(),
  ]);

  const withTiers = predictions.games
    .map((game) => {
      const internal = computeNBATier(game);
      const display = toNBADisplayTier(internal);
      const narrative = generateNBANarrative(game, internal);
      return { game, internal, display, narrative };
    })
    .sort((a, b) => NBA_TIER_ORDER.indexOf(a.internal) - NBA_TIER_ORDER.indexOf(b.internal));

  const topGames = withTiers.filter(
    (g) => g.display === "LOCK" || g.display === "PLAY"
  );
  const leans = withTiers.filter((g) => g.display === "LEAN");
  const passes: NBAPassItem[] = withTiers
    .filter((g) => g.display === "PASS")
    .map(({ game, internal }) => ({ game, internalTier: internal, reason: nbaPassReason(internal) }));

  const dateLabel = (() => {
    if (!predictions.date) return "";
    const [year, month, day] = predictions.date.split("-").map(Number);
    if (!year || !month || !day) return "";
    // Format date in UTC so server + client always produce identical strings
    // (no toLocaleDateString -> no hydration mismatch). The snapshot date is
    // a calendar date, not a timestamp, so timezone conversion is wrong here.
    const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const d = new Date(Date.UTC(year, month - 1, day));
    return `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  })();

  const playCount = topGames.length;
  const leanCount = leans.length;
  const hasGames = predictions.games.length > 0;

  return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      <Header />

      {/* Date strip */}
      <div className="max-w-3xl mx-auto px-5 pt-6 pb-0">
        <div style={{ fontSize: 13, color: "#4a5568" }}>{dateLabel}</div>
      </div>

      {/* No games today */}
      {!hasGames && (
        <section className="max-w-3xl mx-auto px-5 pt-6 pb-4">
          <div
            className="rounded-xl px-8 py-12 text-center"
            style={{ background: "#0f1422", border: "1px solid #1a2335" }}
          >
            <p style={{ fontSize: 15, color: "#4a5568" }}>
              No NBA games today.
            </p>
            <p className="mt-2" style={{ fontSize: 13, color: "#2a3a55" }}>
              {predictions.note ?? "Check back when games resume."}
            </p>
          </div>
        </section>
      )}

      {/* Model Favorites */}
      {hasGames && topGames.length > 0 && (
        <section className="max-w-3xl mx-auto px-5 pt-6 pb-4">
          <h2
            className="uppercase mb-4"
            style={{ fontSize: 12, letterSpacing: "0.2em", color: "#c9d1d9", fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}
          >
            Model Favorites
          </h2>
          <div>
            {topGames.map(({ game, display, narrative }) => (
              <HeroCardNBA
                key={`${game.away_team}-${game.home_team}`}
                game={game}
                display={display}
                narrative={narrative}
              />
            ))}
          </div>
        </section>
      )}

      {/* No strong edges (games exist but no plays) */}
      {hasGames && topGames.length === 0 && (
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
              V7 passes when there is no clear edge over the market.
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
              <LeanCardNBA
                key={`${game.away_team}-${game.home_team}`}
                game={game}
                narrative={narrative}
              />
            ))}
          </div>
        </section>
      )}

      {/* Passes */}
      <PassRowNBA items={passes} />

      {/* Recent results */}
      <YesterdaySection data={results} sport="nba" />

      {/* How it works */}
      <HowItWorksNBA />

      {/* Footer */}
      <Footer />

      {/* Mobile bottom bar */}
      <MobileBottomBar playCount={playCount} leanCount={leanCount} modelInfo="V7 · 68.2%" />

      {/* Bottom padding so content isn't hidden behind mobile bar */}
      <div className="h-24 sm:hidden" />
    </div>
  );
}
