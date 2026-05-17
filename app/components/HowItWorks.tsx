import Link from "next/link";

export default function HowItWorks() {
  return (
    <section
      className="max-w-3xl mx-auto px-5 py-10"
      style={{ borderTop: "1px solid #1a1a1a" }}
    >
      <h2
        className="uppercase mb-7"
        style={{ fontSize: "11px", letterSpacing: "0.12em", color: "#555" }}
      >
        How This Works
      </h2>

      <div style={{ maxWidth: "560px" }}>
        <p style={{ fontSize: "15px", color: "#666", lineHeight: 1.75, marginBottom: "16px" }}>
          V8 is an 8-variable logistic regression model trained on 7,619 MLB games from
          2023–2026, calibrated to 57.1% accuracy. It compares model win probability against
          Vegas-implied probability to find edge where the market is mispriced.
        </p>
        <p style={{ fontSize: "15px", color: "#666", lineHeight: 1.75, marginBottom: "16px" }}>
          <span style={{ color: "#ccc" }}>PLAY</span> games have ≥60% model confidence with
          meaningful edge over the market.{" "}
          <span style={{ color: "#ccc" }}>LEAN</span> games have positive but smaller
          edge — worth a reduced unit if you agree with the model. Everything else is a pass.
        </p>
        <p style={{ fontSize: "15px", color: "#666", lineHeight: 1.75, marginBottom: "28px" }}>
          We do not sell picks. We do not tweet locks. Every prediction is published before
          first pitch. Every result is tracked.
        </p>

        <div className="flex items-center flex-wrap gap-x-6 gap-y-3">
          <Link
            href="/methodology"
            className="transition-colors duration-150"
            style={{ fontSize: "13px", color: "#555" }}
          >
            Full methodology →
          </Link>
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
    </section>
  );
}
