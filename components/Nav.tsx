"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/join", label: "Work With Us" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50" style={{ background: "rgba(11,25,41,0.97)", borderBottom: "1px solid #1E3A5F", backdropFilter: "blur(12px)" }}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-18" style={{ height: "72px" }}>
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="The Carrillo Agency" width={44} height={44} className="object-contain" />
          <div className="hidden sm:block">
            <p className="text-xs tracking-widest text-[#C9A84C] font-semibold uppercase" style={{ lineHeight: 1 }}>The</p>
            <p className="text-lg font-extrabold tracking-wide text-white" style={{ lineHeight: 1.1 }}>CARRILLO AGENCY</p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors hover:text-[#C9A84C] ${pathname === href ? "text-[#C9A84C]" : "text-gray-300"}`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/join#apply"
            className="btn-gold px-5 py-2 rounded-lg text-sm"
          >
            Join Our Team
          </Link>
          <Link
            href="/login"
            className="btn-outline px-5 py-2 rounded-lg text-sm"
          >
            Agent Login
          </Link>
        </div>

        <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setOpen(!open)}>
          <span className="block w-6 h-0.5 bg-white" />
          <span className="block w-6 h-0.5 bg-white" />
          <span className="block w-6 h-0.5 bg-white" />
        </button>
      </div>

      {open && (
        <div className="md:hidden px-6 py-5 flex flex-col gap-4 border-t border-[#1E3A5F]" style={{ background: "#0B1929" }}>
          {links.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={`text-sm font-medium hover:text-[#C9A84C] transition-colors ${pathname === href ? "text-[#C9A84C]" : "text-gray-300"}`}>
              {label}
            </Link>
          ))}
          <Link href="/join#apply" onClick={() => setOpen(false)} className="btn-gold px-5 py-2.5 rounded-lg text-sm text-center">Join Our Team</Link>
          <Link href="/login" onClick={() => setOpen(false)} className="btn-outline px-5 py-2.5 rounded-lg text-sm text-center">Agent Login</Link>
        </div>
      )}
    </nav>
  );
}
