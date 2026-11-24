"use client";

import "./RetirementGraph.css";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const dollars = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const sampleReturns = [12, -18, 9, 22, -7, 6, 15, -12, 8, 19, 4, -21, 17, 11, -5, 14, 7, -10, 20, 5, 13, -16, 10, 18, -4, 6, 16, -9, 12, 3];

export default function RetirementGraph() {
  const [premium, setPremium] = useState(100000);
  const [years, setYears] = useState(20);
  const [cap, setCap] = useState(6);
  const [fixedRate, setFixedRate] = useState(4);
  const [compareIndex, setCompareIndex] = useState(true);
  const [compareFixed, setCompareFixed] = useState(true);
  const [showTable, setShowTable] = useState(false);
  let indexed = premium;
  let market = premium;
  let fixed = premium;
  const data = [{ year: 0, indexed, market, fixed, indexReturn: 0 }];
  for (let year = 1; year <= years; year += 1) {
    const indexReturn = sampleReturns[year - 1];
    indexed *= 1 + Math.min(cap, Math.max(0, indexReturn)) / 100;
    market *= 1 + indexReturn / 100;
    fixed *= 1 + fixedRate / 100;
    data.push({ year, indexed, market, fixed, indexReturn });
  }
  const final = data[data.length - 1];
  const controls = [
    { id: "premium", label: "Starting amount", value: premium, min: 10000, max: 1000000, step: 10000, display: dollars(premium), update: setPremium },
    { id: "years", label: "Time to grow", value: years, min: 1, max: 30, step: 1, display: String(years), update: setYears },
    { id: "cap", label: "Annuity model cap", value: cap, min: 1, max: 12, step: 0.5, display: cap.toFixed(1) + "%", update: setCap },
    { id: "fixed-rate", label: "Assumed fixed annual rate", value: fixedRate, min: 0, max: 8, step: 0.25, display: fixedRate.toFixed(2) + "%", update: setFixedRate },
  ];
  return (
    <section className="agency-section agency-wrap retirement-calculator" aria-labelledby="growth-heading">
      <h2 id="growth-heading">See what your retirement savings could become.</h2>
      <p className="agency-lead">Explore a potential future value with an illustrative fixed indexed annuity model. Adjust your starting amount and timeline, then choose comparisons to see the difference.</p>
      <p className="agency-small">Hypothetical education only. The index path is a made-up sequence of annual returns. These figures are not historical results, current rates, quotes, or forecasts.</p>
      <div className="retirement-workspace"><div className="retirement-controls"><h3>Your illustration</h3><div className="retirement-inputs">
        {controls.map(control => (
          <div key={control.id}>
            <label htmlFor={"retirement-" + control.id} className="flex justify-between gap-4 font-bold"><span>{control.label}</span><output>{control.display}</output></label>
            <input id={"retirement-" + control.id} className="w-full mt-3" style={{ accentColor: "#a9553b", minHeight: 32 }} type="range" min={control.min} max={control.max} step={control.step} value={control.value} onChange={event => control.update(Number(event.target.value))} />
          </div>
        ))}
      </div>
      <div className="retirement-comparisons"><p>Compare with</p><button type="button" aria-pressed={compareIndex} onClick={() => setCompareIndex(!compareIndex)}>Hypothetical index</button><button type="button" aria-pressed={compareFixed} onClick={() => setCompareFixed(!compareFixed)}>Fixed-rate growth</button></div><p className="agency-small">Drag a slider to update the projection. Hover or tap the graph to explore individual years.</p></div><div className="retirement-results"><div className="retirement-future" aria-live="polite" aria-atomic="true"><p>Illustrative annuity value in {years} years</p><strong>{dollars(final.indexed)}</strong><span>{dollars(final.indexed - premium)} in modeled growth · {((final.indexed / premium - 1) * 100).toFixed(1)}% total</span></div>
      <div className="retirement-result-cards" aria-live="polite" aria-atomic="true">
        {[["Starting amount", premium], ...(compareIndex ? [["Hypothetical index", final.market]] : []), ...(compareFixed ? [["Fixed-rate illustration", final.fixed]] : [])].map(([label, value]) => (
          <div className="agency-note" key={String(label)}><p>{label}</p><strong style={{fontSize:"1.6rem"}}>{dollars(Number(value))}</strong></div>
        ))}
      </div>
      <div role="img" aria-label={"Illustrative growth comparison over " + years + " years. Values are available in the data table below."} style={{width:"100%",height:360}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 15, bottom: 10, left: 10 }} accessibilityLayer>
            <CartesianGrid stroke="#dccdbb" strokeDasharray="3 3" />
            <XAxis dataKey="year" tickFormatter={value => "Yr " + value} minTickGap={25} />
            <YAxis width={70} tickFormatter={value => "$" + Math.round(value / 1000) + "k"} />
            <Tooltip labelFormatter={value => "Year " + value} formatter={value => dollars(Number(value))} />
            <Legend />
            <Line type="linear" dataKey="indexed" name="Annuity model" stroke="#485747" strokeWidth={3} dot={false} isAnimationActive={false} />
            {compareIndex && <Line type="linear" dataKey="market" name="Hypothetical index" stroke="#a9553b" strokeDasharray="6 4" strokeWidth={2} dot={false} isAnimationActive={false} />}
            {compareFixed && <Line type="linear" dataKey="fixed" name="Fixed-rate illustration" stroke="#92703e" strokeDasharray="2 4" strokeWidth={2} dot={false} isAnimationActive={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
      </div></div><button type="button" className="agency-text-link my-5" aria-expanded={showTable} aria-controls="retirement-growth-data" onClick={() => setShowTable(!showTable)}>{showTable ? "Hide" : "Show"} yearly values</button>
      {showTable && <div id="retirement-growth-data" className="overflow-x-auto"><table className="w-full text-left"><caption className="text-left mb-3">Hypothetical annual values, rounded to the nearest dollar</caption><thead><tr>{["Year", "Index change", "Capped model", "Index", "Fixed rate"].map(label => <th className="p-3" key={label} scope="col">{label}</th>)}</tr></thead><tbody>{data.map(row => <tr className="border-t" key={row.year}><th scope="row" className="p-3">{row.year}</th><td className="p-3">{row.year === 0 ? "—" : row.indexReturn + "%"}</td><td className="p-3">{dollars(row.indexed)}</td><td className="p-3">{dollars(row.market)}</td><td className="p-3">{dollars(row.fixed)}</td></tr>)}</tbody></table></div>}
      <aside className="agency-note"><strong>How this illustration is calculated</strong><p>Each year, the capped model credits the smaller of the selected cap and a positive sample index change, with zero credited interest for a negative year. The index line applies the full sample change. The fixed line compounds at the selected rate. All lines start with the same amount and assume no additions or withdrawals.</p><p>The model omits fees, rider charges, surrender charges, market value adjustments, taxes, inflation, and dividends. It assumes a constant cap and fixed rate for the entire period. Actual contracts can use different formulas, renewal rates, and terms. A zero-percent crediting floor does not prevent charges or withdrawals from reducing contract value. The capped line is not an insurer illustration or an available product. The fixed line is not a CD or Treasury quote. Guarantees depend on the issuing insurer and contract.</p></aside>
    </section>
  );
}
