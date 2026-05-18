import { getResults } from "@/lib/data";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import TrackRecordUI from "@/app/components/TrackRecordUI";

export default async function TrackRecordPage() {
  const [mlbData, nbaData] = await Promise.all([
    getResults("mlb"),
    getResults("nba"),
  ]);
  return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      <Header />
      <TrackRecordUI mlbData={mlbData} nbaData={nbaData} />
      <Footer />
    </div>
  );
}
