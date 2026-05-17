import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-5 py-12">
        <Link
          href="/mlb"
          className="inline-block transition-colors duration-150 mb-10"
          style={{ fontSize: "13px", color: "#555" }}
        >
          ← Back
        </Link>

        <h1
          className="mb-2 tracking-tight"
          style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.03em" }}
        >
          About
        </h1>
        <p className="mb-12" style={{ fontSize: "15px", color: "#555" }}>
          What this is and why it exists.
        </p>

        <div style={{ maxWidth: "560px" }}>
          <p
            style={{ fontSize: "17px", color: "#999", lineHeight: 1.8, marginBottom: "20px" }}
          >
            Linerup is a public, transparent MLB betting model built by one person. The goal
            is simple: show what a disciplined analytical approach to MLB betting actually
            looks like, with every pick public and every result tracked.
          </p>
          <p
            style={{ fontSize: "17px", color: "#999", lineHeight: 1.8, marginBottom: "20px" }}
          >
            Most betting content is noise. Picks are hidden behind paywalls until after
            the game. Losing streaks disappear from the record. The &ldquo;sharp&rdquo;
            who was right three times in a row becomes a brand. This site is the opposite
            of that.
          </p>
          <p
            style={{ fontSize: "17px", color: "#999", lineHeight: 1.8, marginBottom: "20px" }}
          >
            Every prediction is published before first pitch. Every result is logged. The
            model is explained in full. Nothing is sold. If V8 stops working, the track
            record will show it. That transparency is the point.
          </p>
          <p
            style={{ fontSize: "17px", color: "#999", lineHeight: 1.8, marginBottom: "40px" }}
          >
            The site is called Linerup because it lives at linerup.bet, and because the
            model is really just a very disciplined way of reading the line.
          </p>

          <div
            className="flex items-center gap-6 pt-6"
            style={{ borderTop: "1px solid #1a1a1a" }}
          >
            <Link
              href="/methodology"
              className="transition-colors duration-150"
              style={{ fontSize: "13px", color: "#555" }}
            >
              Methodology →
            </Link>
            <Link
              href="/track-record"
              className="transition-colors duration-150"
              style={{ fontSize: "13px", color: "#555" }}
            >
              Track record →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
