import Link from "next/link";

export default function MortgageProtection() {
  return (
    <main className="min-h-screen" style={{ background: "#0B1929", color: "#fff" }}>
      {/* Hero */}
      <section className="py-20 px-6" style={{ background: "#112240", borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
        <div className="max-w-4xl mx-auto">
          <Link href="/#services" className="inline-flex items-center gap-2 text-[#C9A84C] text-sm font-semibold mb-8 hover:opacity-80">
            ← Back to Coverage Options
          </Link>
          <div className="text-5xl mb-6">🏠</div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
            Mortgage Protection Insurance
          </h1>
          <p className="text-xl text-[#94A3B8] max-w-2xl leading-relaxed">
            Your home is likely the biggest investment your family will ever make. Mortgage protection ensures that if something happens to you, your family never has to worry about losing it.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* What is it */}
          <div className="rounded-2xl p-8" style={{ background: "#112240", border: "1px solid rgba(201,168,76,0.15)" }}>
            <h2 className="text-2xl font-extrabold mb-4" style={{ color: "#C9A84C" }}>What Is Mortgage Protection?</h2>
            <p className="text-[#94A3B8] leading-relaxed mb-4">
              Mortgage protection is a life insurance policy specifically designed to cover your outstanding mortgage balance. If you — the primary earner — were to pass away unexpectedly, the policy pays off the remaining balance on your home loan directly, so your spouse and children can stay in the home without financial strain.
            </p>
            <p className="text-[#94A3B8] leading-relaxed">
              Unlike standard renters or homeowners insurance, mortgage protection is about protecting your <em>family&apos;s ability to remain in the home</em> — not the physical structure. It gives your loved ones a roof over their heads at the moment they need stability the most.
            </p>
          </div>

          {/* How it works */}
          <div>
            <h2 className="text-2xl font-extrabold mb-6">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: "01", title: "You purchase the policy", desc: "You choose a coverage amount that matches your current mortgage balance and a term that aligns with how many years remain on your loan." },
                { step: "02", title: "You pay a monthly premium", desc: "Premiums are locked in and predictable. Coverage stays in force as long as you keep the policy active." },
                { step: "03", title: "Your family is protected", desc: "If you pass away during the policy term, the death benefit pays off the remaining mortgage — your family keeps the home, free and clear." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="rounded-2xl p-6" style={{ background: "#112240", border: "1px solid rgba(201,168,76,0.15)" }}>
                  <p className="font-extrabold mb-3" style={{ color: "#C9A84C", fontSize: "1.8rem", opacity: 0.5 }}>{step}</p>
                  <h3 className="font-bold text-lg mb-2">{title}</h3>
                  <p className="text-[#94A3B8] text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Benefits */}
          <div className="rounded-2xl p-8" style={{ background: "#112240", border: "1px solid rgba(201,168,76,0.15)" }}>
            <h2 className="text-2xl font-extrabold mb-6">Key Benefits</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: "🏡", title: "Your family keeps the home", desc: "The mortgage is paid off so your spouse and children are never forced to sell or relocate during an already devastating time." },
                { icon: "💰", title: "Affordable premiums", desc: "Mortgage protection policies are often very affordable, especially when purchased while you are young and healthy." },
                { icon: "📋", title: "Simplified underwriting", desc: "Many mortgage protection policies offer simplified or guaranteed-issue underwriting, meaning fewer medical hoops to jump through." },
                { icon: "🔒", title: "Locked-in rates", desc: "Your premiums are fixed at the time you purchase — they do not increase as you age or as your health changes." },
                { icon: "⏱️", title: "Term matched to your loan", desc: "Choose a 10, 15, 20, or 30-year term to line up exactly with your mortgage payoff date." },
                { icon: "❤️", title: "Peace of mind", desc: "Knowing your family will never lose the home you worked so hard for is invaluable — mortgage protection delivers that certainty." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <span className="text-2xl shrink-0">{icon}</span>
                  <div>
                    <p className="font-bold mb-1">{title}</p>
                    <p className="text-[#94A3B8] text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Who needs it */}
          <div>
            <h2 className="text-2xl font-extrabold mb-4">Who Should Consider Mortgage Protection?</h2>
            <p className="text-[#94A3B8] leading-relaxed mb-6">
              Mortgage protection is especially valuable for:
            </p>
            <ul className="space-y-3 text-[#94A3B8]">
              {[
                "New homeowners who just took on a significant mortgage",
                "Families with one primary income earner",
                "Parents with young children who depend on the home for stability",
                "Anyone who recently refinanced and extended their loan term",
                "Homeowners who do not yet have sufficient life insurance in place",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span style={{ color: "#C9A84C" }} className="mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #112240, #1a3355)", border: "1px solid rgba(201,168,76,0.3)" }}>
            <h2 className="text-3xl font-extrabold mb-4">Ready to Protect Your Home?</h2>
            <p className="text-[#94A3B8] mb-8 max-w-lg mx-auto">
              Get a free, no-pressure quote today. Pio will personally review your mortgage details and find the best coverage at the best rate.
            </p>
            <Link href="/quote" className="inline-block px-10 py-4 rounded-xl font-extrabold text-black text-lg hover:opacity-90 transition-opacity"
              style={{ background: "#C9A84C" }}>
              Get My Free Quote
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
