import { getResults } from "@/lib/data";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import TrackRecordUI from "@/app/components/TrackRecordUI";

export default async function TrackRecordPage() {
  const data = await getResults("mlb");
  return (
    <div className="min-h-screen" style={{ background: "#0a0e1a" }}>
      <Header />
      <TrackRecordUI data={data} />
      <Footer />
    </div>
  );
}
