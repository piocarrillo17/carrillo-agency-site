export default function Join() {
  const leadTypes = [
    { icon: "🏠", name: "Mortgage Protection" },
    { icon: "💀", name: "Final Expense" },
    { icon: "💳", name: "Debt Free Life®" },
    { icon: "🛡️", name: "Term Life" },
    { icon: "📈", name: "Indexed Universal Life" },
    { icon: "🏦", name: "Annuities" },
    { icon: "❤️", name: "General Life" },
  ];

  const products = [
    { name: "Mortgage Protection", desc: "Protects mortgage payments in case of death, disability, or critical illness." },
    { name: "Term Life", desc: "Designed to last a designated length of time — affordable and straightforward." },
    { name: "Whole Life", desc: "Coverage that stays in force for life with guaranteed cash value growth." },
    { name: "Final Expense", desc: "Covers any end-of-life expenses so families are never left with the burden." },
    { name: "Indexed Universal Life", desc: "Permanent coverage with a cash-value component tied to market index performance." },
    { name: "Debt Free Life®", desc: "Harnesses life insurance coverage to eliminate debt and build lasting wealth." },
    { name: "Annuities", desc: "Generates guaranteed income during retirement years." },
  ];

  const training = [
    {
      name: "Summit Training Platform",
      desc: "Gamified, bite-sized interactive training modules for agents at every experience level. Start with Summit Basecamp and grow from there.",
      icon: "🏔️",
    },
    {
      name: "Quility U",
      desc: "A full learning management system with interactive simulations, certification programs, progress tracking, and online report cards.",
      icon: "🎓",
    },
    {
      name: "Live Events & Webinars",
      desc: "Agency Owners Academy, Leaders Summit, National Sales Conferences, and weekly webinars covering field growth and business strategy.",
      icon: "🎤",
    },
    {
      name: "Corporate Support Team",
      desc: "Over 200 dedicated corporate staff providing conservation services, marketing assistance, and back-office support.",
      icon: "🏢",
    },
  ];

  return (
    <main style={{ background: "#fff", color: "#111" }}>

      {/* HERO */}
      <section className="relative flex items-center overflow-hidden" style={{ minHeight: "80vh", background: "#000" }}>
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1920&q=80"
            alt="Agents working"
            className="w-full h-full object-cover object-center"
            style={{ opacity: 0.25 }}
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-28 w-full">
          <div className="max-w-3xl">
            <p className="text-sm font-bold tracking-widest uppercase mb-5" style={{ color: "#C9A84C" }}>
              Powered by Symmetry Financial Group
            </p>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-white mb-6">
              Revolutionizing<br />
              <span style={{ color: "#C9A84C" }}>How Life Insurance<br />Is Sold.</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed">
              The Carrillo Agency gives you the leads, training, technology, and 80+ carrier contracts you need to build a real business — on your schedule, from anywhere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#apply"
                className="px-10 py-4 rounded-lg font-bold text-black text-lg transition-all hover:opacity-90 text-center"
                style={{ background: "#C9A84C" }}>
                Start Your Journey
              </a>
              <a href="tel:2108705200"
                className="px-10 py-4 rounded-lg font-semibold text-lg border-2 border-white text-white hover:bg-white hover:text-black transition-all text-center">
                Talk to Pio — (210) 870-5200
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ background: "#C9A84C" }}>
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "$170K+", label: "Avg Full-Time Agent Income" },
            { value: "80+", label: "Carrier Contracts" },
            { value: "3.5x", label: "Avg Return on Lead Investment" },
            { value: "200+", label: "Corporate Support Staff" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl md:text-4xl font-extrabold text-black">{value}</p>
              <p className="text-xs font-bold text-black/70 uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4 PILLARS — SFG style icon sections */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: "#C9A84C" }}>
              What We Provide
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ color: "#111" }}>
              Everything You Need to Win
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#64748B" }}>
              We don&apos;t just hand you a contract. We give you a complete business system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: "📋",
                title: "Leads",
                sub: "A leads program built for agents, by agents",
                desc: "Access Quility LeadStream — verified, TCPA-compliant leads delivered in real time across 7+ product types. Agents average a 3.5x return on their lead investment.",
              },
              {
                icon: "🎓",
                title: "Training + Support",
                sub: "In-person events, webinars, and digital courses",
                desc: "From Summit Basecamp to Quility U certifications to live national conferences — plus 200+ corporate staff dedicated to your success.",
              },
              {
                icon: "🏢",
                title: "Carriers + Products",
                sub: "80+ carriers and exclusive products",
                desc: "Write business across mortgage protection, final expense, term life, IUL, Debt Free Life®, annuities, and more — many exclusive to SFG.",
              },
              {
                icon: "💻",
                title: "Tech Platform",
                sub: "Powerful tools throughout your workflow",
                desc: "CRM, quoting tools, digital applications, and instant underwriting decisions in many cases — everything in one place so you can focus on clients.",
              },
            ].map(({ icon, title, sub, desc }) => (
              <div key={title} className="flex flex-col p-8 rounded-2xl transition-all hover:-translate-y-1"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="text-4xl mb-5">{icon}</div>
                <h3 className="text-xl font-extrabold mb-1" style={{ color: "#111" }}>{title}</h3>
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#C9A84C" }}>{sub}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEADS — dedicated section like sfglife.com/leads */}
      <section className="py-24 px-6" style={{ background: "#111" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-16">
            <div>
              <p className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: "#C9A84C" }}>
                Quility LeadStream
              </p>
              <h2 className="text-4xl font-extrabold text-white mb-6">
                A Leads Program Built<br />for Agents, by Agents.
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Stop chasing cold contacts. Our lead system delivers verified, TCPA-compliant prospects directly to you — in real time. Leads are fully customizable by type, source, and geography.
              </p>
              <p className="text-gray-300 leading-relaxed mb-8">
                Symmetry agents average a <span className="text-white font-bold">3.5x or greater return</span> on their lead investment. The more you invest, the more you earn.
              </p>
              <a href="#apply"
                className="inline-block px-8 py-4 rounded-lg font-bold text-black transition-all hover:opacity-90"
                style={{ background: "#C9A84C" }}>
                Get Access to Leads
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {leadTypes.map(({ icon, name }) => (
                <div key={name} className="flex items-center gap-3 px-5 py-4 rounded-xl"
                  style={{ background: "#1A1A1A", border: "1px solid #2A2A2A" }}>
                  <span className="text-2xl">{icon}</span>
                  <span className="text-sm font-semibold text-white">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TRAINING */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: "#C9A84C" }}>
              Training + Support
            </p>
            <h2 className="text-4xl font-extrabold mb-4" style={{ color: "#111" }}>
              You&apos;re Never Building Alone.
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#64748B" }}>
              From your first sale to building your own agency, we have a system to support every stage of your growth.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {training.map(({ icon, name, desc }) => (
              <div key={name} className="flex gap-6 p-8 rounded-2xl"
                style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <div className="text-4xl shrink-0">{icon}</div>
                <div>
                  <h3 className="text-xl font-extrabold mb-2" style={{ color: "#111" }}>{name}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="py-24 px-6" style={{ background: "#F8FAFC" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: "#C9A84C" }}>
              Carriers + Products
            </p>
            <h2 className="text-4xl font-extrabold mb-4" style={{ color: "#111" }}>
              80+ Carriers. Every Product<br />Your Clients Need.
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#64748B" }}>
              Access a wide range of products — many of which can&apos;t be found anywhere else — through Symmetry&apos;s exclusive carrier network.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {products.map(({ name, desc }) => (
              <div key={name} className="p-6 rounded-2xl bg-white hover:-translate-y-1 transition-all"
                style={{ border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div className="w-2 h-2 rounded-full mb-4" style={{ background: "#C9A84C" }} />
                <h3 className="font-extrabold text-lg mb-2" style={{ color: "#111" }}>{name}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>{desc}</p>
              </div>
            ))}
          </div>
          {/* Carrier name tags */}
          <div className="flex flex-wrap gap-3 justify-center">
            {["American Amicable", "Americo", "F&G", "Foresters", "Banner Life", "Mutual of Omaha", "SBLI", "United Home Life", "Corebridge", "Transamerica", "Gerber Life", "80+ Total Carriers"].map((c) => (
              <span key={c} className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ background: "#111", color: "#fff", border: "1px solid #333" }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PHILOSOPHY / WHO WE'RE LOOKING FOR */}
      <section className="py-24 px-6" style={{ background: "#111" }}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: "#C9A84C" }}>
              Who We&apos;re Looking For
            </p>
            <h2 className="text-4xl font-extrabold text-white mb-6">
              We Don&apos;t Hire Agents.<br />We Build Leaders.
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              No experience? No problem. We welcome people new to insurance and those with a sales background. If you are coachable, driven, and ready to build real income on your terms — we want to talk.
            </p>
            <div className="flex flex-col gap-4">
              {[
                "Self-motivated with real income goals",
                "Comfortable talking to and helping people",
                "Willing to obtain a life license (we guide you)",
                "Life & health license is a plus",
                "Some sales experience preferred but not required",
                "Part-time or full-time — you set your schedule",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="font-bold text-lg mt-0.5" style={{ color: "#C9A84C" }}>✓</span>
                  <p className="text-gray-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: "460px" }}>
            <img
              src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=900&q=80"
              alt="Young professional working from home"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85) 100%)" }} />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="text-white text-2xl font-extrabold">Build Your Business.</p>
              <p className="text-lg font-bold" style={{ color: "#C9A84C" }}>Write Your Future.</p>
            </div>
          </div>
        </div>
      </section>

      {/* APPLY FORM */}
      <section id="apply" className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: "#C9A84C" }}>
              Start Your Journey
            </p>
            <h2 className="text-4xl font-extrabold mb-4" style={{ color: "#111" }}>
              Apply to Join the Team
            </h2>
            <p style={{ color: "#64748B" }}>
              Fill out the form and Pio will personally reach out within 24 hours.
            </p>
          </div>

          <form
            action="mailto:piocarrillosfg@gmail.com"
            method="GET"
            encType="text/plain"
            className="flex flex-col gap-5 rounded-2xl p-8"
            style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { label: "First Name", name: "First Name", placeholder: "John" },
                { label: "Last Name", name: "Last Name", placeholder: "Doe" },
              ].map(({ label, name, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-bold mb-1.5" style={{ color: "#374151" }}>{label}</label>
                  <input type="text" name={name} required placeholder={placeholder}
                    className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none"
                    style={{ background: "#fff", border: "1px solid #D1D5DB", color: "#111" }} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: "#374151" }}>Phone Number</label>
                <input type="tel" name="Phone" required placeholder="(210) 000-0000"
                  className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none"
                  style={{ background: "#fff", border: "1px solid #D1D5DB", color: "#111" }} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5" style={{ color: "#374151" }}>Email Address</label>
                <input type="email" name="Email" required placeholder="john@email.com"
                  className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none"
                  style={{ background: "#fff", border: "1px solid #D1D5DB", color: "#111" }} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#374151" }}>State</label>
              <input type="text" name="State" placeholder="Texas"
                className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none"
                style={{ background: "#fff", border: "1px solid #D1D5DB", color: "#111" }} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#374151" }}>License Status</label>
              <select name="License"
                className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none"
                style={{ background: "#fff", border: "1px solid #D1D5DB", color: "#111" }}>
                <option>No license yet — I need guidance</option>
                <option>Life license — active</option>
                <option>Life & Health license — active</option>
                <option>In progress</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#374151" }}>Sales or Insurance Experience</label>
              <select name="Experience"
                className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none"
                style={{ background: "#fff", border: "1px solid #D1D5DB", color: "#111" }}>
                <option>No experience — brand new</option>
                <option>Some sales experience</option>
                <option>Insurance experience</option>
                <option>Experienced agent looking for a better opportunity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5" style={{ color: "#374151" }}>What are your income goals?</label>
              <textarea name="Goals" rows={4}
                placeholder="Tell Pio why you want to join and what you are looking to build..."
                className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none resize-none"
                style={{ background: "#fff", border: "1px solid #D1D5DB", color: "#111" }} />
            </div>
            <button type="submit"
              className="w-full py-4 rounded-xl font-bold text-black text-base mt-2 transition-all hover:opacity-90"
              style={{ background: "#C9A84C" }}>
              Submit My Application
            </button>
            <p className="text-xs text-center" style={{ color: "#94A3B8" }}>
              No spam. Pio will personally follow up within 24 hours.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
