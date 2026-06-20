import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer style={{ background: "#060F1A", borderTop: "1px solid #1E3A5F" }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image src="/logo.png" alt="The Carrillo Agency" width={40} height={40} className="object-contain" />
              <div>
                <p className="text-xs tracking-widest text-[#C9A84C] font-semibold uppercase" style={{ lineHeight: 1 }}>The</p>
                <p className="text-base font-extrabold tracking-wide text-white" style={{ lineHeight: 1.2 }}>CARRILLO AGENCY</p>
              </div>
            </div>
            <p className="text-sm text-[#94A3B8] leading-relaxed max-w-xs">
              Independent insurance agency protecting families across all 50 states. Licensed Financial Planner & Insurance Broker.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2">
              {[
                { href: "/", label: "Home" },
                { href: "/licenses", label: "Licenses" },
                { href: "/join", label: "Work With Us" },
                { href: "/login", label: "Agent Login" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="text-sm text-[#94A3B8] hover:text-[#C9A84C] transition-colors">{label}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold tracking-widest uppercase text-[#C9A84C] mb-4">Contact</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:2108705200" className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors">
                <span className="text-[#C9A84C]">📞</span> (210) 870-5200
              </a>
              <a href="mailto:piocarrillosfg@gmail.com" className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors">
                <span className="text-[#C9A84C]">✉️</span> piocarrillosfg@gmail.com
              </a>
              <p className="flex items-center gap-2 text-sm text-[#94A3B8]">
                <span className="text-[#C9A84C]">📍</span> San Antonio, Texas
              </p>
              <p className="text-xs text-[#94A3B8] mt-1">NPN: 20849355 | Licensed in All 50 States</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#1E3A5F] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#94A3B8]">© {new Date().getFullYear()} The Carrillo Agency. All rights reserved.</p>
          <p className="text-xs text-[#94A3B8]">Pio Carrillo | Financial Planner & Insurance Broker | thecarrilloagency.com</p>
        </div>
      </div>
    </footer>
  );
}
