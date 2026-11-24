import Link from "next/link";
export const metadata = { title: "Final Expense Life Insurance | The Carrillo Agency" };
export default function FinalExpense() {
  return <main id="main-content" className="agency-learn agency-section agency-wrap" style={{lineHeight:1.8}}>
    <h1>A little support<br/>for the people you leave behind.</h1>
    <p className="agency-lead">Final expense life insurance can help beneficiaries manage funeral costs and other final bills after a covered claim.</p>
    <h2>Choose a benefit around your wishes</h2>
    <p>Final expense coverage commonly uses a smaller whole life policy. Available amounts, issue ages, and premiums depend on the insurer and your circumstances. Obtain local cost estimates and consider existing savings and coverage when choosing an amount.</p>
    <h2>Review when benefits begin</h2>
    <p>Simplified-issue policies can still ask health questions. A medical exam may not be required, but approval can depend on your answers. Some policies have graded or limited death benefits in the early years. Ask what your beneficiary would receive in each policy year.</p>
    <h2>Make the premium sustainable</h2>
    <p>Review the full premium commitment, exclusions, cash values, and conditions for maintaining coverage. Beneficiaries generally choose how to use policy proceeds, unless benefits are assigned. A life policy differs from a prepaid funeral agreement.</p>
    <p className="agency-small">Benefits depend on policy provisions, eligibility, underwriting, and state availability. Review costs, exclusions, and any benefit waiting period. <Link href="/legal" className="underline">Read insurance disclosures</Link>.</p>
    <div className="agency-actions"><Link href="/learn#final-expense" className="agency-text-link">Read the full guide →</Link><Link href="/quote" className="agency-button">Discuss final expense coverage →</Link></div>
  </main>;
}
