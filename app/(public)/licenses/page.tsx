import Link from "next/link";
export const metadata = { title: "Verify Licensing | The Carrillo Agency" };
export default function Licenses() {
  return <main id="main-content" className="agency-learn agency-section agency-wrap" style={{lineHeight:1.8}}>
    <h1>Verify your<br/>insurance professional.</h1>
    <p className="agency-lead">Contact Pio Carrillo to confirm current licensing and product availability for your state before discussing an application.</p>
    <h2>Check an official record</h2>
    <p>State insurance departments maintain licensing records. Authority, expiration dates, and carrier appointments can change. A national producer number identifies a producer and does not establish licensing in every state.</p>
    <p><a href="https://www.tdi.texas.gov/agent/agent-lookup.html" className="agency-text-link">Use the Texas Department of Insurance lookup ↗</a></p>
    <p><a href="https://content.naic.org/state-insurance-departments" className="agency-text-link">Find another state insurance department ↗</a></p>
    <Link href="/quote" className="agency-button">Ask about availability in your state →</Link>
  </main>;
}
