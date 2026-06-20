import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "The Carrillo Agency | Insurance & Financial Protection",
  description: "Independent insurance agency based in San Antonio, TX. Life insurance, final expense, mortgage protection, and debt-free life solutions for families.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: "#0B1929", color: "#fff" }}>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
