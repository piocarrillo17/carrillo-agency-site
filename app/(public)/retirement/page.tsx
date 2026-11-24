import RetirementGraph from "@/components/RetirementGraph";
import type { Metadata } from "next";
import Link from "next/link";
import CoveragePhoto from "@/components/CoveragePhoto";

export const metadata: Metadata = {
  title: "Retirement & Annuities | The Carrillo Agency",
  description: "Explore fixed and fixed indexed annuities, retirement income choices, withdrawal rules, and questions to discuss with Pio Carrillo.",
};

const topics = [
  { title: "Income you can plan around", text: "Start with essential monthly expenses, Social Security, pensions, and savings. An annuity may help fill an income gap through payments defined by your contract." },
  { title: "Fixed annuities", text: "Earn interest under the insurer’s stated terms, including a contractual minimum. Review how long a rate is guaranteed and what happens at renewal." },
  { title: "Fixed indexed annuities", text: "Interest credits follow a formula linked to an index. Your premium is not invested directly in that index. Caps, participation rates, spreads, and crediting periods affect what you earn." },
  { title: "Access to your money", text: "Plan for emergencies outside a long-term contract. Review surrender charges, withdrawal allowances, possible market value adjustments, and rider fees before committing." },
];
const questions = [
  ["What is an annuity?", "An insurance contract that can accumulate money or provide payments. Income can begin soon or at a later date, depending on the contract and options you select."],
  ["Can an annuity provide lifetime income?", "Some contracts offer lifetime payment options or optional income riders. Payments depend on the contract, starting age, payout election, and other terms. Riders may carry charges, and an income benefit base can differ from the cash available to withdraw."],
  ["Can a fixed indexed annuity lose value?", "A fixed indexed annuity may have a zero-percent floor on index-linked interest for a crediting period. That floor applies to the interest calculation. Withdrawals, surrender charges, rider charges, and other contract adjustments can reduce the amount available. Ask to see guaranteed surrender values."],
  ["Can I use money from an old 401(k) or IRA?", "A rollover may be possible, depending on your plan and account. Review existing benefits, costs, withdrawal needs, and tax treatment before moving funds. Coordinate any transfer with your plan administrator and qualified tax professional."],
  ["How much money do I need?", "Minimum premiums vary by insurer and product. We will discuss your available funds, income goals, time horizon, and the money you need to keep accessible."],
  ["What should I bring to a retirement conversation?", "Bring your expected retirement date, a monthly expense estimate, Social Security or pension estimates, and recent retirement account statements. We will use those details to discuss whether an annuity deserves further consideration."],
];

export default function RetirementPage() {
  return (
    <main className="agency-learn" id="main-content">
      <header className="agency-learn-hero agency-wrap">
        <p className="agency-eyebrow">RETIREMENT & ANNUITIES</p>
        <h1>Prepare for the years<br />you’ve <em>worked toward.</em></h1>
        <p className="agency-lead">Explore how annuities could support your retirement income, with clear explanations of the benefits, costs, and commitments.</p>
        <div className="agency-actions"><Link href="/quote" className="agency-button">Talk retirement with Pio →</Link><a href="#retirement-faq" className="agency-text-link">Read common questions ↓</a></div>
      </header>
      <RetirementGraph />
      <section className="agency-wrap agency-guide">
        <div><h2>Start with your life<br />after work.</h2><CoveragePhoto topic="retirement" /></div>
        <div><p className="agency-lead">Your retirement plan starts with how you want to live and what your income needs to cover.</p><p>Consider your current resources, your comfort with risk, and how long your savings may need to last. We can discuss insurance options in the context of those goals and explain the specific terms before you make a decision.</p><aside className="agency-note"><strong>A contract worth understanding</strong><p>Annuities are long-term insurance contracts. Guarantees depend on the issuing insurer’s claims-paying ability and the contract terms.</p></aside></div>
      </section>
      <section className="agency-section agency-wrap" aria-labelledby="retirement-options">
        <h2 id="retirement-options">Understand the choices.</h2>
        <div className="agency-cards">{topics.map(topic => <article className="agency-card" key={topic.title}><h3>{topic.title}</h3><p>{topic.text}</p></article>)}</div>
      </section>
      <section className="agency-section agency-wrap" id="retirement-faq" aria-labelledby="retirement-faq-title">
        <h2 id="retirement-faq-title">Retirement questions, answered.</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 items-start">{questions.map(([question, answer]) => <details key={question} className="border-t py-6" style={{borderColor:"#cbbba8"}}><summary className="cursor-pointer font-bold">{question}</summary><p className="mt-4" style={{lineHeight:1.8}}>{answer}</p></details>)}</div>
        <aside className="agency-note"><strong>Before making a decision</strong><p>Early withdrawals may involve surrender charges, taxes, and a possible additional federal tax. An annuity held inside an IRA adds no extra tax deferral. Review liquidity, fees, beneficiary provisions, and any benefits you would give up by replacing an existing contract.</p></aside>
        <p className="agency-small">General education. Product availability depends on state, licensing, insurer, and eligibility. This page does not provide a personalized investment or tax recommendation. Review your specific contract and consult qualified professionals about your circumstances.</p>
        <a href="https://tdi.texas.gov/pubs/consumer/cb078.html" className="agency-text-link" target="_blank" rel="noopener noreferrer">Read the Texas Department of Insurance annuities guide ↗</a>
      </section>
      <section className="agency-cta"><div className="agency-wrap"><h2>Bring your goals.<br />Let’s explore your options.</h2><p>Schedule a complimentary conversation about retirement income and annuities.</p><Link href="/quote" className="agency-button">Request a retirement consultation →</Link></div></section>
    </main>
  );
}
