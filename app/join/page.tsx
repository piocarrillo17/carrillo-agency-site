export default function Join() {
  const leadTypes = [
    { icon: "🏠", name: "Mortgage Protection" },
    { icon: "💳", name: "Debt Free Life®" },
    { icon: "🛡️", name: "Term Life" },
    { icon: "❤️", name: "Final Expense" },
    { icon: "📈", name: "Indexed Universal Life" },
    { icon: "🏦", name: "Annuities" },
    { icon: "🌐", name: "General Life" },
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
      icon: "🏔️",
      name: "Summit Training Platform",
      desc: "Gamified, bite-sized interactive training modules for agents at every experience level. Start with Summit Basecamp and grow from there.",
    },
    {
      icon: "🎓",
      name: "Quility U",
      desc: "A full learning management system with interactive simulations, certification programs, progress tracking, and online report cards.",
    },
    {
      icon: "🎤",
      name: "Live Events & Webinars",
      desc: "Agency Owners Academy, Leaders Summit, National Sales Conferences, and weekly webinars covering field growth and business strategy.",
    },
    {
      icon: "🏢",
      name: "Corporate Support Team",
      desc: "Over 200 dedicated corporate staff providing conservation services, marketing assistance, and back-office support.",
    },
  ];

  const midnight = "#011684";
  const royal = "#1004dd";
  const skyBlue = "#00b7ff";
  const yellow = "#ffcc00";
  const darkest = "#00185e";

  return (
    <main style={{ background: "#fff", color: "#011684", fontFamily: "var(--font-montserrat), Arial, sans-serif" }}>

      {/* HERO */}
      <section className="relative flex items-center overflow-hidden" style={{ minHeight: "85vh", background: midnight }}>
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=80"
            alt="Insurance agent meeting with clients"
            className="w-full h-full object-cover object-center"
            style={{ opacity: 0.12 }}
          />
        </div>
        {/* Decorative diamond shapes — SFG brand element */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 z-0 overflow-hidden pointer-events-none hidden lg:block">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="absolute"
              style={{
                width: "160px", height: "160px",
                border: `3px solid rgba(0,183,255,${0.06 + i * 0.03})`,
                transform: `rotate(45deg) translate(${i * 40}px, ${i * 40}px)`,
                top: "20%", right: `${-40 + i * 60}px`,
              }} />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-28 w-full">
          <div className="max-w-3xl">
            <p className="font-black uppercase tracking-widest mb-5" style={{ color: skyBlue, fontSize: "0.7rem", letterSpacing: "0.2em" }}>
              Powered by Symmetry Financial Group
            </p>
            <h1 className="font-black leading-tight text-white mb-6"
              style={{ fontSize: "clamp(2.8rem, 6vw, 4.2rem)", fontWeight: 900, lineHeight: 1.1 }}>
              Own Your Career<br />
              <span style={{ color: yellow }}>with Symmetry<br />Financial Group.</span>
            </h1>
            <p className="mb-10 max-w-2xl leading-relaxed"
              style={{ fontSize: "1.1rem", fontWeight: 300, color: "rgba(255,255,255,0.82)" }}>
              The Carrillo Agency gives independent agents access to the industry&apos;s only value-based leads program, 80+ carrier contracts, best-in-class compensation, and true agency ownership — all on your schedule, from anywhere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#apply"
                className="px-10 py-4 rounded-lg text-black text-center transition-all hover:opacity-90"
                style={{ background: yellow, fontWeight: 900, letterSpacing: "0.06em", fontSize: "0.9rem" }}>
                GET STARTED
              </a>
              <a href="tel:2108705200"
                className="px-10 py-4 rounded-lg text-white text-center border-2 hover:bg-white hover:text-black transition-all"
                style={{ borderColor: skyBlue, fontWeight: 700, fontSize: "0.9rem" }}>
                Talk to Pio — (210) 870-5200
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ background: royal }}>
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "80+", label: "Insurance Carriers" },
            { value: "5,000+", label: "Agents Nationwide" },
            { value: "All 50", label: "States Licensed" },
            { value: "200+", label: "Corporate Support Staff" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="font-black text-white" style={{ fontSize: "2.4rem", fontWeight: 900 }}>{value}</p>
              <p className="text-white/70 uppercase tracking-widest mt-1" style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.18em" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED VIDEO — Get to Know SFG */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-black uppercase tracking-widest mb-3" style={{ color: royal, fontSize: "0.7rem", letterSpacing: "0.2em" }}>
              Watch Our Story
            </p>
            <h2 className="font-black leading-tight mb-4" style={{ color: midnight, fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 900 }}>
              Get to Know Symmetry Financial Group
            </h2>
            <p style={{ color: "#4a5568", fontWeight: 300, fontSize: "1rem", maxWidth: "480px", margin: "0 auto" }}>
              See why thousands of independent agents across all 50 states have chosen SFG to build their careers.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-xl" style={{ border: `2px solid ${royal}`, aspectRatio: "16/9" }}>
            <iframe
              src="https://fast.wistia.net/embed/iframe/jtdq52cwj8?videoFoam=true"
              title="Get to Know Symmetry Financial Group (2024)"
              allowFullScreen
              className="w-full h-full"
              style={{ border: "none", display: "block" }}
            />
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITIONS */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-black uppercase tracking-widest mb-3" style={{ color: royal, fontSize: "0.7rem", letterSpacing: "0.2em" }}>
              Why Symmetry Financial Group
            </p>
            <h2 className="font-black leading-tight mb-4" style={{ color: midnight, fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 900 }}>
              Experience the<br />Symmetry Difference.
            </h2>
            <p style={{ color: "#4a5568", fontWeight: 300, fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto" }}>
              Everything you need to build a real, lasting business in life insurance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: "01",
                title: "Value-Based Leads",
                sub: "The industry's only value-based leads program",
                desc: "Access Quility LeadStream — verified, TCPA-compliant leads across 7+ product types. Agents average a 3.5x return on their lead investment.",
              },
              {
                num: "02",
                title: "Compensation & Bonuses",
                sub: "Best-in-class compensation",
                desc: "Top-tier commission levels from day one with performance bonuses. Full transparency — what you earn is what you keep.",
              },
              {
                num: "03",
                title: "True Agency Ownership",
                sub: "Passive income opportunities",
                desc: "Build your own agency. Earn overrides, create passive income streams, and build real equity — not just a paycheck.",
              },
              {
                num: "04",
                title: "Proven System",
                sub: "Training, tech, and support",
                desc: "Summit platform, Quility U, live conferences, CRM tools, digital applications — a complete business system from day one.",
              },
            ].map(({ num, title, sub, desc }) => (
              <div key={num} className="flex flex-col p-8 rounded-2xl border transition-all hover:-translate-y-1"
                style={{ borderColor: "#e2e8f0", background: "#fafbff", boxShadow: "0 2px 12px rgba(1,22,132,0.05)" }}>
                <p className="font-black mb-4" style={{ color: midnight, fontSize: "2rem", fontWeight: 900, opacity: 0.12 }}>{num}</p>
                <h3 className="font-black mb-1" style={{ color: midnight, fontSize: "1.05rem", fontWeight: 900 }}>{title}</h3>
                <p className="font-black uppercase tracking-wider mb-3" style={{ color: skyBlue, fontSize: "0.58rem", fontWeight: 900, letterSpacing: "0.15em" }}>{sub}</p>
                <p style={{ color: "#4a5568", fontWeight: 300, fontSize: "0.88rem", lineHeight: "1.65" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEADS — Darkest Blue */}
      <section className="py-24 px-6" style={{ background: darkest }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-16">
            <div>
              <p className="font-black uppercase tracking-widest mb-4" style={{ color: skyBlue, fontSize: "0.7rem", letterSpacing: "0.2em" }}>
                Quility LeadStream
              </p>
              <h2 className="font-black leading-tight text-white mb-6" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 900 }}>
                A Leads Program<br />Built for Agents,<br />
                <span style={{ color: yellow }}>by Agents.</span>
              </h2>
              <p className="mb-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.75)", fontWeight: 300, fontSize: "1rem" }}>
                Stop chasing cold contacts. Quility LeadStream delivers verified, TCPA-compliant prospects in real time — fully customizable by type, source, and geography.
              </p>
              <p className="mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.75)", fontWeight: 300, fontSize: "1rem" }}>
                Symmetry agents average a <span className="font-black text-white">3.5x or greater return</span> on their lead investment. The more you invest, the more you grow.
              </p>
              <a href="#apply"
                className="inline-block px-8 py-4 rounded-lg text-black transition-all hover:opacity-90"
                style={{ background: yellow, fontWeight: 900, fontSize: "0.85rem", letterSpacing: "0.06em" }}>
                GET ACCESS TO LEADS
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {leadTypes.map(({ icon, name }) => (
                <div key={name} className="flex items-center gap-3 px-5 py-4 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0,183,255,0.2)" }}>
                  <span className="text-2xl">{icon}</span>
                  <span className="font-bold text-white" style={{ fontSize: "0.85rem", fontWeight: 700 }}>{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leads video */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,183,255,0.25)", aspectRatio: "16/9" }}>
            <iframe
              src="https://fast.wistia.net/embed/iframe/f1r12pibj7?videoFoam=true"
              title="Own Your Career | Effective Leads"
              allowFullScreen
              className="w-full h-full"
              style={{ border: "none", display: "block" }}
            />
          </div>
          <p className="text-center mt-4 font-bold uppercase tracking-widest" style={{ color: skyBlue, fontSize: "0.65rem", letterSpacing: "0.18em" }}>
            Own Your Career | Effective Leads
          </p>
        </div>
      </section>

      {/* TRAINING */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-black uppercase tracking-widest mb-3" style={{ color: royal, fontSize: "0.7rem", letterSpacing: "0.2em" }}>
              Training + Support
            </p>
            <h2 className="font-black leading-tight mb-4" style={{ color: midnight, fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 900 }}>
              You&apos;re Never<br />Building Alone.
            </h2>
            <p style={{ color: "#4a5568", fontWeight: 300, fontSize: "1.05rem", maxWidth: "480px", margin: "0 auto" }}>
              In-person events, webinars, digital courses, and 200+ corporate staff — all dedicated to your success.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {training.map(({ icon, name, desc }) => (
              <div key={name} className="flex gap-6 p-8 rounded-2xl"
                style={{ background: "#fafbff", border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(1,22,132,0.05)" }}>
                <div className="text-4xl shrink-0">{icon}</div>
                <div>
                  <h3 className="font-black mb-2" style={{ color: midnight, fontSize: "1.05rem", fontWeight: 900 }}>{name}</h3>
                  <p style={{ color: "#4a5568", fontWeight: 300, fontSize: "0.88rem", lineHeight: "1.65" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS + CARRIERS */}
      <section className="py-24 px-6" style={{ background: royal }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-black uppercase tracking-widest mb-3" style={{ color: yellow, fontSize: "0.7rem", letterSpacing: "0.2em" }}>
              Carriers + Products
            </p>
            <h2 className="font-black leading-tight mb-4 text-white" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 900 }}>
              80+ Carriers.<br />Every Product Your Clients Need.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.75)", fontWeight: 300, fontSize: "1.05rem", maxWidth: "520px", margin: "0 auto" }}>
              Access a wide range of products — many exclusive to Symmetry — through one of the largest carrier networks in the industry.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {products.map(({ name, desc }) => (
              <div key={name} className="p-6 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <div className="w-8 h-0.5 mb-4" style={{ background: yellow }} />
                <h3 className="font-black mb-2 text-white" style={{ fontSize: "1rem", fontWeight: 900 }}>{name}</h3>
                <p style={{ color: "rgba(255,255,255,0.7)", fontWeight: 300, fontSize: "0.85rem", lineHeight: "1.6" }}>{desc}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {["Mutual of Omaha", "Foresters", "F&G", "SBLI", "American Amicable", "Americo", "Banner Life", "Corebridge", "Transamerica", "Gerber Life", "United Home Life", "+ 70 More Carriers"].map((c) => (
              <span key={c} className="px-4 py-2 rounded-full font-bold text-sm"
                style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", fontWeight: 700 }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* WHO WE'RE LOOKING FOR */}
      <section className="py-24 px-6" style={{ background: midnight }}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="font-black uppercase tracking-widest mb-4" style={{ color: skyBlue, fontSize: "0.7rem", letterSpacing: "0.2em" }}>
              Who We&apos;re Looking For
            </p>
            <h2 className="font-black leading-tight text-white mb-6" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 900 }}>
              We Don&apos;t Hire Agents.<br />
              <span style={{ color: yellow }}>We Build Leaders.</span>
            </h2>
            <p className="mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.75)", fontWeight: 300, fontSize: "1rem" }}>
              We welcome people new to insurance and those with a sales background. If you are coachable and ready to build something real, we want to connect.
            </p>
            <div className="flex flex-col gap-4">
              {[
                "Self-motivated with clear income goals",
                "Comfortable talking to and helping people",
                "Willing to obtain a life license (we guide you)",
                "Life & health license is a plus",
                "Some sales experience preferred but not required",
                "Part-time or full-time — you set your schedule",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="font-black mt-0.5 shrink-0" style={{ color: yellow, fontSize: "1.1rem" }}>›</span>
                  <p style={{ color: "rgba(255,255,255,0.82)", fontWeight: 300, fontSize: "0.95rem" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: "460px" }}>
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80"
              alt="Young professional smiling with laptop"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(1,22,132,0.92) 100%)" }} />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="font-black text-white" style={{ fontSize: "1.5rem", fontWeight: 900 }}>Own Your Career.</p>
              <p className="font-bold" style={{ color: yellow, fontSize: "1rem", fontWeight: 700 }}>Experience the Symmetry Difference.</p>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO GALLERY — Recruiting */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-black uppercase tracking-widest mb-3" style={{ color: royal, fontSize: "0.7rem", letterSpacing: "0.2em" }}>
              Hear From Our Agents
            </p>
            <h2 className="font-black leading-tight mb-4" style={{ color: midnight, fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 900 }}>
              Real Stories. Real Results.
            </h2>
            <p style={{ color: "#4a5568", fontWeight: 300, fontSize: "1rem", maxWidth: "460px", margin: "0 auto" }}>
              See how agents across the country are building careers and changing their lives with Symmetry Financial Group.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { id: "5a31uqs1gj", title: "A Life-Changing Opportunity", duration: "3:49" },
              { id: "2j1xzp88qz", title: "If I Can Do It, You Can Do It", duration: "4:08" },
              { id: "kvh8pp0do1", title: "True Ownership & Equity", duration: "3:30" },
              { id: "8h11tc1dyc", title: "Living Your Legacy", duration: "3:20" },
            ].map(({ id, title, duration }) => (
              <div key={id}>
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #e2e8f0", aspectRatio: "16/9", boxShadow: "0 4px 20px rgba(1,22,132,0.08)" }}>
                  <iframe
                    src={`https://fast.wistia.net/embed/iframe/${id}?videoFoam=true`}
                    title={title}
                    allowFullScreen
                    className="w-full h-full"
                    style={{ border: "none", display: "block" }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between px-1">
                  <p className="font-black" style={{ color: midnight, fontSize: "0.9rem", fontWeight: 900 }}>{title}</p>
                  <p className="font-bold" style={{ color: skyBlue, fontSize: "0.75rem", fontWeight: 700 }}>{duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APPLY FORM */}
      <section id="apply" className="py-24 px-6" style={{ background: "#fafbff" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-black uppercase tracking-widest mb-3" style={{ color: royal, fontSize: "0.7rem", letterSpacing: "0.2em" }}>
              Start Your Journey
            </p>
            <h2 className="font-black leading-tight mb-4" style={{ color: midnight, fontSize: "clamp(2rem, 4vw, 2.5rem)", fontWeight: 900 }}>
              Apply to Join<br />The Carrillo Agency
            </h2>
            <p style={{ color: "#4a5568", fontWeight: 300, fontSize: "1rem" }}>
              Fill out the form and Pio will personally reach out within 24 hours.
            </p>
          </div>

          <form
            action="mailto:piocarrillosfg@gmail.com"
            method="GET"
            encType="text/plain"
            className="flex flex-col gap-5 rounded-2xl p-8"
            style={{ background: "#fafbff", border: "1.5px solid #e2e8f0", boxShadow: "0 4px 32px rgba(1,22,132,0.08)" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { label: "First Name", name: "First Name", placeholder: "John" },
                { label: "Last Name", name: "Last Name", placeholder: "Doe" },
              ].map(({ label, name, placeholder }) => (
                <div key={name}>
                  <label className="block font-bold mb-1.5" style={{ color: midnight, fontSize: "0.8rem", fontWeight: 700 }}>{label}</label>
                  <input type="text" name={name} required placeholder={placeholder}
                    className="w-full rounded-lg px-4 py-3 focus:outline-none"
                    style={{ background: "#fff", border: "1.5px solid #d1d5db", color: midnight, fontSize: "0.9rem", fontFamily: "inherit" }} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block font-bold mb-1.5" style={{ color: midnight, fontSize: "0.8rem", fontWeight: 700 }}>Phone Number</label>
                <input type="tel" name="Phone" required placeholder="(210) 000-0000"
                  className="w-full rounded-lg px-4 py-3 focus:outline-none"
                  style={{ background: "#fff", border: "1.5px solid #d1d5db", color: midnight, fontSize: "0.9rem", fontFamily: "inherit" }} />
              </div>
              <div>
                <label className="block font-bold mb-1.5" style={{ color: midnight, fontSize: "0.8rem", fontWeight: 700 }}>Email Address</label>
                <input type="email" name="Email" required placeholder="john@email.com"
                  className="w-full rounded-lg px-4 py-3 focus:outline-none"
                  style={{ background: "#fff", border: "1.5px solid #d1d5db", color: midnight, fontSize: "0.9rem", fontFamily: "inherit" }} />
              </div>
            </div>
            <div>
              <label className="block font-bold mb-1.5" style={{ color: midnight, fontSize: "0.8rem", fontWeight: 700 }}>State</label>
              <input type="text" name="State" placeholder="Texas"
                className="w-full rounded-lg px-4 py-3 focus:outline-none"
                style={{ background: "#fff", border: "1.5px solid #d1d5db", color: midnight, fontSize: "0.9rem", fontFamily: "inherit" }} />
            </div>
            <div>
              <label className="block font-bold mb-1.5" style={{ color: midnight, fontSize: "0.8rem", fontWeight: 700 }}>License Status</label>
              <select name="License"
                className="w-full rounded-lg px-4 py-3 focus:outline-none"
                style={{ background: "#fff", border: "1.5px solid #d1d5db", color: midnight, fontSize: "0.9rem", fontFamily: "inherit" }}>
                <option>No license yet — I need guidance</option>
                <option>Life license — active</option>
                <option>Life & Health license — active</option>
                <option>In progress</option>
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1.5" style={{ color: midnight, fontSize: "0.8rem", fontWeight: 700 }}>Sales or Insurance Experience</label>
              <select name="Experience"
                className="w-full rounded-lg px-4 py-3 focus:outline-none"
                style={{ background: "#fff", border: "1.5px solid #d1d5db", color: midnight, fontSize: "0.9rem", fontFamily: "inherit" }}>
                <option>No experience — brand new</option>
                <option>Some sales experience</option>
                <option>Insurance experience</option>
                <option>Experienced agent looking for a better opportunity</option>
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1.5" style={{ color: midnight, fontSize: "0.8rem", fontWeight: 700 }}>Tell us about your goals</label>
              <textarea name="Goals" rows={4}
                placeholder="What are you looking to build? Why are you interested in joining The Carrillo Agency?"
                className="w-full rounded-lg px-4 py-3 focus:outline-none resize-none"
                style={{ background: "#fff", border: "1.5px solid #d1d5db", color: midnight, fontSize: "0.9rem", fontFamily: "inherit" }} />
            </div>
            <button type="submit"
              className="w-full py-4 rounded-xl text-black mt-2 transition-all hover:opacity-90"
              style={{ background: yellow, fontWeight: 900, fontSize: "0.9rem", letterSpacing: "0.08em" }}>
              SUBMIT MY APPLICATION
            </button>
            <p className="text-center" style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 300 }}>
              No spam. Pio will personally follow up within 24 hours.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
