import { getNBAPredictions, getNBAResults } from "@/lib/data-nba";
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

// "2026-05-17 22:35:00 PDT" → "Updated at 10:35 PM"
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

  const dateLabel = new Date(predictions.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const updatedLabel = formatUpdatedAt(predictions.generated_at);
  const playCount = topGames.length;
  const leanCount = leans.length;
  const hasGames = predictions.games.length > 0;

  return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      <Header />

      {/* Date strip */}
      <div className="max-w-3xl mx-auto px-5 pt-6 pb-0">
        <div className="hidden sm:flex items-center gap-3">
          <span style={{ fontSize: 13, color: "#4a5568" }}>{dateLabel}</span>
          {updatedLabel && (
            <span style={{ fontSize: 13, color: "#7d8590" }}>· {updatedLabel}</span>
          )}
        </div>
        <div className="sm:hidden">
          <div style={{ fontSize: 13, color: "#4a5568" }}>{dateLabel}</div>
          {updatedLabel && (
            <div style={{ fontSize: 12, color: "#7d8590", marginTop: 2 }}>{updatedLabel}</div>
          )}
        </div>
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
          <div
            className="rounded-xl px-8 py-12 text-center"
            style={{ background: "#0f1422", border: "1px solid #1a2335" }}
          >
            <p style={{ fontSize: 15, color: "#4a5568" }}>
              No strong model edges today.
            </p>
            <p className="mt-2" style={{ fontSize: 13, color: "#2a3a55" }}>
              V6 passes when there is no clear edge over the market.
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
      <YesterdaySection data={results} />

      {/* How it works */}
      <HowItWorksNBA />

      {/* Footer */}
      <Footer />

      {/* Mobile bottom bar */}
      <MobileBottomBar playCount={playCount} leanCount={leanCount} />

      {/* Bottom padding so content isn't hidden behind mobile bar */}
      <div className="h-24 sm:hidden" />
    </div>
  );
}
