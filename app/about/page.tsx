import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      <Header />
      <div className="max-w-3xl mx-auto px-5 py-12">
        <h1
          className="mb-2 tracking-tight"
          style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "#e6edf3" }}
        >
          About
        </h1>
        <p className="mb-12" style={{ fontSize: 15, color: "#8b95a8" }}>
          What this is and who built it.
        </p>

        <div style={{ maxWidth: "560px" }}>
          <p style={{ fontSize: 17, color: "#c9d1d9", lineHeight: 1.8, marginBottom: 20 }}>
            Linerup is a public sports analytics research platform built by Nick Ragone. The goal
            is to show what a disciplined, transparent analytical approach to sports modeling actually
            looks like — with every prediction public before the game and every result tracked afterward.
          </p>
          <p style={{ fontSize: 17, color: "#c9d1d9", lineHeight: 1.8, marginBottom: 20 }}>
            Most betting content is noise. Picks disappear behind paywalls until after the game.
            Losing streaks get quietly deleted. The analyst who was right three times in a row becomes
            a brand. This site is the opposite of that.
          </p>
          <p style={{ fontSize: 17, color: "#c9d1d9", lineHeight: 1.8, marginBottom: 20 }}>
            Two models currently run on Linerup: V10 for MLB (57.4% honest out-of-sample accuracy,
            2.6pp edge over baseline) and V7 for NBA (68.2% honest out-of-sample accuracy, 12.5pp
            edge over baseline). Every prediction is published before the game starts. Every result
            is logged. The methodology is explained in full. Nothing is sold. If the models stop
            working, the track record will show it before we do. That transparency is the point.
          </p>
          <p style={{ fontSize: 17, color: "#c9d1d9", lineHeight: 1.8, marginBottom: 40 }}>
            Questions or feedback?{" "}
            <a
              href="mailto:hello@linerup.bet"
              style={{ color: "#8b95a8" }}
            >
              hello@linerup.bet
            </a>
          </p>

          <div
            className="flex items-center gap-6 pt-6"
            style={{ borderTop: "1px solid #1a2335" }}
          >
            <Link
              href="/methodology"
              style={{ fontSize: 13, color: "#8b95a8" }}
            >
              Methodology →
            </Link>
            <Link
              href="/track-record"
              style={{ fontSize: 13, color: "#8b95a8" }}
            >
              Track record →
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
