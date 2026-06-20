import Image from "next/image";
import Link from "next/link";

const services = [
  {
    icon: "🛡️",
    title: "Life Insurance",
    desc: "Term and whole life policies that protect your family's future if the unexpected happens.",
  },
  {
    icon: "🏠",
    title: "Mortgage Protection",
    desc: "Ensure your family keeps the home you've worked so hard for — no matter what.",
  },
  {
    icon: "🕊️",
    title: "Final Expense",
    desc: "Affordable coverage that takes care of end-of-life costs so your loved ones don't have to.",
  },
  {
    icon: "💳",
    title: "Debt-Free Life",
    desc: "Strategic plans to eliminate debt and build lasting financial freedom for your family.",
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
  { value: "10+", label: "Carrier Partners" },
  { value: "100%", label: "Independent & Unbiased" },
  { value: "Free", label: "Consultations" },
];

export default function Home() {
  return (
    <main>
      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background image */}
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
              San Antonio, Texas · Licensed in All 50 States
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Your Family Deserves{" "}
              <span style={{ color: "#C9A84C" }}>the Best Protection.</span>
            </h1>
            <p className="text-lg text-[#94A3B8] mb-10 max-w-lg leading-relaxed">
              The Carrillo Agency is an independent insurance brokerage helping families protect what matters most — with unbiased advice from 10+ top-rated carriers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="tel:2108705200"
                className="btn-gold px-8 py-4 rounded-xl text-base text-center">
                📞 Call (210) 870-5200
              </a>
              <a href="mailto:piocarrillosfg@gmail.com?subject=Free Quote Request"
                className="btn-outline px-8 py-4 rounded-xl text-base text-center">
                Get a Free Quote
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
      <section className="py-24 px-6" style={{ background: "#0B1929" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#C9A84C] text-sm font-semibold tracking-widest uppercase mb-3">What We Offer</p>
            <h2 className="text-4xl font-extrabold mb-4">Protection for Every Stage of Life</h2>
            <p className="text-[#94A3B8] max-w-xl mx-auto">
              Whether you are just starting a family or planning for retirement, we have a solution built for you.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map(({ icon, title, desc }) => (
              <div key={title} className="card-navy rounded-2xl p-7">
                <div className="text-4xl mb-5">{icon}</div>
                <h3 className="text-lg font-bold mb-3">{title}</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHOTO STRIP — SFG mood: candid, diverse, professional */}
      <section className="py-16 px-6" style={{ background: "#F8FAFC" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { src: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80", alt: "Agent meeting with family at home" },
              { src: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80", alt: "Professional woman with documents" },
              { src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80", alt: "Person working from home on laptop" },
              { src: "https://images.unsplash.com/photo-1543342384-1f1350e27861?w=600&q=80", alt: "Happy family outdoors" },
            ].map(({ src, alt }) => (
              <div key={alt} className="rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                <img src={src} alt={alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US — light section */}
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
                { icon: "✅", text: "Access to 10+ top-rated carriers" },
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
            <a href="tel:2108705200" className="inline-block mt-10 px-8 py-4 rounded-xl font-bold text-black text-base"
              style={{ background: "#C9A84C" }}>
              Talk to Pio Today
            </a>
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
            <p className="text-sm text-[#64748B] mb-1">NPN: 20849355</p>
            <p className="text-sm text-[#64748B]">San Antonio, Texas</p>
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
              Access to the nation's most trusted insurance providers means more options and better rates for your family.
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
            <a href="tel:2108705200" className="btn-gold px-10 py-4 rounded-xl text-lg">
              📞 Call Now
            </a>
            <a href="mailto:piocarrillosfg@gmail.com?subject=Free Quote Request" className="btn-outline px-10 py-4 rounded-xl text-lg">
              Email Us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
