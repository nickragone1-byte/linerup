import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { MODEL_TRAINING_GAMES, MODEL_ACCURACY, MODEL_BREAKEVEN } from "@/lib/constants";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2
        className="uppercase mb-5"
        style={{ fontSize: 12, letterSpacing: "0.10em", color: "#c9d1d9", fontFamily: "var(--font-geist-mono)" }}
      >
        {title}
      </h2>
      <div style={{ maxWidth: "580px" }}>{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 15, color: "#c9d1d9", lineHeight: 1.75, marginBottom: 16 }}>
      {children}
    </p>
  );
}

export default function MethodologyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      <Header />
      <div className="max-w-3xl mx-auto px-5 py-12">
        <h1
          className="mb-2 tracking-tight"
          style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "#e6edf3" }}
        >
          Methodology
        </h1>
        <p className="mb-12" style={{ fontSize: 15, color: "#8b95a8" }}>
          How V8 generates predictions — in plain English.
        </p>

        <Section title="The Model">
          <P>
            V8 is a logistic regression model trained on {MODEL_TRAINING_GAMES.toLocaleString()} MLB regular-season games from 2023
            through 2026. Logistic regression was chosen deliberately: it produces well-calibrated
            probabilities, is interpretable, and resists overfitting on a dataset this size. More
            complex models — neural nets, gradient boosting — showed no statistically significant
            improvement on held-out data.
          </P>
          <P>
            The model outputs a win probability for the home team. That probability is compared
            against the market-implied probability derived from the current moneyline to compute
            edge. When V8 sees meaningfully more probability than the market, there is an
            exploitable edge. When the model and market agree, it is a pass.
          </P>
        </Section>

        <Section title="The Eight Variables">
          <P>
            Starting pitcher quality, weighted by innings pitched sample size. Starters with fewer
            than 30 innings are flagged as thin. Starters listed as TBD receive zero weight.
          </P>
          <P>
            Team offensive and defensive run metrics, park-adjusted for each venue. Park factors
            normalize run-scoring environments — Coors Field games play very differently from
            T-Mobile Park games, and the model accounts for this.
          </P>
          <P>
            Line movement from open to current. Significant movement toward a team, particularly
            against public money flow, is a signal of professional action. The model uses this
            directionally — movement confirming the model pick increases confidence; movement
            contradicting it is a warning.
          </P>
          <P>
            Recent form, head-to-head record, bullpen rest, and home field advantage round out
            the remaining variables. None are individually dominant; V8 uses all eight together.
          </P>
        </Section>

        <Section title="Calibration">
          <P>
            A {MODEL_ACCURACY}% accuracy sounds modest. In sports betting, it is not. The break-even win rate
            at standard -110 juice is {MODEL_BREAKEVEN}%. V8&apos;s edge above that line, sustained over {MODEL_TRAINING_GAMES.toLocaleString()}
            games, is the signal worth tracking.
          </P>
          <P>
            Calibration matters more than raw accuracy. When V8 says 65%, it should win
            approximately 65% of the time — not just directionally correct. V8 is calibrated
            using Platt scaling. The track record page shows whether calibration holds as 2026
            results come in.
          </P>
        </Section>

        <Section title="Display Tiers">
          <P>
            V8 produces 10 internal tiers based on confidence, edge, sharp signal, and data quality
            flags. These map to three display categories:
          </P>
          <div className="space-y-4 mb-4">
            {[
              {
                tier: "MODEL FAVORITE",
                color: "#10b981",
                bg: "rgba(16,185,129,0.08)",
                border: "rgba(16,185,129,0.2)",
                desc: "≥60% model confidence with meaningful edge. Clear signal above the market. Sharp action is neutral or confirms.",
              },
              {
                tier: "LEAN",
                color: "#f59e0b",
                bg: "rgba(245,158,11,0.08)",
                border: "rgba(245,158,11,0.2)",
                desc: "Positive edge but a smaller confidence window. Worth a reduced unit if you agree with the model.",
              },
              {
                tier: "PASS",
                color: "#475569",
                bg: "rgba(71,85,105,0.1)",
                border: "rgba(71,85,105,0.2)",
                desc: "No clean edge. Could be model/Vegas alignment, a thin starter sample, a TBD pitcher, or sharp money contradicting the pick.",
              },
            ].map(({ tier, color, bg, border, desc }) => (
              <div key={tier} className="flex gap-4">
                <span
                  className="shrink-0 text-[10px] font-bold tracking-[0.12em] px-2.5 py-1 rounded-full self-start mt-1"
                  style={{ color, background: bg, border: `1px solid ${border}` }}
                >
                  {tier}
                </span>
                <p style={{ fontSize: 14, color: "#8b95a8", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="What We Don't Do">
          <P>
            No tailing. No sharp consensus aggregation. No social media sentiment. No injury news
            that isn&apos;t already priced into the line by game time. No retroactive model
            adjustments. Every prediction is locked before first pitch and never revised.
          </P>
          <P>
            This is a research model. It is not gambling advice. The track record exists to show
            whether V8&apos;s edge holds over time — not to encourage anyone to bet.
          </P>
        </Section>

        <div className="flex items-center gap-6 pt-4" style={{ borderTop: "1px solid #1a2335" }}>
          <Link href="/track-record" className="nav-link" style={{ fontSize: 13, color: "#c9d1d9" }}>
            Track record →
          </Link>
          <Link href="/about" className="nav-link" style={{ fontSize: 13, color: "#c9d1d9" }}>
            About →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
