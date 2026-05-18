import Link from "next/link";

export default function HowItWorksNBA() {
  return (
    <section className="max-w-3xl mx-auto px-5 pb-8 pt-2">
      <h2
        className="uppercase mb-4"
        style={{ fontSize: 12, letterSpacing: "0.2em", color: "#c9d1d9", fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}
      >
        How This Works
      </h2>
      <div
        className="rounded-xl px-5 py-5"
        style={{ background: "#0f1422", border: "1px solid #1a2335" }}
      >
        <p style={{ fontSize: 14, color: "#c9d1d9", lineHeight: 1.7, marginBottom: 12 }}>
          V6 is a 16-variable logistic regression trained on 6,257 NBA games from 2022–2026,
          validated out-of-sample at 68.0% accuracy. It blends opponent-adjusted ratings,
          recent form (last 10 games), rest days, pace mismatches, and live injury detection
          (top-8 rotation players missing for each team).
        </p>
        <p style={{ fontSize: 14, color: "#c9d1d9", lineHeight: 1.7, marginBottom: 12 }}>
          Model Favorites are games where V6 finds a clear edge above the market spread. Leans
          are positive-edge games with a smaller confidence window. Everything else is a pass.
        </p>
        <p style={{ fontSize: 13, color: "#7d8590", lineHeight: 1.7 }}>
          Every prediction is published before tip-off. Every result is tracked. Nothing is sold.
          This is analytics research, not gambling advice.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/methodology"
            style={{ fontSize: 12, color: "#10b981", textDecoration: "none" }}
          >
            Full methodology →
          </Link>
          <Link
            href="/track-record"
            style={{ fontSize: 12, color: "#10b981", textDecoration: "none" }}
          >
            Track record →
          </Link>
          <Link
            href="/about"
            style={{ fontSize: 12, color: "#10b981", textDecoration: "none" }}
          >
            About →
          </Link>
        </div>
      </div>
    </section>
  );
}
