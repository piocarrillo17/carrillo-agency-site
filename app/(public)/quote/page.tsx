export default function QuotePage() {
  return (
    <main className="min-h-screen py-24 px-6" style={{ background: "#0B1929" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#C9A84C] text-sm font-semibold tracking-widest uppercase mb-3">
            No Pressure. No Obligation.
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Get Your <span style={{ color: "#C9A84C" }}>Free Quote</span>
          </h1>
          <p className="text-[#94A3B8] text-lg max-w-md mx-auto">
            Fill out the form below and Pio will reach out within 24 hours with personalized coverage options.
          </p>
        </div>

        <form
          action="mailto:piocarrillosfg@gmail.com"
          method="GET"
          encType="text/plain"
          className="flex flex-col gap-5 rounded-2xl p-8"
          style={{ background: "#112240", border: "1.5px solid rgba(201,168,76,0.2)", boxShadow: "0 4px 32px rgba(0,0,0,0.3)" }}
        >
          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: "First Name", name: "First Name", placeholder: "John", type: "text" },
              { label: "Last Name", name: "Last Name", placeholder: "Doe", type: "text" },
            ].map(({ label, name, placeholder, type }) => (
              <div key={name}>
                <label className="block font-bold mb-1.5 text-white" style={{ fontSize: "0.8rem" }}>{label} *</label>
                <input
                  type={type}
                  name={name}
                  required
                  placeholder={placeholder}
                  className="w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2"
                  style={{ background: "#0B1929", border: "1.5px solid rgba(201,168,76,0.3)", color: "#fff", fontSize: "0.9rem", fontFamily: "inherit" }}
                />
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-bold mb-1.5 text-white" style={{ fontSize: "0.8rem" }}>Email Address *</label>
              <input
                type="email"
                name="Email"
                required
                placeholder="john@email.com"
                className="w-full rounded-lg px-4 py-3 focus:outline-none"
                style={{ background: "#0B1929", border: "1.5px solid rgba(201,168,76,0.3)", color: "#fff", fontSize: "0.9rem", fontFamily: "inherit" }}
              />
            </div>
            <div>
              <label className="block font-bold mb-1.5 text-white" style={{ fontSize: "0.8rem" }}>Phone Number *</label>
              <input
                type="tel"
                name="Phone"
                required
                placeholder="(555) 000-0000"
                className="w-full rounded-lg px-4 py-3 focus:outline-none"
                style={{ background: "#0B1929", border: "1.5px solid rgba(201,168,76,0.3)", color: "#fff", fontSize: "0.9rem", fontFamily: "inherit" }}
              />
            </div>
          </div>

          {/* Coverage */}
          <div>
            <label className="block font-bold mb-1.5 text-white" style={{ fontSize: "0.8rem" }}>Desired Coverage *</label>
            <select
              name="Desired Coverage"
              required
              className="w-full rounded-lg px-4 py-3 focus:outline-none"
              style={{ background: "#0B1929", border: "1.5px solid rgba(201,168,76,0.3)", color: "#fff", fontSize: "0.9rem", fontFamily: "inherit" }}
            >
              <option value="">Select a coverage type…</option>
              <option>Mortgage Protection</option>
              <option>Term Life Insurance</option>
              <option>Whole Life Insurance</option>
              <option>Final Expense</option>
              <option>Indexed Universal Life (IUL)</option>
              <option>Debt-Free Life</option>
              <option>Annuity / Retirement Income</option>
              <option>Not sure — I need guidance</option>
            </select>
          </div>

          {/* Date of Birth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-bold mb-1.5 text-white" style={{ fontSize: "0.8rem" }}>Date of Birth</label>
              <input
                type="date"
                name="Date of Birth"
                className="w-full rounded-lg px-4 py-3 focus:outline-none"
                style={{ background: "#0B1929", border: "1.5px solid rgba(201,168,76,0.3)", color: "#fff", fontSize: "0.9rem", fontFamily: "inherit" }}
              />
            </div>
            <div>
              <label className="block font-bold mb-1.5 text-white" style={{ fontSize: "0.8rem" }}>State of Residence</label>
              <input
                type="text"
                name="State"
                placeholder="e.g. Texas"
                className="w-full rounded-lg px-4 py-3 focus:outline-none"
                style={{ background: "#0B1929", border: "1.5px solid rgba(201,168,76,0.3)", color: "#fff", fontSize: "0.9rem", fontFamily: "inherit" }}
              />
            </div>
          </div>

          {/* Health */}
          <div>
            <label className="block font-bold mb-1.5 text-white" style={{ fontSize: "0.8rem" }}>General Health Status</label>
            <select
              name="Health Status"
              className="w-full rounded-lg px-4 py-3 focus:outline-none"
              style={{ background: "#0B1929", border: "1.5px solid rgba(201,168,76,0.3)", color: "#fff", fontSize: "0.9rem", fontFamily: "inherit" }}
            >
              <option value="">Prefer not to say</option>
              <option>Excellent — no major conditions</option>
              <option>Good — minor conditions</option>
              <option>Fair — managing a health condition</option>
              <option>Poor — multiple conditions</option>
            </select>
          </div>

          {/* Coverage Amount */}
          <div>
            <label className="block font-bold mb-1.5 text-white" style={{ fontSize: "0.8rem" }}>Estimated Coverage Amount Needed</label>
            <select
              name="Coverage Amount"
              className="w-full rounded-lg px-4 py-3 focus:outline-none"
              style={{ background: "#0B1929", border: "1.5px solid rgba(201,168,76,0.3)", color: "#fff", fontSize: "0.9rem", fontFamily: "inherit" }}
            >
              <option value="">Not sure yet</option>
              <option>Under $50,000</option>
              <option>$50,000 – $100,000</option>
              <option>$100,000 – $250,000</option>
              <option>$250,000 – $500,000</option>
              <option>$500,000 – $1,000,000</option>
              <option>$1,000,000+</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block font-bold mb-1.5 text-white" style={{ fontSize: "0.8rem" }}>Anything else we should know?</label>
            <textarea
              name="Message"
              rows={3}
              placeholder="Tell us about your family situation, any questions, or specific coverage goals…"
              className="w-full rounded-lg px-4 py-3 focus:outline-none resize-none"
              style={{ background: "#0B1929", border: "1.5px solid rgba(201,168,76,0.3)", color: "#fff", fontSize: "0.9rem", fontFamily: "inherit" }}
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-xl font-extrabold text-black mt-2 transition-all hover:opacity-90"
            style={{ background: "#C9A84C", fontSize: "1rem", letterSpacing: "0.05em" }}
          >
            GET MY FREE QUOTE
          </button>
          <p className="text-center text-[#64748B]" style={{ fontSize: "0.75rem" }}>
            No spam. No pressure. Pio will personally reach out within 24 hours.
          </p>
        </form>
      </div>
    </main>
  );
}
