import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Carrillo Agency",
  description: "Independent insurance agency — protecting families, building futures.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0A0A0A] text-white">
        <Nav />
        {children}
        <footer className="border-t border-[#2A2A2A] mt-20 py-10 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Carrillo Agency. All rights reserved.</p>
          <p className="mt-1">Licensed Insurance Professional | thecarrilloagency.com</p>
        </footer>
      </body>
    </html>
  );
}
