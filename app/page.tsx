import Link from "next/link";

const carriers = [
  "Mutual of Omaha", "Aetna", "Cigna", "Humana", "UnitedHealthcare",
  "Anthem", "Molina Healthcare", "WellCare", "Centene", "CVS Health",
  "Oscar Health", "Ambetter", "BCBS", "Allstate", "Transamerica",
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1000] via-[#0A0A0A] to-[#0A0A0A] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-[#C9A84C] text-sm font-semibold tracking-widest uppercase mb-4">
            Independent Insurance Agency
          </p>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Protecting Families.<br />
            <span className="text-[#C9A84C]">Building Futures.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-xl mx-auto">
            The Carrillo Agency is an independent brokerage offering unbiased coverage
            options from the nation&apos;s top carriers — tailored to your life and budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:piocarrillo17@gmail.com?subject=Free Quote Request"
              className="px-8 py-3 bg-[#C9A84C] text-black font-bold rounded hover:bg-[#E8C97A] transition-colors"
            >
              Get a Free Quote
            </a>
            <Link
              href="/licenses"
              className="px-8 py-3 border border-[#C9A84C] text-[#C9A84C] font-semibold rounded hover:bg-[#C9A84C] hover:text-black transition-colors"
            >
              View My Credentials
            </Link>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">
          Why Choose an <span className="text-[#C9A84C]">Independent Agent?</span>
        </h2>
        <p className="text-gray-400 text-center max-w-xl mx-auto mb-14">
          Unlike captive agents tied to one company, I work for you — shopping multiple
          carriers to find the best coverage at the best price.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "🏆",
              title: "Unbiased Advice",
              desc: "I have no quotas or brand loyalty. My only job is finding the right plan for your situation.",
            },
            {
              icon: "📋",
              title: "Multiple Carriers",
              desc: "Access to 15+ top-rated carriers means more options, more competition, and better rates for you.",
            },
            {
              icon: "🤝",
              title: "Personal Service",
              desc: "You work directly with me — not a call center. I am here for questions, claims, and renewals.",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#C9A84C] transition-colors">
              <div className="text-3xl mb-4">{icon}</div>
              <h3 className="text-lg font-bold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Carriers */}
      <section className="bg-[#111] border-y border-[#2A2A2A] py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Carriers I&apos;m <span className="text-[#C9A84C]">Brokered With</span>
          </h2>
          <p className="text-gray-400 text-center mb-12">
            Access to the nation&apos;s most trusted insurance providers.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {carriers.map((carrier) => (
              <div
                key={carrier}
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-5 text-center text-sm font-semibold text-gray-300 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
              >
                {carrier}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-extrabold mb-4">
          Ready to Get <span className="text-[#C9A84C]">Covered?</span>
        </h2>
        <p className="text-gray-400 mb-8">
          Let&apos;s find a plan that fits your life. Reach out today for a no-pressure,
          free consultation.
        </p>
        <a
          href="mailto:piocarrillo17@gmail.com?subject=Free Quote Request"
          className="inline-block px-10 py-4 bg-[#C9A84C] text-black font-bold text-lg rounded hover:bg-[#E8C97A] transition-colors"
        >
          Contact Me Today
        </a>
      </section>
    </main>
  );
}
