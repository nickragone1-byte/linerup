import fs from "fs/promises";
import path from "path";
import type { Game, PredictionsData } from "@/lib/types";
import {
  computeTier,
  tierColor,
  tierBadgeColor,
  TIER_ORDER,
} from "@/lib/tier";

async function getPredictions(): Promise<PredictionsData> {
  const filePath = path.join(process.cwd(), "public", "data", "predictions.json");
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as PredictionsData;
}

function formatML(ml: number): string {
  return ml > 0 ? `+${ml}` : `${ml}`;
}

function formatLineMoveLabel(game: Game): string {
  const { line_move, pick, home_team } = game;
  if (line_move === 0) return "No movement";
  const isHome = pick === home_team;
  const direction = isHome
    ? line_move > 0
      ? "↑ away pressure"
      : "↓ home action"
    : line_move < 0
    ? "↓ home pressure"
    : "↑ away action";
  return `${line_move > 0 ? "+" : ""}${line_move} (${direction})`;
}

function GameCard({ game }: { game: Game }) {
  const tier = computeTier(game);
  const cardBorder = tierColor(tier);
  const badge = tierBadgeColor(tier);
  const isPickHome = game.pick === game.home_team;

  const modelPct = isPickHome ? game.model_prob_home : 100 - game.model_prob_home;
  const vegasPct = isPickHome ? game.vegas_prob_home : 100 - game.vegas_prob_home;

  const awayML = formatML(game.away_ml);
  const homeML = formatML(game.home_ml);

  return (
    <div className={`rounded-xl border-2 p-5 flex flex-col gap-4 ${cardBorder}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="text-sm text-zinc-400 uppercase tracking-wider mb-0.5">
            {game.venue}
          </div>
          <div className="text-xl font-bold text-white leading-tight">
            {game.away_team}{" "}
            <span className="text-zinc-500 font-normal">@</span>{" "}
            {game.home_team}
          </div>
          <div className="text-sm text-zinc-400 mt-0.5">
            {game.away_record} &nbsp;·&nbsp; {game.home_record}
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap ${badge}`}>
          {tier}
        </span>
      </div>

      {/* Pitchers */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-zinc-500 text-xs mb-0.5">Away SP</div>
          <div className="text-zinc-200">{game.away_pitcher}</div>
          <div className="text-zinc-500 text-xs">
            {game.away_sp_ip} IP &nbsp;·&nbsp; {game.away_sp_weight}% wt
          </div>
        </div>
        <div>
          <div className="text-zinc-500 text-xs mb-0.5">Home SP</div>
          <div className="text-zinc-200">{game.home_pitcher}</div>
          <div className="text-zinc-500 text-xs">
            {game.home_sp_ip} IP &nbsp;·&nbsp; {game.home_sp_weight}% wt
          </div>
        </div>
      </div>

      {/* Pick highlight */}
      <div className="rounded-lg bg-zinc-800 px-4 py-3 flex flex-col gap-1">
        <div className="text-xs text-zinc-500 uppercase tracking-wide">Pick</div>
        <div className="text-lg font-bold text-white">{game.pick}</div>
        <div className="text-sm text-zinc-400">
          Confidence{" "}
          <span className="text-white font-semibold">{game.confidence.toFixed(1)}%</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="flex flex-col">
          <span className="text-zinc-500 text-xs mb-0.5">Model %</span>
          <span className="text-zinc-100 font-medium">{modelPct.toFixed(1)}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-zinc-500 text-xs mb-0.5">Vegas %</span>
          <span className="text-zinc-100 font-medium">{vegasPct.toFixed(1)}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-zinc-500 text-xs mb-0.5">Edge</span>
          <span
            className={`font-medium ${
              game.edge > 8
                ? "text-green-400"
                : game.edge > 4
                ? "text-yellow-400"
                : game.edge < 0
                ? "text-red-400"
                : "text-zinc-100"
            }`}
          >
            {game.edge > 0 ? "+" : ""}
            {game.edge.toFixed(1)}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-zinc-500 text-xs mb-0.5">Line Move</span>
          <span className="text-zinc-100 font-medium text-xs leading-snug">
            {formatLineMoveLabel(game)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-zinc-500 text-xs mb-0.5">Sharp Signal</span>
          <span className="text-zinc-100 font-medium text-xs leading-snug">
            {game.sharp_signal}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-zinc-500 text-xs mb-0.5">O/U</span>
          <span className="text-zinc-100 font-medium">{game.over_under}</span>
        </div>
      </div>

      {/* Moneylines */}
      <div className="flex justify-between text-xs text-zinc-500 border-t border-zinc-800 pt-3">
        <span>
          {game.away_team.split(" ").pop()}{" "}
          <span className="text-zinc-300">{awayML}</span>
        </span>
        <span>
          Park {game.park_factor}x
        </span>
        <span>
          {game.home_team.split(" ").pop()}{" "}
          <span className="text-zinc-300">{homeML}</span>
        </span>
      </div>
    </div>
  );
}

export default async function Home() {
  const data = await getPredictions();

  const sorted = [...data.games].sort((a, b) => {
    const ta = computeTier(a);
    const tb = computeTier(b);
    return TIER_ORDER.indexOf(ta) - TIER_ORDER.indexOf(tb);
  });

  const dateObj = new Date(data.date + "T12:00:00");
  const dateLabel = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Liner<span className="text-green-400">u</span>p
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">MLB Betting Intelligence</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-400">
            Model {data.model_version}
          </div>
          <div className="text-xs text-zinc-600">
            {data.training_accuracy}% acc · {data.training_games.toLocaleString()} games
          </div>
        </div>
      </header>

      {/* Date banner */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-2 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">{dateLabel}</span>
        <span className="text-xs text-zinc-500">
          Generated {data.generated_at}
        </span>
      </div>

      {/* Cards */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((game) => (
            <GameCard
              key={`${game.away_team}-${game.home_team}`}
              game={game}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-6 text-center">
        <p className="text-xs text-zinc-600 max-w-xl mx-auto">
          <strong className="text-zinc-500">Disclaimer:</strong> Linerup predictions are for
          informational and entertainment purposes only. Nothing here constitutes financial or
          gambling advice. Past model performance does not guarantee future results. Bet
          responsibly.
        </p>
      </footer>
    </div>
  );
}
