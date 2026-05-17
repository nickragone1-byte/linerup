import type { Game, Tier } from "@/lib/types";
import type { DisplayTier } from "@/lib/display-tier";
import HeroPlayCard from "./HeroPlayCard";

const SPELLED = [
  "ZERO", "ONE", "TWO", "THREE", "FOUR",
  "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
];

function spelledCount(n: number): string {
  return n < SPELLED.length ? SPELLED[n] : String(n);
}

export interface HeroGame {
  game: Game;
  display: DisplayTier;
  internal: Tier;
  narrative: string;
}

interface Props {
  topGames: HeroGame[];
}

export default function HeroSection({ topGames }: Props) {
  const count = topGames.length;

  if (count === 0) {
    return (
      <section className="max-w-3xl mx-auto px-5 py-14 sm:py-20">
        <div
          className="rounded-lg px-8 py-12 sm:px-12 sm:py-16 text-center"
          style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}
        >
          <p
            className="uppercase mb-6"
            style={{
              fontSize: "11px",
              letterSpacing: "0.16em",
              color: "#555",
            }}
          >
            NO EDGE TONIGHT.
          </p>
          <p
            className="mx-auto"
            style={{
              fontSize: "17px",
              color: "#666",
              lineHeight: 1.75,
              maxWidth: "340px",
            }}
          >
            The model doesn&apos;t see a clean edge in tonight&apos;s slate. A disciplined pass is
            a position. We&apos;ll be back tomorrow.
          </p>
        </div>
      </section>
    );
  }

  const word = spelledCount(count);
  const label = `${word} ${count === 1 ? "PLAY" : "PLAYS"} TONIGHT.`;

  return (
    <section className="max-w-3xl mx-auto px-5 py-10 sm:py-14">
      <p
        className="uppercase mb-5"
        style={{ fontSize: "11px", letterSpacing: "0.16em", color: "#555" }}
      >
        {label}
      </p>
      <div className={count > 1 ? "space-y-4" : ""}>
        {topGames.map(({ game, display, narrative }) => (
          <HeroPlayCard
            key={`${game.away_team}-${game.home_team}`}
            game={game}
            displayTier={display as Exclude<DisplayTier, "PASS">}
            narrative={narrative}
            compact={count > 1}
          />
        ))}
      </div>
    </section>
  );
}
