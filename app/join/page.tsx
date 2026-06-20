export default function Join() {
  return (
    <main>
      {/* HERO */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1920&q=80"
            alt="Agents working"
            className="w-full h-full object-cover object-center"
            style={{ filter: "brightness(0.25)" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(11,25,41,0.97) 50%, rgba(11,25,41,0.5) 100%)" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
              style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C" }}>
              Join The Carrillo Agency
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Build Your Business.<br />
              <span style={{ color: "#C9A84C" }}>Write Your Future.</span>
            </h1>
            <p className="text-xl text-[#94A3B8] mb-10 leading-relaxed">
              We are looking for driven individuals who want to build a real income on their own terms — from anywhere in the country.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#apply" className="btn-gold px-8 py-4 rounded-xl text-base text-center">
                Apply Now — It&apos;s Free
              </a>
              <a href="tel:2108705200" className="btn-outline px-8 py-4 rounded-xl text-base text-center">
                📞 Talk to Pio First
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ background: "#C9A84C" }}>
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "$170K+", label: "Avg Full-Time Agent Income" },
            { value: "10+", label: "Carrier Contracts" },
            { value: "100%", label: "Remote Friendly" },
            { value: "Leads", label: "Provided to Agents" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl md:text-3xl font-extrabold text-black">{value}</p>
              <p className="text-xs font-semibold text-black/70 uppercase tracking-wide mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PEOPLE OVER PROFIT */}
      <section className="py-24 px-6" style={{ background: "#0B1929" }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#C9A84C] text-sm font-semibold tracking-widest uppercase mb-4">Our Philosophy</p>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">People &gt; Profit.</h2>
          <p className="text-[#94A3B8] text-lg leading-relaxed max-w-2xl mx-auto">
            We are not just handing you a contract and wishing you luck. The Carrillo Agency is built on real mentorship, real training, and real results. Your win is our win.
          </p>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="py-24 px-6" style={{ background: "#F8FAFC" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: "#C9A84C" }}>The Opportunity</p>
            <h2 className="text-4xl font-extrabold mb-4" style={{ color: "#0B1929" }}>Everything You Need to Win</h2>
            <p className="max-w-xl mx-auto" style={{ color: "#475569" }}>
              We give you the tools, training, and support to build a real career — or a 6-figure side income.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "💰", title: "Aggressive Compensation", desc: "Top-tier commission levels from day one. The average full-time agent earns over $170,000 a year.", highlight: true },
              { icon: "📱", title: "Work From Anywhere", desc: "All you need is a laptop and a phone. Work from home, a coffee shop, or anywhere in the U.S.", highlight: false },
              { icon: "🎓", title: "Full Training & Mentorship", desc: "Bootcamps, weekly webinars, 1-on-1 coaching, and a proven system — you never figure it out alone.", highlight: false },
              { icon: "📋", title: "Leads Provided", desc: "We provide leads so you can focus on helping families — not chasing down cold contacts.", highlight: false },
              { icon: "🏢", title: "10+ Carrier Contracts", desc: "Write business with top carriers in life insurance, final expense, mortgage protection, and more.", highlight: false },
              { icon: "📈", title: "3 Types of Income", desc: "Personal production, team overrides, and agency ownership — build multiple income streams over time.", highlight: false },
            ].map(({ icon, title, desc, highlight }) => (
              <div key={title} className="rounded-2xl p-7 transition-all"
                style={{
                  background: highlight ? "#112240" : "#fff",
                  border: highlight ? "2px solid #C9A84C" : "1px solid #E2E8F0",
                  color: highlight ? "#fff" : "#0B1929",
                }}>
                <div className="text-4xl mb-5">{icon}</div>
                <h3 className="text-lg font-bold mb-3">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: highlight ? "#94A3B8" : "#64748B" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO WE'RE LOOKING FOR */}
      <section className="py-24 px-6" style={{ background: "#112240" }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[#C9A84C] text-sm font-semibold tracking-widest uppercase mb-4">Ideal Candidate</p>
            <h2 className="text-4xl font-extrabold mb-6">You Don&apos;t Need Experience.<br />You Need Drive.</h2>
            <p className="text-[#94A3B8] mb-8 leading-relaxed">
              We welcome people new to insurance and those with a sales background. If you are coachable and hungry to build something real, we want to talk.
            </p>
            <div className="flex flex-col gap-4">
              {[
                "Self-motivated and goal-oriented",
                "Comfortable talking to people",
                "Willing to obtain a life license (we guide you)",
                "Life & health license is a plus",
                "Some sales experience preferred but not required",
                "Looking to build income — not just earn a paycheck",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="text-[#C9A84C] font-bold mt-0.5">✓</span>
                  <p className="text-[#94A3B8] text-sm">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: "400px" }}>
            <img
              src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80"
              alt="Young professional working from home"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 60%, rgba(17,34,64,0.9) 100%)" }} />
          </div>
        </div>
      </section>

      {/* APPLY FORM */}
      <section id="apply" className="py-24 px-6" style={{ background: "#0B1929" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#C9A84C] text-sm font-semibold tracking-widest uppercase mb-3">Get Started</p>
            <h2 className="text-4xl font-extrabold mb-4">Apply to Join the Team</h2>
            <p className="text-[#94A3B8]">Fill out the form below and Pio will personally reach out within 24 hours.</p>
          </div>

          <form
            action="mailto:piocarrillosfg@gmail.com"
            method="GET"
            encType="text/plain"
            className="flex flex-col gap-5 rounded-2xl p-8"
            style={{ background: "#112240", border: "1px solid #1E3A5F" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[{ label: "First Name", name: "First Name", placeholder: "John" },
                { label: "Last Name", name: "Last Name", placeholder: "Doe" }].map(({ label, name, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm text-[#94A3B8] mb-1.5">{label}</label>
                  <input type="text" name={name} required placeholder={placeholder}
                    className="w-full rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
                    style={{ background: "#0B1929", border: "1px solid #1E3A5F" }} />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Phone Number</label>
              <input type="tel" name="Phone" required placeholder="(210) 000-0000"
                className="w-full rounded-lg px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                style={{ background: "#0B1929", border: "1px solid #1E3A5F" }} />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Email Address</label>
              <input type="email" name="Email" required placeholder="john@email.com"
                className="w-full rounded-lg px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                style={{ background: "#0B1929", border: "1px solid #1E3A5F" }} />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Current License Status</label>
              <select name="License" className="w-full rounded-lg px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                style={{ background: "#0B1929", border: "1px solid #1E3A5F" }}>
                <option>No license yet — I need guidance</option>
                <option>Life license — active</option>
                <option>Life & Health license — active</option>
                <option>In progress</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Sales or Insurance Experience</label>
              <select name="Experience" className="w-full rounded-lg px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                style={{ background: "#0B1929", border: "1px solid #1E3A5F" }}>
                <option>No experience — brand new</option>
                <option>Some sales experience</option>
                <option>Insurance experience</option>
                <option>Experienced agent looking for a better opportunity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">What are your income goals?</label>
              <textarea name="Goals" rows={4} placeholder="Tell Pio why you want to join and what you are looking to build..."
                className="w-full rounded-lg px-4 py-3 text-white text-sm focus:outline-none transition-colors resize-none"
                style={{ background: "#0B1929", border: "1px solid #1E3A5F" }} />
            </div>
            <button type="submit" className="btn-gold w-full py-4 rounded-xl text-base mt-2">
              Submit My Application
            </button>
            <p className="text-xs text-center text-[#94A3B8]">No spam. Pio will personally follow up within 24 hours.</p>
          </form>
        </div>
      </section>
    </main>
  );
}
