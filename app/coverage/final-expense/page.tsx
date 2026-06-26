import Link from "next/link";

export default function FinalExpense() {
  return (
    <main className="min-h-screen" style={{ background: "#0B1929", color: "#fff" }}>
      <section className="py-20 px-6" style={{ background: "#112240", borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
        <div className="max-w-4xl mx-auto">
          <Link href="/#services" className="inline-flex items-center gap-2 text-[#C9A84C] text-sm font-semibold mb-8 hover:opacity-80">
            ← Back to Coverage Options
          </Link>
          <div className="text-5xl mb-6">🕊️</div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Final Expense Insurance</h1>
          <p className="text-xl text-[#94A3B8] max-w-2xl leading-relaxed">
            A final gift to the people you love most — final expense insurance ensures your family is never left with the burden of paying for your burial or end-of-life costs.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-12">

          <div className="rounded-2xl p-8" style={{ background: "#112240", border: "1px solid rgba(201,168,76,0.15)" }}>
            <h2 className="text-2xl font-extrabold mb-4" style={{ color: "#C9A84C" }}>What Is Final Expense Insurance?</h2>
            <p className="text-[#94A3B8] leading-relaxed mb-4">
              Final expense insurance is a type of whole life insurance with a smaller benefit amount — typically between $5,000 and $35,000 — designed specifically to cover the costs associated with passing away. This includes funeral and burial expenses, cremation, a headstone, outstanding medical bills, and any other immediate financial obligations left behind.
            </p>
            <p className="text-[#94A3B8] leading-relaxed">
              It is most commonly purchased by adults aged 50 to 85 who want to ensure that their children or spouse are not left scrambling to come up with thousands of dollars at the most emotionally difficult time of their lives.
            </p>
          </div>

          {/* The real cost */}
          <div className="rounded-2xl p-8" style={{ background: "#112240", border: "1px solid rgba(201,168,76,0.15)" }}>
            <h2 className="text-2xl font-extrabold mb-4" style={{ color: "#C9A84C" }}>The Real Cost of Saying Goodbye</h2>
            <p className="text-[#94A3B8] leading-relaxed mb-6">
              Many families are shocked by how expensive end-of-life costs have become. According to the National Funeral Directors Association, the average funeral costs between $8,000 and $12,000 — and that does not include burial plot costs, headstones, flowers, obituaries, or estate fees.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Average Funeral Cost", amount: "$9,000–$12,000" },
                { label: "Burial Plot & Headstone", amount: "$2,000–$5,000" },
                { label: "Cremation (Full Service)", amount: "$2,000–$5,000" },
                { label: "Outstanding Medical Bills", amount: "Varies widely" },
                { label: "Legal / Estate Fees", amount: "$1,000–$3,000" },
                { label: "Total Potential Burden", amount: "$10,000–$25,000+" },
              ].map(({ label, amount }) => (
                <div key={label} className="rounded-xl p-4 text-center" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)" }}>
                  <p className="text-[#94A3B8] text-xs uppercase tracking-wide mb-1">{label}</p>
                  <p className="font-extrabold text-lg" style={{ color: "#C9A84C" }}>{amount}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div>
            <h2 className="text-2xl font-extrabold mb-6">Why Families Choose Final Expense Coverage</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: "✅", title: "No medical exam required", desc: "Most final expense policies only require answers to a few health questions — no needles, no labs, no doctors." },
                { icon: "💲", title: "Very affordable premiums", desc: "Because benefit amounts are smaller, monthly premiums are often very manageable — even on a fixed income." },
                { icon: "🔒", title: "Lifetime coverage", desc: "Final expense is whole life insurance — it never expires as long as you pay the premium. Your family is protected for life." },
                { icon: "💵", title: "Cash paid directly to family", desc: "The benefit is paid tax-free directly to your named beneficiary — they use it however they need to honor your wishes." },
                { icon: "⏱️", title: "Quick approval", desc: "Most policies are approved within days, not weeks. Peace of mind comes fast." },
                { icon: "❤️", title: "A final act of love", desc: "Knowing you have taken care of this removes a massive emotional and financial burden from your children and spouse." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-4 rounded-xl p-5" style={{ background: "#112240", border: "1px solid rgba(201,168,76,0.1)" }}>
                  <span className="text-2xl shrink-0">{icon}</span>
                  <div>
                    <p className="font-bold mb-1">{title}</p>
                    <p className="text-[#94A3B8] text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Who it's for */}
          <div className="rounded-2xl p-8" style={{ background: "#112240", border: "1px solid rgba(201,168,76,0.15)" }}>
            <h2 className="text-2xl font-extrabold mb-4" style={{ color: "#C9A84C" }}>Who Is Final Expense Insurance For?</h2>
            <p className="text-[#94A3B8] leading-relaxed mb-4">
              Final expense insurance is the right fit for individuals who:
            </p>
            <ul className="space-y-3 text-[#94A3B8]">
              {[
                "Are between the ages of 50 and 85",
                "No longer have dependents relying on their income (kids are grown)",
                "Do not have large savings set aside for end-of-life costs",
                "Want to spare their children or spouse from financial stress at time of death",
                "May have pre-existing health conditions that make other insurance hard to qualify for",
                "Are on a fixed income but still want affordable, meaningful coverage",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span style={{ color: "#C9A84C" }} className="mt-1 shrink-0">›</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #112240, #1a3355)", border: "1px solid rgba(201,168,76,0.3)" }}>
            <h2 className="text-3xl font-extrabold mb-4">Give Your Family the Gift of Peace of Mind</h2>
            <p className="text-[#94A3B8] mb-8 max-w-lg mx-auto">
              Get a free quote today. Pio will find you the most affordable final expense coverage available — no pressure, no obligation.
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
