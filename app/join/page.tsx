export default function Join() {
  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1000] via-[#0A0A0A] to-[#0A0A0A] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-[#C9A84C] text-sm font-semibold tracking-widest uppercase mb-4">
            Join the Carrillo Agency
          </p>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Build Your Business.<br />
            <span className="text-[#C9A84C]">Write Your Future.</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            We are looking for driven, motivated individuals who want to build a real
            income on their own terms — from anywhere.
          </p>
          <a
            href="#apply"
            className="px-10 py-4 bg-[#C9A84C] text-black font-bold text-lg rounded hover:bg-[#E8C97A] transition-colors"
          >
            Apply to Join
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#111] border-y border-[#2A2A2A] py-14 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "15+", label: "Carrier Contracts" },
            { value: "100%", label: "Remote Friendly" },
            { value: "3", label: "Income Streams" },
            { value: "∞", label: "Earning Potential" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-4xl font-extrabold text-[#C9A84C] mb-1">{value}</p>
              <p className="text-gray-400 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What We Offer */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">
          What You <span className="text-[#C9A84C]">Get With Us</span>
        </h2>
        <p className="text-gray-400 text-center max-w-xl mx-auto mb-14">
          We are not just handing you a contract. We are building a team of agency
          owners who win together.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: "💰",
              title: "Aggressive Compensation",
              desc: "Top-tier commission levels from day one. No waiting to prove yourself.",
            },
            {
              icon: "📱",
              title: "Work From Anywhere",
              desc: "Laptop and phone are all you need. Work from home, a coffee shop, or anywhere.",
            },
            {
              icon: "🎓",
              title: "Full Training & Mentorship",
              desc: "We train you on products, scripts, and strategy. You are never left to figure it out alone.",
            },
            {
              icon: "📈",
              title: "3 Types of Income",
              desc: "Personal production, team overrides, and agency ownership — build multiple income streams.",
            },
            {
              icon: "🏢",
              title: "15+ Carrier Access",
              desc: "Write business with the best carriers in health, life, Medicare, and more.",
            },
            {
              icon: "🚀",
              title: "Real Growth Path",
              desc: "Start as an agent, build your team, and become an agency owner. The path is clear.",
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

      {/* Who We're Looking For */}
      <section className="bg-[#111] border-y border-[#2A2A2A] py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Who We&apos;re <span className="text-[#C9A84C]">Looking For</span>
          </h2>
          <p className="text-gray-400 mb-12">
            You do not need experience. You need drive.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            {[
              "Self-motivated and goal-oriented",
              "Comfortable talking to people",
              "Willing to get licensed (we help with this)",
              "Looking to build something, not just collect a paycheck",
              "Coachable and open to learning",
              "Hungry for financial freedom",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="text-[#C9A84C] font-bold text-lg mt-0.5">✓</span>
                <p className="text-gray-300 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply Form */}
      <section id="apply" className="max-w-2xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">
          Ready to <span className="text-[#C9A84C]">Join the Team?</span>
        </h2>
        <p className="text-gray-400 text-center mb-10">
          Fill out the form below and I will personally reach out within 24 hours.
        </p>
        <form
          action="mailto:piocarrillo17@gmail.com"
          method="GET"
          encType="text/plain"
          className="flex flex-col gap-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-gray-400 mb-1">First Name</label>
              <input
                type="text"
                name="First Name"
                required
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#C9A84C] focus:outline-none transition-colors"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Last Name</label>
              <input
                type="text"
                name="Last Name"
                required
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#C9A84C] focus:outline-none transition-colors"
                placeholder="Doe"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
            <input
              type="tel"
              name="Phone"
              required
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#C9A84C] focus:outline-none transition-colors"
              placeholder="(555) 000-0000"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email Address</label>
            <input
              type="email"
              name="Email"
              required
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#C9A84C] focus:outline-none transition-colors"
              placeholder="john@email.com"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Are you currently licensed?</label>
            <select
              name="Licensed"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#C9A84C] focus:outline-none transition-colors"
            >
              <option value="No">No — I need to get licensed</option>
              <option value="Yes">Yes — I have an active license</option>
              <option value="In Progress">In progress</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tell me about yourself</label>
            <textarea
              name="Message"
              rows={4}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#C9A84C] focus:outline-none transition-colors resize-none"
              placeholder="What drives you? What are your income goals? Any sales or customer service experience?"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-[#C9A84C] text-black font-bold text-lg rounded hover:bg-[#E8C97A] transition-colors"
          >
            Submit Application
          </button>
        </form>
      </section>
    </main>
  );
}
