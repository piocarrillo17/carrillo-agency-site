import type { Metadata } from "next";
import { Montserrat, Bebas_Neue } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { SpeedInsights } from "@vercel/speed-insights/next";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bebas",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Carrillo Agency | Insurance & Financial Protection",
  description: "Independent insurance agency based in San Antonio, TX. Life insurance, final expense, mortgage protection, and debt-free life solutions for families.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${bebasNeue.variable}`}>
      <body className="min-h-screen" style={{ background: "#0B1929", color: "#fff", fontFamily: "var(--font-montserrat), Arial, sans-serif" }}>
        <Nav />
        {children}
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}
