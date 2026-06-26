import Link from "next/link";

export default function LifeInsurance() {
  return (
    <main className="min-h-screen" style={{ background: "#0B1929", color: "#fff" }}>
      <section className="py-20 px-6" style={{ background: "#112240", borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
        <div className="max-w-4xl mx-auto">
          <Link href="/#services" className="inline-flex items-center gap-2 text-[#C9A84C] text-sm font-semibold mb-8 hover:opacity-80">
            ← Back to Coverage Options
          </Link>
          <div className="text-5xl mb-6">🛡️</div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Life Insurance</h1>
          <p className="text-xl text-[#94A3B8] max-w-2xl leading-relaxed">
            Life insurance is the foundation of every strong financial plan. It replaces your income and protects your family&apos;s financial future if you are no longer here to provide for them.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-12">

          <div className="rounded-2xl p-8" style={{ background: "#112240", border: "1px solid rgba(201,168,76,0.15)" }}>
            <h2 className="text-2xl font-extrabold mb-4" style={{ color: "#C9A84C" }}>What Is Life Insurance?</h2>
            <p className="text-[#94A3B8] leading-relaxed mb-4">
              Life insurance is a contract between you and an insurance carrier. In exchange for monthly premiums, the carrier agrees to pay a tax-free lump sum — called a death benefit — to your chosen beneficiaries when you pass away. That money can replace your income, pay off debts, cover living expenses, fund your children&apos;s education, and ensure your family never has to start over from scratch.
            </p>
            <p className="text-[#94A3B8] leading-relaxed">
              There are two primary types of life insurance: <strong className="text-white">Term Life</strong> and <strong className="text-white">Whole Life (Permanent)</strong>. The right fit depends on your age, budget, goals, and family situation.
            </p>
          </div>

          {/* Term vs Whole */}
          <div>
            <h2 className="text-2xl font-extrabold mb-6">Term Life vs. Whole Life</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl p-7" style={{ background: "#112240", border: "1px solid rgba(201,168,76,0.15)" }}>
                <h3 className="text-xl font-extrabold mb-2" style={{ color: "#C9A84C" }}>Term Life Insurance</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed mb-4">
                  Term life covers you for a specific period — typically 10, 20, or 30 years. It is the most affordable type of life insurance and is ideal for families who need maximum coverage during their working years.
                </p>
                <ul className="space-y-2 text-sm text-[#94A3B8]">
                  {[
                    "Most affordable premiums",
                    "Simple and straightforward",
                    "High coverage amounts available",
                    "Ideal for income replacement",
                    "Best purchased young while healthy",
                  ].map((i) => (
                    <li key={i} className="flex gap-2"><span style={{ color: "#C9A84C" }}>✓</span>{i}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl p-7" style={{ background: "#112240", border: "1px solid rgba(201,168,76,0.15)" }}>
                <h3 className="text-xl font-extrabold mb-2" style={{ color: "#C9A84C" }}>Whole Life Insurance</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed mb-4">
                  Whole life covers you for your entire lifetime and builds guaranteed cash value over time. It is a permanent solution that also serves as a financial asset.
                </p>
                <ul className="space-y-2 text-sm text-[#94A3B8]">
                  {[
                    "Coverage that never expires",
                    "Builds guaranteed cash value",
                    "Premiums never increase",
                    "Can be borrowed against tax-free",
                    "Great for legacy planning",
                  ].map((i) => (
                    <li key={i} className="flex gap-2"><span style={{ color: "#C9A84C" }}>✓</span>{i}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Living Benefits */}
          <div className="rounded-2xl p-8" style={{ background: "#112240", border: "1px solid rgba(201,168,76,0.15)" }}>
            <h2 className="text-2xl font-extrabold mb-4" style={{ color: "#C9A84C" }}>Living Benefits — Access Your Policy While You&apos;re Alive</h2>
            <p className="text-[#94A3B8] leading-relaxed mb-4">
              Many modern life insurance policies now come with <strong className="text-white">living benefits</strong> — riders that allow you to access a portion of your death benefit while you are still alive if you are diagnosed with a qualifying critical, chronic, or terminal illness.
            </p>
            <p className="text-[#94A3B8] leading-relaxed mb-6">
              This means your policy is not just protection for after you are gone — it is a financial safety net you can use during your lifetime if a major health crisis strikes.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: "🫀", title: "Critical Illness", desc: "Heart attack, stroke, cancer diagnosis, and other major conditions can trigger early access to your benefit." },
                { icon: "♿", title: "Chronic Illness", desc: "If you are unable to perform two or more activities of daily living (bathing, dressing, eating), you may qualify." },
                { icon: "⏳", title: "Terminal Illness", desc: "A terminal diagnosis with 12–24 months life expectancy typically allows you to access the full benefit early." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="rounded-xl p-5" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)" }}>
                  <div className="text-3xl mb-3">{icon}</div>
                  <h3 className="font-bold mb-2">{title}</h3>
                  <p className="text-[#94A3B8] text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #112240, #1a3355)", border: "1px solid rgba(201,168,76,0.3)" }}>
            <h2 className="text-3xl font-extrabold mb-4">Find the Right Policy for Your Family</h2>
            <p className="text-[#94A3B8] mb-8 max-w-lg mx-auto">
              Every family is different. Pio will compare options across 40+ carriers to find you the best coverage at the best price — for free.
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
