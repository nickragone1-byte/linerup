import Link from "next/link";

export default function HowItWorksNBA() {
  return (
    <section
      className="max-w-3xl mx-auto px-5 pt-8 pb-8"
      style={{ borderTop: "1px solid #1a2335" }}
    >
      <h2
        className="uppercase mb-5"
        style={{ fontSize: 12, letterSpacing: "0.2em", color: "#c9d1d9", fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}
      >
        How This Works
      </h2>

      <div style={{ maxWidth: "560px" }}>
        <p style={{ fontSize: 15, color: "#c9d1d9", lineHeight: 1.75, marginBottom: 16 }}>
          V7 is a logistic regression model trained on 6,258 NBA games from 2022–2026,
          validated out-of-sample at 68.2% honest accuracy. It blends opponent-adjusted
          ratings, recent form, rest days, pace mismatches, and live injury detection for
          each team&apos;s top-8 rotation players.
        </p>
        <p style={{ fontSize: 15, color: "#c9d1d9", lineHeight: 1.75, marginBottom: 16 }}>
          Model Favorites are games where V7 finds a clear edge with positive expected value. Leans are positive-EV plays with a smaller confidence window. Cautious Plays show the full slate — including games with market disagreement or injury concerns.
        </p>
        <p style={{ fontSize: 15, color: "#c9d1d9", lineHeight: 1.75, marginBottom: 28 }}>
          Every prediction is published before tip-off. Every result is tracked. Nothing is
          sold. This is analytics research, not gambling advice.
        </p>

        <div className="flex items-center flex-wrap gap-x-6 gap-y-3">
          <Link href="/methodology" className="nav-link" style={{ fontSize: 13, color: "#c9d1d9" }}>
            Full methodology →
          </Link>
          <Link href="/track-record" className="nav-link" style={{ fontSize: 13, color: "#c9d1d9" }}>
            Track record →
          </Link>
          <Link href="/about" className="nav-link" style={{ fontSize: 13, color: "#c9d1d9" }}>
            About →
          </Link>
        </div>
      </div>
    </section>
  );
}
