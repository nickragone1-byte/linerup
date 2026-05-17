import Link from "next/link";

export default function HowItWorks() {
  return (
    <section
      className="max-w-3xl mx-auto px-5 py-10"
      style={{ borderTop: "1px solid #1a2335" }}
    >
      <h2
        className="uppercase mb-6"
        style={{ fontSize: 11, letterSpacing: "0.12em", color: "#4a5568" }}
      >
        How This Works
      </h2>

      <div style={{ maxWidth: "560px" }}>
        <p style={{ fontSize: 15, color: "#4a5568", lineHeight: 1.75, marginBottom: 16 }}>
          V8 is an 8-variable logistic regression model trained on 7,619 MLB games from 2023–2026,
          calibrated to 57.1% accuracy. It finds games where the model&apos;s win probability differs
          meaningfully from the Vegas-implied probability — that difference is the edge.
        </p>
        <p style={{ fontSize: 15, color: "#4a5568", lineHeight: 1.75, marginBottom: 16 }}>
          <span style={{ color: "#8b95a8" }}>Model Favorites</span> are games where V8 finds a clear
          edge above the market. <span style={{ color: "#8b95a8" }}>Leans</span> are positive-edge
          games with a smaller confidence window. Everything else is a pass.
        </p>
        <p style={{ fontSize: 15, color: "#4a5568", lineHeight: 1.75, marginBottom: 28 }}>
          Every prediction is published before first pitch. Every result is tracked. Nothing is sold.
          This is analytics research, not gambling advice.
        </p>

        <div className="flex items-center flex-wrap gap-x-6 gap-y-3">
          <Link
            href="/methodology"
            style={{ fontSize: 13, color: "#2a3a55" }}
          >
            Full methodology →
          </Link>
          <Link
            href="/track-record"
            style={{ fontSize: 13, color: "#2a3a55" }}
          >
            Track record →
          </Link>
          <Link
            href="/about"
            style={{ fontSize: 13, color: "#2a3a55" }}
          >
            About →
          </Link>
        </div>
      </div>
    </section>
  );
}
