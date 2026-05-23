import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

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

function SportHeader({ label, version, color }: { label: string; version: string; color: string }) {
  return (
    <div
      className="flex items-center gap-3 mb-8 pb-4"
      style={{ borderBottom: "1px solid #1a2335" }}
    >
      <span
        className="uppercase font-semibold"
        style={{ fontSize: 11, letterSpacing: "0.14em", color }}
      >
        {label}
      </span>
      <span
        className="px-2 py-0.5 rounded font-mono"
        style={{ fontSize: 11, color, background: `${color}14`, border: `1px solid ${color}33` }}
      >
        {version}
      </span>
    </div>
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
          How the models generate predictions — in plain English.
        </p>

        {/* ── MLB V10 ── */}
        <div className="mb-16">
          <SportHeader label="MLB" version="V10" color="#fb923c" />

          <Section title="The Model">
            <P>
              V10 is a logistic regression model trained on 6,690 MLB regular-season games from 2023
              through 2026. The model uses cumulative run differential, bullpen SIERA, and park factors
              as its primary inputs. Logistic regression was chosen deliberately: it produces
              well-calibrated probabilities, is interpretable, and resists overfitting on a dataset
              this size. More complex models — neural nets, gradient boosting — showed no statistically
              significant improvement on held-out data.
            </P>
            <P>
              The model outputs a win probability for the home team. That probability is compared
              against the market-implied probability derived from the current moneyline to compute
              edge. When V10 sees meaningfully more probability than the market, there is a signal
              worth tracking. When the model and market agree, it is a pass.
            </P>
          </Section>

          <Section title="The Model Variables">
            <P>
              Starting pitcher quality, weighted by innings pitched sample size. Starters with fewer
              than 30 innings are flagged as thin. Starters listed as TBD receive zero weight.
            </P>
            <P>
              Team offensive and defensive cumulative run differential, park-adjusted for each venue.
              Park factors normalize run-scoring environments — Coors Field games play very differently
              from T-Mobile Park games, and the model accounts for this via bullpen SIERA and
              park-adjusted metrics.
            </P>
            <P>
              Line movement from open to current. Significant movement toward a team, particularly
              against public money flow, is a signal of professional action. The model uses this
              directionally — movement confirming the model pick increases confidence; movement
              contradicting it is a warning.
            </P>
          </Section>

          <Section title="Validation">
            <P>
              V10 achieves 57.4% honest out-of-sample accuracy against a 52.6% baseline — a 4.8
              percentage-point edge. In sports betting, a sustained 2-3pp edge over break-even is meaningful; 4-5pp
              would be exceptional if it holds across a full season. Break-even at standard -110 juice is 52.4%.
            </P>
            <P>
              &ldquo;Honest&rdquo; OOS means the test set was never used to tune the model. The
              accuracy figure is not back-tested; it is held-out data the model never saw during
              training. The track record page shows whether this edge holds as 2026 results come in.
            </P>
          </Section>
        </div>

        {/* ── NBA V7 ── */}
        <div className="mb-16">
          <SportHeader label="NBA" version="V7" color="#10b981" />

          <Section title="The Model">
            <P>
              V7 is a logistic regression model trained on 6,258 NBA games. It achieves 68.2%
              honest out-of-sample accuracy against a 55.7% baseline — a 12.5 percentage-point
              edge over what picking the home team every game would yield.
            </P>
            <P>
              The model outputs a win probability for the home team. Edge is computed by comparing
              this against the market-implied probability from the moneyline. When V7 finds
              meaningful edge, it produces a pick. When the model and market agree, it passes.
            </P>
          </Section>

          <Section title="The Model Variables">
            <P>
              The signature innovation in V7 is structured injury detection. The model tracks
              top-8 rotation players by minutes and flags missing players before each game. A team
              missing one or two key rotation players has a measurably different win probability
              than the market often reflects — especially in the playoffs when public attention
              inflates the perceived strength of depleted rosters.
            </P>
            <P>
              Additional inputs include point differential trends, pace adjustments, line movement,
              sharp signal, and home court advantage. Spread movement from open to current is used
              as a proxy for sharp money flow, same as in the MLB model.
            </P>
          </Section>

          <Section title="Validation">
            <P>
              V7&apos;s 68.2% OOS accuracy on 6,258 games represents a 12.5pp edge over the
              55.7% baseline (home team win rate over the training period). This is a large edge
              by model standards — driven primarily by the injury detection feature, which
              consistently outperforms market pricing on short-notice absences.
            </P>
          </Section>
        </div>

        {/* ── Shared sections ── */}
        <Section title="Display Tiers">
          <P>
            Both models map internal confidence scores to three display categories:
          </P>
          <div className="space-y-4 mb-4">
            {[
              {
                tier: "MODEL FAVORITE",
                color: "#10b981",
                bg: "rgba(16,185,129,0.08)",
                border: "rgba(16,185,129,0.2)",
                desc: "High model confidence with meaningful edge over the market. Sharp action is neutral or confirms the direction.",
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
                desc: "No clean edge. Could be model/Vegas alignment, a thin pitcher sample (MLB), a TBD starter, or sharp money contradicting the pick.",
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

        <Section title="What We Don&apos;t Do">
          <P>
            No tailing. No sharp consensus aggregation. No social media sentiment. No injury news
            that isn&apos;t already captured in the structured rotation data. No retroactive model
            adjustments. Every prediction is locked before tip-off or first pitch and never revised.
          </P>
          <P>
            These are research models. They are not gambling advice. The track record exists to show
            whether the edge holds over time — not to encourage anyone to bet.
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
