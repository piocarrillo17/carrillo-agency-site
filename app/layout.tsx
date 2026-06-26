import type { Metadata } from "next";
import { Montserrat, Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

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

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Carrillo Agency | Insurance & Financial Protection",
  description: "Independent insurance agency. Life insurance, final expense, mortgage protection, and debt-free life solutions for families across all 50 states.",
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${bebasNeue.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
