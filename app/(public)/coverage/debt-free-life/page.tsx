import Link from "next/link";
export const metadata = { title: "Whole Life & Debt Repayment | The Carrillo Agency" };
export default function DebtRepayment() {
  return <main id="main-content" className="agency-learn agency-section agency-wrap" style={{lineHeight:1.8}}>
    <h1>Whole life and<br/>your debt repayment plan.</h1>
    <p className="agency-lead">Explore costs, cash flow, and loan obligations before deciding whether a participating whole life strategy fits your needs.</p>
    <h2>Begin with your household budget</h2>
    <p>Compare the interest rates and balances on your debts, available savings, and the premiums required to maintain a policy. Consider direct repayment approaches such as a debt avalanche or snowball alongside any insurance strategy.</p>
    <h2>Understand policy borrowing</h2>
    <p>Once sufficient cash value is available, the insurer may lend against it under the policy’s terms. Paying a creditor with that loan creates a new loan obligation. Interest is paid to the insurer. Early cash value can be limited, and a new policy may take years to provide useful borrowing capacity.</p>
    <h2>Check the long-term commitment</h2>
    <p>Participating dividends are not guaranteed. Premium requirements, loan interest, surrender values, and the effect on death benefits matter. Outstanding loans can contribute to lapse and possible taxes. No payoff date or savings amount is guaranteed.</p>
    <p className="agency-small">Benefits depend on policy provisions, eligibility, underwriting, and state availability. Review costs, exclusions, and any benefit waiting period. <Link href="/legal" className="underline">Read insurance disclosures</Link>.</p>
    <div className="agency-actions"><Link href="/learn#whole-life-debt" className="agency-text-link">Read the full guide →</Link><Link href="/quote" className="agency-button">Discuss your goals →</Link></div>
  </main>;
}
