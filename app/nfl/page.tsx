import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export default function NFLPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      <Header />
      <div className="max-w-3xl mx-auto px-5 py-24 text-center">
        <p
          className="uppercase mb-4"
          style={{ fontSize: 11, letterSpacing: "0.12em", color: "#2a3a55" }}
        >
          NFL
        </p>
        <h1
          style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "#e6edf3", marginBottom: 12 }}
        >
          Coming August 2026
        </h1>
        <p style={{ fontSize: 15, color: "#4a5568", maxWidth: 400, margin: "0 auto" }}>
          NFL coverage launches with the 2026 preseason. The model applies the same
          8-variable edge-finding approach to NFL moneylines.
        </p>
      </div>
      <Footer />
    </div>
  );
}
