import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#0B1929", color: "#fff", fontFamily: "var(--font-montserrat), Arial, sans-serif" }}>
      <Nav />
      {children}
      <Footer />
      <SpeedInsights />
    </div>
  );
}
