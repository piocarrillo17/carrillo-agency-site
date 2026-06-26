import Link from "next/link";

export default function DebtFreeLife() {
  return (
    <main className="min-h-screen" style={{ background: "#0B1929", color: "#fff" }}>
      <section className="py-20 px-6" style={{ background: "#112240", borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
        <div className="max-w-4xl mx-auto">
          <Link href="/#services" className="inline-flex items-center gap-2 text-[#C9A84C] text-sm font-semibold mb-8 hover:opacity-80">
            ← Back to Coverage Options
          </Link>
          <div className="text-5xl mb-6">💳</div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Debt-Free Life®</h1>
          <p className="text-xl text-[#94A3B8] max-w-2xl leading-relaxed">
            What if you could eliminate your debt AND build lasting financial security at the same time? Debt-Free Life® is a strategy that does exactly that — using the power of life insurance.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-12">

          <div className="rounded-2xl p-8" style={{ background: "#112240", border: "1px solid rgba(201,168,76,0.15)" }}>
            <h2 className="text-2xl font-extrabold mb-4" style={{ color: "#C9A84C" }}>What Is Debt-Free Life®?</h2>
            <p className="text-[#94A3B8] leading-relaxed mb-4">
              Debt-Free Life® is a proprietary financial strategy that harnesses a specially designed whole life insurance policy to help you pay off all of your debt — mortgage, car loans, student loans, credit cards — in a fraction of the time, while simultaneously building a tax-advantaged financial asset you own for life.
            </p>
            <p className="text-[#94A3B8] leading-relaxed">
              Instead of paying interest to banks and creditors for decades, you redirect a portion of those dollars into your own policy — one that grows guaranteed cash value, protects your family, and gives you full control of your financial future.
            </p>
          </div>

          {/* How it works */}
          <div>
            <h2 className="text-2xl font-extrabold mb-6">How Debt-Free Life® Works</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { num: "01", title: "Assess your debt picture", desc: "We review all of your outstanding debts — mortgage, auto, student loans, credit cards — to understand the full scope of what you owe and how long it will take to pay off at your current pace." },
                { num: "02", title: "Design a custom policy", desc: "We structure a whole life insurance policy specifically around your cash flow. Your premiums build guaranteed, tax-deferred cash value inside the policy." },
                { num: "03", title: "Use policy loans strategically", desc: "You borrow from your policy's cash value (at favorable rates) to pay down high-interest debts — then pay your policy back, effectively becoming your own bank." },
                { num: "04", title: "Accelerate your payoff timeline", desc: "By redirecting interest payments back into your own asset, many clients pay off all their debt 10–15 years faster — and come out with a permanent life insurance policy fully paid up." },
              ].map(({ num, title, desc }) => (
                <div key={num} className="rounded-2xl p-6" style={{ background: "#112240", border: "1px solid rgba(201,168,76,0.15)" }}>
                  <p className="font-extrabold mb-3" style={{ color: "#C9A84C", fontSize: "1.8rem", opacity: 0.5 }}>{num}</p>
                  <h3 className="font-bold text-lg mb-2">{title}</h3>
                  <p className="text-[#94A3B8] text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="rounded-2xl p-8" style={{ background: "#112240", border: "1px solid rgba(201,168,76,0.15)" }}>
            <h2 className="text-2xl font-extrabold mb-6" style={{ color: "#C9A84C" }}>What You Get</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: "📉", title: "Eliminate debt faster", desc: "Pay off everything — mortgage included — years or decades sooner than your current trajectory." },
                { icon: "💰", title: "Build guaranteed wealth", desc: "Your cash value grows at a guaranteed rate every year, completely unaffected by stock market volatility." },
                { icon: "🏦", title: "Become your own bank", desc: "Access your cash value at any time for any reason — without banks, credit checks, or approval processes." },
                { icon: "🛡️", title: "Protected for life", desc: "Your family is covered with a permanent death benefit that never expires, regardless of your health later in life." },
                { icon: "📊", title: "Tax advantages", desc: "Cash value grows tax-deferred. Loans from the policy are tax-free. And the death benefit passes income-tax-free to your beneficiaries." },
                { icon: "🔁", title: "Recycle interest to yourself", desc: "Instead of paying interest to Chase, Wells Fargo, or Navient — you pay it back to yourself inside your own policy." },
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

          {/* CTA */}
          <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #112240, #1a3355)", border: "1px solid rgba(201,168,76,0.3)" }}>
            <h2 className="text-3xl font-extrabold mb-4">Start Your Debt-Free Journey</h2>
            <p className="text-[#94A3B8] mb-8 max-w-lg mx-auto">
              Request a free consultation and Pio will build a custom Debt-Free Life® analysis for your specific situation — no obligation, no pressure.
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
