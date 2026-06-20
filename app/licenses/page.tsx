export default function Licenses() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      {/* Header */}
      <div className="text-center mb-16">
        <p className="text-[#C9A84C] text-sm font-semibold tracking-widest uppercase mb-3">
          Credentials & Licensing
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          Licensed. <span className="text-[#C9A84C]">Verified. Professional.</span>
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          I hold active insurance licenses in compliance with all state and federal
          regulations. Your coverage is in qualified hands.
        </p>
      </div>

      {/* NPN Card */}
      <div className="bg-[#1A1A1A] border border-[#C9A84C] rounded-2xl p-8 mb-10 text-center">
        <p className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase mb-2">
          National Producer Number
        </p>
        <p className="text-5xl font-extrabold tracking-widest text-white mb-4">
          — NPN —
        </p>
        <p className="text-gray-400 text-sm">
          Verify my license at{" "}
          <a
            href="https://nipr.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C9A84C] underline hover:text-[#E8C97A]"
          >
            nipr.com
          </a>
        </p>
      </div>

      {/* License Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {[
          { type: "Health Insurance", status: "Active", lines: "Individual & Family, ACA Marketplace" },
          { type: "Life Insurance", status: "Active", lines: "Term Life, Whole Life, Final Expense" },
          { type: "Medicare", status: "Active", lines: "Medicare Advantage, Supplement, Part D" },
          { type: "Annuities", status: "Active", lines: "Fixed Annuities" },
        ].map(({ type, status, lines }) => (
          <div key={type} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 hover:border-[#C9A84C] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">{type}</h3>
              <span className="text-xs font-semibold bg-green-900/50 text-green-400 border border-green-700 px-2 py-0.5 rounded-full">
                {status}
              </span>
            </div>
            <p className="text-gray-400 text-sm">{lines}</p>
          </div>
        ))}
      </div>

      {/* States */}
      <div className="bg-[#111] border border-[#2A2A2A] rounded-2xl p-8 mb-16">
        <h2 className="text-xl font-bold mb-6 text-center">
          Licensed States
        </h2>
        <div className="flex flex-wrap gap-3 justify-center">
          {["TX", "CA", "FL", "GA", "AZ", "NV", "CO", "IL", "OH", "NC"].map((state) => (
            <span
              key={state}
              className="px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-sm font-semibold text-gray-300 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
            >
              {state}
            </span>
          ))}
        </div>
        <p className="text-gray-500 text-xs text-center mt-4">
          * Update this list with your actual licensed states
        </p>
      </div>

      {/* Compliance Note */}
      <div className="text-center">
        <p className="text-gray-500 text-sm mb-2">
          All licenses are maintained in good standing and renewed per state requirements.
        </p>
        <p className="text-gray-500 text-sm">
          Questions? Contact me at{" "}
          <a href="mailto:piocarrillo17@gmail.com" className="text-[#C9A84C] hover:underline">
            piocarrillo17@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
}
