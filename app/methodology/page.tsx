import Link from "next/link";

function BackLink() {
  return (
    <Link
      href="/mlb"
      className="inline-block transition-colors duration-150 mb-10"
      style={{ fontSize: "13px", color: "#555" }}
    >
      ← Back
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2
        className="uppercase mb-5"
        style={{ fontSize: "11px", letterSpacing: "0.12em", color: "#555" }}
      >
        {title}
      </h2>
      <div style={{ maxWidth: "580px" }}>{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "15px", color: "#888", lineHeight: 1.75, marginBottom: "16px" }}>
      {children}
    </p>
  );
}

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-5 py-12">
        <BackLink />

        <h1
          className="mb-2 tracking-tight"
          style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.03em" }}
        >
          Methodology
        </h1>
        <p className="mb-12" style={{ fontSize: "15px", color: "#555" }}>
          How V8 generates predictions — in plain English.
        </p>

        <Section title="The Model">
          <P>
            V8 is a logistic regression model trained on 7,619 MLB regular-season games
            from 2023 through 2026. Logistic regression was chosen deliberately: it
            produces well-calibrated probabilities, is interpretable, and resists
            overfitting on a dataset this size. More complex models (neural nets, gradient
            boosting) showed no statistically significant improvement on held-out data.
          </P>
          <P>
            The model outputs a win probability for the home team. That probability is
            compared against the market-implied probability — derived from the current
            moneyline — to compute edge. When the model sees meaningfully more probability
            than the market, there is an exploitable edge.
          </P>
        </Section>

        <Section title="The Eight Variables">
          <P>
            Starting pitcher quality, weighted by innings pitched sample size (the
            &ldquo;SP weight&rdquo; you see in the data). Starters with fewer than 30
            innings are flagged as thin. Starters listed as TBD receive zero weight.
          </P>
          <P>
            Team offensive and defensive run metrics, park-adjusted for each venue.
            Park factors normalize run-scoring environments — Coors Field games play very
            differently from T-Mobile Park games, and the model accounts for this.
          </P>
          <P>
            Line movement from open to current. Significant movement toward a team,
            particularly against public money flow, is a signal of sharp (professional)
            action. The model uses this directionally — movement confirming the model
            pick increases confidence; movement contradicting it is a warning.
          </P>
          <P>
            Recent form (rolling window), head-to-head, bullpen rest, and home field
            advantage rounded out as the remaining variables. None are individually
            dominant; the model uses all eight together.
          </P>
        </Section>

        <Section title="Calibration">
          <P>
            A 57.1% overall accuracy sounds modest. In sports betting, it is not. The
            break-even win rate at standard -110 juice is 52.4%. V8&apos;s edge above
            that line, sustained over 7,619 games, is the signal worth tracking.
          </P>
          <P>
            Calibration matters more than raw accuracy. When V8 says 65%, it should win
            approximately 65% of the time — not just directionally correct. V8 is
            calibrated using Platt scaling. The track record page will show whether
            calibration holds as 2026 results come in.
          </P>
        </Section>

        <Section title="Display Tiers">
          <P>
            V8 produces 10 internal tiers based on confidence, edge, sharp signal, and
            data quality flags. These map to four display tiers for clarity:
          </P>
          <div className="space-y-4 mb-4">
            {[
              {
                tier: "PLAY",
                color: "#10b981",
                bg: "rgba(16,185,129,0.08)",
                desc: "≥60% model confidence with meaningful edge. The core bet. Sharp action is neutral or confirms.",
              },
              {
                tier: "LEAN",
                color: "#f59e0b",
                bg: "rgba(245,158,11,0.08)",
                desc: "Positive edge but smaller confidence window. Smaller unit. Worth playing if you agree with the model.",
              },
              {
                tier: "PASS",
                color: "#555",
                bg: "rgba(85,85,85,0.1)",
                desc: "No clean edge. Could be model/Vegas alignment, a thin starter sample, TBD pitcher, or sharp money contradicting the pick.",
              },
            ].map(({ tier, color, bg, desc }) => (
              <div key={tier} className="flex gap-4">
                <span
                  className="shrink-0 text-[10px] font-bold tracking-[0.14em] px-2.5 py-1 rounded-full self-start mt-1"
                  style={{ color, background: bg, border: `1px solid ${color}30` }}
                >
                  {tier}
                </span>
                <p style={{ fontSize: "14px", color: "#777", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="What We Don't Do">
          <P>
            No tailing. No &ldquo;sharp consensus&rdquo; aggregation. No social media
            sentiment. No injury news that isn&apos;t priced into the line by game time.
            No retroactive model adjustments. Every prediction is locked before first
            pitch and never revised.
          </P>
        </Section>

        <div className="flex items-center gap-6 pt-4" style={{ borderTop: "1px solid #1a1a1a" }}>
          <Link
            href="/track-record"
            className="transition-colors duration-150"
            style={{ fontSize: "13px", color: "#555" }}
          >
            Track record →
          </Link>
          <Link
            href="/about"
            className="transition-colors duration-150"
            style={{ fontSize: "13px", color: "#555" }}
          >
            About →
          </Link>
        </div>
      </div>
    </div>
  );
}
