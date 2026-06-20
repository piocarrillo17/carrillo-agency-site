"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/licenses", label: "Licenses" },
  { href: "/join", label: "Work With Us" },
  { href: "/login", label: "Agent Login" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#0A0A0A] border-b border-[#2A2A2A]">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-bold tracking-wide">
          <span className="text-[#C9A84C]">CARRILLO</span>
          <span className="text-white"> AGENCY</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(({ href, label }) => {
            const isLogin = href === "/login";
            const active = pathname === href;
            if (isLogin) {
              return (
                <Link
                  key={href}
                  href={href}
                  className="px-4 py-1.5 rounded border border-[#C9A84C] text-[#C9A84C] text-sm font-semibold hover:bg-[#C9A84C] hover:text-black transition-colors"
                >
                  {label}
                </Link>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium transition-colors hover:text-[#C9A84C] ${
                  active ? "text-[#C9A84C]" : "text-gray-300"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-300 hover:text-white"
          onClick={() => setOpen(!open)}
        >
          <span className="block w-6 h-0.5 bg-current mb-1.5" />
          <span className="block w-6 h-0.5 bg-current mb-1.5" />
          <span className="block w-6 h-0.5 bg-current" />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#111] border-t border-[#2A2A2A] px-6 py-4 flex flex-col gap-4">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`text-sm font-medium hover:text-[#C9A84C] transition-colors ${
                pathname === href ? "text-[#C9A84C]" : "text-gray-300"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
