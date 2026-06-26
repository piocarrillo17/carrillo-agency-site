import Image from "next/image";
import Link from "next/link";

const services = [
  {
    icon: "🛡️",
    title: "Life Insurance",
    desc: "Term and whole life policies that protect your family's future if the unexpected happens.",
    href: "/coverage/life-insurance",
  },
  {
    icon: "🏠",
    title: "Mortgage Protection",
    desc: "Ensure your family keeps the home you've worked so hard for — no matter what.",
    href: "/coverage/mortgage-protection",
  },
  {
    icon: "🕊️",
    title: "Final Expense",
    desc: "Affordable coverage that takes care of end-of-life costs so your loved ones don't have to.",
    href: "/coverage/final-expense",
  },
  {
    icon: "💳",
    title: "Debt-Free Life",
    desc: "Strategic plans to eliminate debt and build lasting financial freedom for your family.",
    href: "/coverage/debt-free-life",
  },
];

const carriers = [
  { name: "Mutual of Omaha", img: "/carrier-mutual-omaha.png" },
  { name: "Foresters", img: "/carrier-foresters.png" },
  { name: "SBLI", img: "/carrier-sbli.png" },
  { name: "F&G", img: "/carrier-fg.png" },
  { name: "Gerber Life", img: "/carrier-gerber.png" },
  { name: "American Amicable", img: null },
  { name: "Americo", img: null },
  { name: "Banner Life", img: null },
  { name: "Corebridge", img: null },
  { name: "Transamerica", img: null },
];

const stats = [
  { value: "All 50", label: "States Licensed" },
  { value: "40+", label: "Carrier Partners" },
  { value: "100%", label: "Independent & Unbiased" },
  { value: "Free", label: "Consultations" },
];

export default function Home() {
  return (
    <main>
      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&q=80"
            alt="Happy family"
            className="w-full h-full object-cover object-center"
            style={{ filter: "brightness(0.35)" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(11,25,41,0.95) 40%, rgba(11,25,41,0.4) 100%)" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
              style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C" }}>
              Licensed in All 50 States
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Your Family Deserves{" "}
              <span style={{ color: "#C9A84C" }}>the Best Protection.</span>
            </h1>
            <p className="text-lg text-[#94A3B8] mb-10 max-w-lg leading-relaxed">
              The Carrillo Agency is an independent insurance brokerage helping families protect what matters most — with unbiased advice from 40+ top-rated carriers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/quote"
                className="btn-gold px-8 py-4 rounded-xl text-base text-center">
                Get a Free Quote
              </Link>
              <a href="mailto:piocarrillosfg@gmail.com?subject=Coverage Question"
                className="btn-outline px-8 py-4 rounded-xl text-base text-center">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ background: "#C9A84C" }}>
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl md:text-3xl font-extrabold text-black">{value}</p>
              <p className="text-xs font-semibold text-black/70 uppercase tracking-wide mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-24 px-6" style={{ background: "#0B1929" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#C9A84C] text-sm font-semibold tracking-widest uppercase mb-3">What We Offer</p>
            <h2 className="text-4xl font-extrabold mb-4">Protection for Every Stage of Life</h2>
            <p className="text-[#94A3B8] max-w-xl mx-auto">
              Whether you are just starting a family or planning for retirement, we have a solution built for you.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map(({ icon, title, desc, href }) => (
              <Link key={title} href={href}
                className="card-navy rounded-2xl p-7 block transition-all hover:-translate-y-1 hover:border-[#C9A84C] group"
                style={{ border: "1px solid rgba(201,168,76,0.1)" }}>
                <div className="text-4xl mb-5">{icon}</div>
                <h3 className="text-lg font-bold mb-3 group-hover:text-[#C9A84C] transition-colors">{title}</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed mb-4">{desc}</p>
                <span className="text-xs font-semibold tracking-wide" style={{ color: "#C9A84C" }}>Learn More →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAMILY PHOTO STRIP */}
      <section className="py-16 px-6" style={{ background: "#F8FAFC" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { src: "https://images.unsplash.com/photo-1543342384-1f1350e27861?w=600&q=80", alt: "Happy family outdoors" },
              { src: "https://images.unsplash.com/photo-1511895426328-dc8714191011?w=600&q=80", alt: "Family laughing together" },
              { src: "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=600&q=80", alt: "Parents with young children" },
              { src: "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=600&q=80", alt: "Family portrait smiling" },
            ].map(({ src, alt }) => (
              <div key={alt} className="rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                <img src={src} alt={alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-24 px-6" style={{ background: "#F8FAFC" }}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: "#C9A84C" }}>Why Choose Us</p>
            <h2 className="text-4xl font-extrabold mb-6" style={{ color: "#0B1929" }}>
              We Work for You,<br />Not an Insurance Company.
            </h2>
            <p className="text-[#475569] mb-8 leading-relaxed">
              As an independent broker, Pio Carrillo has no loyalty to any single carrier. That means you get honest, unbiased recommendations from across the entire market — always in your best interest.
            </p>
            <div className="flex flex-col gap-4">
              {[
                { icon: "✅", text: "Access to 40+ top-rated carriers" },
                { icon: "✅", text: "Zero pressure, no sales quotas" },
                { icon: "✅", text: "Licensed in all 50 states" },
                { icon: "✅", text: "Personal service — you work directly with Pio" },
                { icon: "✅", text: "Free consultations, always" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <span className="text-[#1E293B] font-medium">{text}</span>
                </div>
              ))}
            </div>
            <Link href="/quote" className="inline-block mt-10 px-8 py-4 rounded-xl font-bold text-black text-base"
              style={{ background: "#C9A84C" }}>
              Get Your Free Quote
            </Link>
          </div>

          {/* Meet Pio */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(135deg, #C9A84C, #E8C97A)", transform: "scale(1.06)" }} />
              <Image
                src="/headshot.png"
                alt="Pio Carrillo"
                width={260}
                height={260}
                className="relative rounded-full object-cover object-top"
                style={{ border: "4px solid #fff" }}
              />
            </div>
            <h3 className="text-2xl font-extrabold mb-1" style={{ color: "#0B1929" }}>Pio Carrillo</h3>
            <p className="font-semibold mb-1" style={{ color: "#C9A84C" }}>Financial Planner & Insurance Broker</p>
            <p className="text-sm text-[#64748B]">NPN: 20849355</p>
          </div>
        </div>
      </section>

      {/* CARRIERS */}
      <section className="py-24 px-6" style={{ background: "#112240" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#C9A84C] text-sm font-semibold tracking-widest uppercase mb-3">Our Carrier Network</p>
            <h2 className="text-4xl font-extrabold mb-4">Brokered With the Best</h2>
            <p className="text-[#94A3B8] max-w-lg mx-auto">
              Access to 40+ of the nation's most trusted insurance providers means more options and better rates for your family.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {carriers.map(({ name, img }) => (
              <div key={name} className="card-navy rounded-xl p-5 flex flex-col items-center justify-center gap-3 min-h-[90px]">
                {img ? (
                  <img src={img} alt={name} className="h-10 w-full object-contain" style={{ filter: "brightness(0) invert(1)" }} />
                ) : (
                  <p className="text-sm font-bold text-center text-white">{name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-24 px-6" style={{ background: "#0B1929" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Ready to Protect <span style={{ color: "#C9A84C" }}>Your Family?</span>
          </h2>
          <p className="text-[#94A3B8] text-lg mb-10">
            Get a free, no-pressure consultation today. We will find the right coverage at the right price — guaranteed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quote" className="btn-gold px-10 py-4 rounded-xl text-lg">
              Get a Free Quote
            </Link>
            <a href="mailto:piocarrillosfg@gmail.com?subject=Coverage Question" className="btn-outline px-10 py-4 rounded-xl text-lg">
              Email Us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
