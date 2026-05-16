import Link from "next/link";

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-10"
        >
          ← Back to today
        </Link>

        <h1 className="text-2xl font-bold text-zinc-100 mb-1">How Linerup Works</h1>
        <p className="text-sm text-zinc-600 mb-10">
          V8 model · 57.09% accuracy · 7,619 games
        </p>

        <div className="space-y-10">
          <Section title="The Model">
            <p className="text-sm text-zinc-500 leading-relaxed">
              V8 uses an 8-variable logistic regression trained on MLB games from 2023–2026.
              Inputs include starting pitcher quality (weighted by innings pitched), team
              offensive and defensive metrics, park factors, and line movement signals. The
              model outputs a win probability for the home team, which is compared against
              the implied Vegas probability to compute edge.
            </p>
          </Section>

          <Section title="Display Tiers">
            <div className="space-y-5">
              <TierRow
                badge="LOCK"
                badgeClass="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                dot="bg-emerald-500"
                desc="Highest-conviction plays. Model confidence ≥60%, small edge over Vegas, confirmed by sharp money movement. Play full size."
              />
              <TierRow
                badge="PLAY"
                badgeClass="bg-green-500/10 text-green-400 border border-green-500/20"
                dot="bg-green-500"
                desc="Strong model confidence ≥60% with a meaningful edge. Core card plays — includes both straight model bets and sharp-confirmed lines."
              />
              <TierRow
                badge="LEAN"
                badgeClass="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                dot="bg-yellow-500"
                desc="Positive edge but smaller confidence or a wider model/Vegas spread. Worth a reduced unit if you agree with the lean."
              />
              <TierRow
                badge="PASS"
                badgeClass="bg-zinc-700/30 text-zinc-500 border border-zinc-700/30"
                dot="bg-zinc-600"
                desc="No clean edge detected. Could be insufficient pitcher data, a TBD starter, market disagreement (line moved against the pick), or model and Vegas in close agreement."
              />
            </div>
          </Section>

          <Section title="Edge Calculation">
            <p className="text-sm text-zinc-500 leading-relaxed">
              Edge = model win probability for the picked side minus the implied Vegas
              probability. A positive edge means the model sees more value than the market
              is offering. Large edges ({">"} 8%) without sharp confirmation are flagged as
              potential traps rather than opportunities.
            </p>
          </Section>

          <Section title="Sharp Signal">
            <p className="text-sm text-zinc-500 leading-relaxed">
              Sharp signal is derived from line movement relative to open. When a line moves
              toward a team despite public money going the other way, it typically indicates
              sharp (professional) action. Games where sharp action confirms the model pick
              are upgraded; games where it contradicts the pick are downgraded or passed.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function TierRow({
  badge,
  badgeClass,
  dot,
  desc,
}: {
  badge: string;
  badgeClass: string;
  dot: string;
  desc: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 pt-0.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-widest ${badgeClass}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          {badge}
        </span>
      </div>
      <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  );
}
