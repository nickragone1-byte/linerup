import Link from "next/link";

export default function HowItWorks() {
  return (
    <section
      className="max-w-3xl mx-auto px-5 pt-8 pb-8"
      style={{ borderTop: "1px solid #1a2335" }}
    >
      <h2
        className="uppercase mb-5"
        style={{ fontSize: 12, letterSpacing: "0.10em", color: "#c9d1d9", fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}
      >
        How This Works
      </h2>

      <div style={{ maxWidth: "560px" }}>
        <p style={{ fontSize: 15, color: "#4a5568", lineHeight: 1.75, marginBottom: 16 }}>
          V8 is an 8-variable logistic regression model trained on 7,649 MLB games from 2023–2026,
          calibrated to 57.1% accuracy. It finds games where the model&apos;s win probability differs
          meaningfully from the Vegas-implied probability — that difference is the edge.
        </p>
        <p style={{ fontSize: 15, color: "#4a5568", lineHeight: 1.75, marginBottom: 16 }}>
          Model Favorites are games where V8 finds a clear edge above the market. Leans are
          positive-edge games with a smaller confidence window. Everything else is a pass.
        </p>
        <p style={{ fontSize: 15, color: "#4a5568", lineHeight: 1.75, marginBottom: 28 }}>
          Every prediction is published before first pitch. Every result is tracked. Nothing is sold.
          This is analytics research, not gambling advice.
        </p>

        <div className="flex items-center flex-wrap gap-x-6 gap-y-3">
          <Link
            href="/methodology"
            className="nav-link"
            style={{ fontSize: 13, color: "#c9d1d9" }}
          >
            Full methodology →
          </Link>
          <Link
            href="/track-record"
            className="nav-link"
            style={{ fontSize: 13, color: "#c9d1d9" }}
          >
            Track record →
          </Link>
          <Link
            href="/about"
            className="nav-link"
            style={{ fontSize: 13, color: "#c9d1d9" }}
          >
            About →
          </Link>
        </div>
      </div>
    </section>
  );
}
