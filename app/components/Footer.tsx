import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-8 px-5" style={{ borderTop: "1px solid #1a2335" }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <span style={{ fontSize: 13, color: "#e6edf3", fontWeight: 700, letterSpacing: "-0.03em" }}>
            Line<span style={{ color: "#00e088" }}>r</span>up
          </span>
          <div className="flex gap-5">
            {[
              { href: "/methodology", label: "Methodology" },
              { href: "/track-record", label: "Track Record" },
              { href: "/about", label: "About" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="nav-link"
                style={{ fontSize: 12, color: "#c9d1d9" }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 11, color: "#7d8590", marginBottom: 8 }}>
          Auto-refreshed hourly · MLB season
        </p>
        <p style={{ fontSize: 11, color: "#4a5568", lineHeight: 1.6, maxWidth: "680px" }}>
          Linerup is a sports analytics research platform for entertainment purposes only. Nothing on
          this site constitutes gambling advice. If you or someone you know has a gambling problem,
          call <span style={{ color: "#4a5568" }}>1-800-GAMBLER</span>. Must be 21+ to bet where
          legal. Please gamble responsibly.
        </p>
      </div>
    </footer>
  );
}
