import Link from "next/link";
export default function ContactNotice({ recruiting = false }: { recruiting?: boolean }) {
  return <fieldset className="space-y-4 text-sm" style={{lineHeight:1.7}}>
    <legend className="font-bold">How may we respond?</legend>
    <label className="block" htmlFor={recruiting ? "join-contact-method" : "quote-contact-method"}>Preferred contact method</label>
    <select id={recruiting ? "join-contact-method" : "quote-contact-method"} name="Preferred contact method" defaultValue="Email" className="w-full rounded-lg p-3" style={{background:"#fffaf3",color:"#343f34",border:"1px solid #b5a593"}}>
      <option>Email</option><option>Phone call</option>
    </select>
    <p>By submitting, you ask Pio Carrillo at The Carrillo Agency to respond about {recruiting ? "your interest in the independent agent opportunity" : "your insurance inquiry"} using your selected contact method.</p>
    <label className="flex items-start gap-3"><input type="checkbox" name="Optional text permission" value="I agree to receive person-to-person texts from Pio Carrillo at The Carrillo Agency about this request. Consent is optional and not a condition of purchase. I may reply STOP or contact the agency to opt out." className="mt-1" /><span>Optional — I also agree to receive person-to-person text messages from Pio Carrillo at The Carrillo Agency about this request. Consent is not a condition of purchase. Message frequency varies. Message and data rates may apply. Reply STOP or contact us to opt out, or HELP for assistance.</span></label>
    <input type="hidden" name="Contact notice version" value="2026-11-24" />
    <p>Read our <Link href="/privacy" className="underline">Privacy Notice</Link> and <Link href="/legal" className="underline">Disclosures &amp; Website Terms</Link>. Please omit medical records, Social Security numbers, account numbers, and payment information. Form submissions are processed by Web3Forms and delivered by email.</p>
  </fieldset>;
}
