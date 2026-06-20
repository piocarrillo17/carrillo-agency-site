import Link from "next/link";

export default function Join() {
  return (
    <main style={{ background: "#fff", color: "#0B1929" }}>

      {/* HERO — dark navy with photo, like Pinnacle */}
      <section className="relative flex items-center overflow-hidden" style={{ minHeight: "70vh" }}>
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1920&q=80"
            alt="Team working"
            className="w-full h-full object-cover object-center"
            style={{ filter: "brightness(0.2)" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(11,25,41,0.98) 0%, rgba(11,25,41,0.85) 100%)" }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-28 w-full text-center">
          <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: "#C9A84C" }}>
            Join The Carrillo Agency
          </p>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-white mb-6">
            Build Your Business.<br />
            <span style={{ color: "#C9A84C" }}>Write Your Future.</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            We are building a team of driven individuals who want to earn real income on their own terms — from anywhere in the country.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#apply"
              className="px-10 py-4 rounded-lg font-bold text-black text-lg transition-all hover:opacity-90"
              style={{ background: "#C9A84C" }}>
              Apply Now — It&apos;s Free
            </a>
            <a href="tel:2108705200"
              className="px-10 py-4 rounded-lg font-semibold text-lg border-2 border-white text-white hover:bg-white hover:text-[#0B1929] transition-all">
              Talk to Pio First
            </a>
          </div>
        </div>
      </section>

      {/* STATS — gold bar like Pinnacle's metrics */}
      <section style={{ background: "#0B1929" }}>
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "$170K+", label: "Avg Full-Time Agent Income" },
            { value: "10+", label: "Carrier Contracts" },
            { value: "100%", label: "Remote Friendly" },
            { value: "Leads", label: "Provided to Every Agent" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-4xl font-extrabold mb-1" style={{ color: "#C9A84C" }}>{value}</p>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MISSION STATEMENT */}
      <section className="py-24 px-6 text-center" style={{ background: "#F8FAFC" }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: "#C9A84C" }}>Our Philosophy</p>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6" style={{ color: "#0B1929" }}>
            We Don&apos;t Hire Agents.<br />We Build Leaders.
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "#475569" }}>
            The Carrillo Agency is not just handing you a contract. We invest in your growth with real training, real mentorship, and a proven system — because when you win, we all win.
          </p>
        </div>
      </section>

      {/* WHAT YOU GET — Pinnacle-style card grid on white */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: "#C9A84C" }}>The Opportunity</p>
            <h2 className="text-4xl font-extrabold mb-4" style={{ color: "#0B1929" }}>
              Everything You Need to Succeed
            </h2>
            <p className="max-w-xl mx-auto text-lg" style={{ color: "#64748B" }}>
              We provide the tools, training, leads, and support. You bring the drive.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "💰",
                title: "Aggressive Compensation",
                desc: "Top-tier commission levels from day one. Full-time agents average over $170,000 per year.",
                highlight: true,
              },
              {
                icon: "📋",
                title: "Leads Provided",
                desc: "We give you leads so you can focus on what matters — helping families and closing business.",
                highlight: false,
              },
              {
                icon: "📱",
                title: "Work From Anywhere",
                desc: "All you need is a laptop and a phone. Work from home, a coffee shop, or anywhere in the U.S.",
                highlight: false,
              },
              {
                icon: "🎓",
                title: "Training & Mentorship",
                desc: "Bootcamps, weekly webinars, 1-on-1 coaching with Pio, and a proven sales system.",
                highlight: false,
              },
              {
                icon: "📈",
                title: "3 Types of Income",
                desc: "Personal production, team overrides, and agency ownership — build multiple income streams.",
                highlight: false,
              },
              {
                icon: "🏢",
                title: "10+ Carrier Contracts",
                desc: "Write business across life insurance, final expense, mortgage protection, and more.",
                highlight: false,
              },
            ].map(({ icon, title, desc, highlight }) => (
              <div
                key={title}
                className="rounded-2xl p-8 transition-all hover:-translate-y-1"
                style={{
                  background: highlight ? "#0B1929" : "#F8FAFC",
                  border: highlight ? "2px solid #C9A84C" : "1px solid #E2E8F0",
                  boxShadow: highlight ? "0 8px 32px rgba(201,168,76,0.15)" : "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div className="text-4xl mb-5">{icon}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color: highlight ? "#fff" : "#0B1929" }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: highlight ? "#94A3B8" : "#64748B" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO WE'RE LOOKING FOR */}
      <section className="py-24 px-6" style={{ background: "#F8FAFC" }}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="relative rounded-2xl overflow-hidden shadow-xl" style={{ minHeight: "460px" }}>
            <img
              src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=900&q=80"
              alt="Young professional working"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 50%, rgba(11,25,41,0.85) 100%)" }} />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="text-white text-2xl font-extrabold">Your future starts here.</p>
              <p className="text-gray-300 text-sm mt-1">San Antonio, TX · Nationwide</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold tracking-widest uppercase mb-4" style={{ color: "#C9A84C" }}>
              Ideal Candidate
            </p>
            <h2 className="text-4xl font-extrabold mb-6" style={{ color: "#0B1929" }}>
              You Don&apos;t Need Experience.<br />You Need Drive.
            </h2>
            <p className="text-lg mb-8 leading-relaxed" style={{ color: "#475569" }}>
              We welcome people who are brand new to insurance and those with a sales background. If you are coachable and hungry to build something real, we want to talk.
            </p>
            <div className="flex flex-col gap-4">
              {[
                "Self-motivated with clear income goals",
                "Comfortable talking to and helping people",
                "Willing to obtain a life license (we guide you)",
                "Life & health license is a plus",
                "Some sales experience preferred but not required",
                "Ready to build income — not just earn a paycheck",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="text-lg font-bold mt-0.5" style={{ color: "#C9A84C" }}>✓</span>
                  <p className="font-medium" style={{ color: "#1E293B" }}>{item}</p>
                </div>
              ))}
            </div>
            <a href="#apply"
              className="inline-block mt-10 px-10 py-4 rounded-lg font-bold text-black text-base transition-all hover:opacity-90"
              style={{ background: "#C9A84C" }}>
              Apply Now
            </a>
          </div>
        </div>
      </section>

      {/* APPLY FORM */}
      <section id="apply" className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: "#C9A84C" }}>
              Get Started Today
            </p>
            <h2 className="text-4xl font-extrabold mb-4" style={{ color: "#0B1929" }}>
              Apply to Join the Team
            </h2>
            <p style={{ color: "#64748B" }}>
              Fill out the form below and Pio will personally reach out within 24 hours.
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
              {[{ label: "First Name", name: "First Name", placeholder: "John" },
                { label: "Last Name", name: "Last Name", placeholder: "Doe" }].map(({ label, name, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>{label}</label>
                  <input type="text" name={name} required placeholder={placeholder}
                    className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors"
                    style={{ background: "#fff", border: "1px solid #D1D5DB", color: "#0B1929" }} />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Phone Number</label>
              <input type="tel" name="Phone" required placeholder="(210) 000-0000"
                className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors"
                style={{ background: "#fff", border: "1px solid #D1D5DB", color: "#0B1929" }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Email Address</label>
              <input type="email" name="Email" required placeholder="john@email.com"
                className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors"
                style={{ background: "#fff", border: "1px solid #D1D5DB", color: "#0B1929" }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>License Status</label>
              <select name="License"
                className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none"
                style={{ background: "#fff", border: "1px solid #D1D5DB", color: "#0B1929" }}>
                <option>No license yet — I need guidance</option>
                <option>Life license — active</option>
                <option>Life & Health license — active</option>
                <option>In progress</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Sales or Insurance Experience</label>
              <select name="Experience"
                className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none"
                style={{ background: "#fff", border: "1px solid #D1D5DB", color: "#0B1929" }}>
                <option>No experience — brand new</option>
                <option>Some sales experience</option>
                <option>Insurance experience</option>
                <option>Experienced agent looking for a better opportunity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>What are your income goals?</label>
              <textarea name="Goals" rows={4}
                placeholder="Tell Pio why you want to join and what you are looking to build..."
                className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none resize-none"
                style={{ background: "#fff", border: "1px solid #D1D5DB", color: "#0B1929" }} />
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
