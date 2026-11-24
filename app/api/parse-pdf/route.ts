import { requireAgent } from "@/lib/requireAgent";
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ParsedLead = {
  name: string; phone: string; email: string
  address: string; city: string; state: string; zip: string
  dob: string; age: number | null; gender: string; tobacco_use: string
  co_borrower: string; mortgage_balance: string; lender: string; source: string
}

const US_STATES = new Set('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' '))

const grab = (t: string, patterns: RegExp[]): string => {
  for (const p of patterns) { const m = t.match(p); if (m && m[1]) return m[1].trim() }
  return ''
}


const looksLikeName = (s: string) => !!s &&
  !/\d/.test(s) &&
  !/\b(St|Ave|Dr|Rd|Blvd|Ln|Way|Ct|Pl|Cir|Trail|Drive|Street|Road|Lane|Apt|Unit|Suite)\b/i.test(s) &&
  /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'.\- ]+[A-Za-zÀ-ÿ]$/.test(s.trim())



const validName = (s: string) => {
  const n = (s || '').trim()
  return !!n && !/\d/.test(n) && n.split(/\s+/).length <= 4 &&
    /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ''.\- ]{1,38}[A-Za-zÀ-ÿ.]$/.test(n)
}


function parseSFGCRM(t: string): ParsedLead | null {
  const g = (patterns: RegExp[]) => { for (const p of patterns) { const m = t.match(p); if (m?.[1]) return m[1].trim() } return '' }
  const first = g([/\n([A-Za-z'\-]+)\s*First Name:?/i])
  const last  = g([/\n([A-Za-z'\-]+)\s*Last Name:?/i])
  const name  = (first && last) ? `${first} ${last}` : ''

  const callerRaw  = g([/\n(\d{10})\s*Caller ID:?/i])
  const contactRaw = g([/\n([\d\-]+)\s*Contact Phone:?/i]).replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '')
  const pd = callerRaw || contactRaw
  const phone = pd.length === 10 ? `(${pd.slice(0,3)}) ${pd.slice(3,6)}-${pd.slice(6)}` : ''

  const address          = g([/\n([^\n]+?)\s*Property Address:?/i])
  const city             = g([/\n([A-Za-z][A-Za-z .'\-]*?)\s*City:?/i])
  const state            = g([/\n([A-Z]{2})\s*State:?/i])
  const zip              = g([/\n(\d{5})\s*Postal Code:?/i])
  const mortgage_balance = g([/\n(\$[\d,]+(?:\.\d{2})?)\s*Mortgage Amount:?/i])
  const lender           = g([/\n([A-Za-z][^\n]+?)\s*Lender Name:?/i])

  const ageStr = g([/(\d{2,3})\n[^\n]*\nAge:?/i])
  const age = ageStr ? parseInt(ageStr) : null

  const gRaw     = g([/gender\??:?\s*(Male|Female)/i])
  const gender   = gRaw ? (gRaw.toLowerCase() === 'male' ? 'Male' : 'Female') : ''
  const tobMatch = t.match(/tobacco[^\n]*?:\s*(Yes|No|Y|N)/i)
  const tobacco_use = tobMatch ? (/^y/i.test(tobMatch[1]) ? 'Yes' : 'No') : 'Unknown'
  const cobMatch = t.match(/co.?borrower[^\n]*?:\s*(Yes|No|Y|N)/i)
  const co_borrower = cobMatch ? (/^y/i.test(cobMatch[1]) ? 'Yes' : 'No') : 'Unknown'

  if (!name && !phone) return null
  return { name: name || 'Unknown', phone, email: '', address, city, state, zip, dob: '', age, gender, tobacco_use, co_borrower, mortgage_balance, lender, source: 'Call In' }
}

function parsePage(t: string): ParsedLead | null {
  if (t.trim().length < 80) return null

  if (/CUSTOMER REQUEST|Caller ID:|Contact Phone:/i.test(t)) return parseSFGCRM(t)

  const first = grab(t, [/First Name[:\s]+([A-Za-zÀ-ÿ'\-]+)/i])
  const last = grab(t, [/Last Name[:\s]+([A-Za-zÀ-ÿ'\-]+)/i])
  let name = (first && last) ? `${first} ${last}`.trim() : ''
  if (!validName(name)) {


    name = grab(t, [
      /Client Name[:\s]+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'\-]+(?:\s+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'\-]+){1,2}?)\s+(?:Gender|Protection|Client Age)/i,
      /\bName:[^\S\n]*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ''.\- ]+?)[^\S\n]*(?:\n|Age\b)/i,
      /Dear\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ''.\- ]+?),/,
    ])
    if (!validName(name)) name = ''
  }


  let blkStreet = ''
  if (!name) {
    const re = /([A-Z][A-Za-zÀ-ÿ''.\-]+(?:[ \t]+(?:[A-Z]\.?[ \t])?[A-Z][A-Za-zÀ-ÿ''.\-]+){1,3})[ \t]*\n[ \t]*(\d{1,6}[A-Za-z]?[ \t]+[A-Za-z][^\n]{2,40})/g
    for (const mm of t.matchAll(re)) {
      if (validName(mm[1])) { name = mm[1].trim(); blkStreet = mm[2].trim(); break }
    }
  }

  let phone = grab(t, [
    /Caller ID[:\s]+(\d{10})\b/i,
    /(?:Contact Phone|Primary Phone|Phone Number)[:\s]+([\d\-().\s]{7,16})/i,
    /(\(\d{3}\)[-.\s]?\d{3}[-.\s]?\d{4})/,
    /\bPhone:\s*(\d{10})\b/i,
  ]).trim()

  const phoneDigits = phone.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '')
  if (phoneDigits.length === 10) phone = `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`

  const email = grab(t, [/(?:Email Address|Email)[:\s]+([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i])
  let address = grab(t, [/(?:Property Address|Street Address)[:\s]+(.+?)\s+(?:Primary Phone|Caller ID|City)/i])
  let city = grab(t, [/\bCity[:\s]+([A-Za-z][A-Za-z .'\-]*?)\s*(?:\n|Age|County|State)/i])
  let state = grab(t, [/\bState[:\s]+([A-Z]{2})\b/i]).toUpperCase()

  if (!US_STATES.has(state)) state = ''
  let zip = grab(t, [/(?:Postal Code|Zip Code)[:\s]+(\d{5})/i])

  if (!city || !zip || !address) {
    const m = t.match(/(\d+\s+[A-Za-z][^,\n]+?),\s*([A-Za-z][A-Za-z .'\-]+?),\s*([A-Z]{2})\s+(\d{5})/)
    if (m) { address = address || m[1]; city = city || m[2]; state = state || m[3]; zip = zip || m[4] }
  }

  if (!city || !state || !zip) {
    const m = t.match(/\n\s*([A-Za-z][A-Za-z .'\-]+?),\s*([A-Z]{2})\s+(\d{5})(?:-\d{4})?\b/)
    if (m) { city = city || m[1].trim(); state = state || m[2]; zip = zip || m[3] }
  }
  if (!address && blkStreet) address = blkStreet
  const ageStr = grab(t, [/(?:Client Age|\bAge):?\s*(\d{2,3})\b/i])
  const age = ageStr ? parseInt(ageStr) : null
  const mortgage_balance = grab(t, [/Mortgage Amount[:\s]+(\$[\d,.]+)/i, /Pays\s+(\$[\d,]+)\s+directly/i])
  let lender = grab(t, [
    /Lender Name[:\s]+([A-Za-z].+?)(?:\n|Home Purchase|Purchase Amount|$)/i,
    /Lender:\s*([A-Za-z][^\n$]{2,60})/i,
  ])
  if (name && lender.includes(name)) lender = lender.slice(0, lender.indexOf(name)).trim()  // mail-in: cut the client name off
  if (/purchase amount|home purchase|current income|mortgage id/i.test(lender)) lender = ''

  const gRaw = grab(t, [/gender\s*\??:?\s*(Male|Female|M|F)\b/i])
  const gender = gRaw ? (gRaw.toLowerCase().startsWith('m') ? 'Male' : 'Female') : ''

  const tobMatch = t.match(/tobacco[^\n]*?[:\s]\s*(Yes|No|Y|N|True|False)\b/i)
  const tobacco_use = tobMatch ? (/^(y|t)/i.test(tobMatch[1]) ? 'Yes' : 'No') : 'Unknown'
  const coMatch = t.match(/co.?borrower[^\n]*?:\s*(Yes|No|Y|N)\b/i)
  const co_borrower = coMatch ? (/^y/i.test(coMatch[1]) ? 'Yes' : 'No') : 'Unknown'

  if (!name && !phone) return null

  let source = 'Digital Lead'
  if (/postcard|direct mail|in the mail|mailer/i.test(t)) source = 'Mail In'
  else if (/call.?in|called the (phone )?number|inbound call/i.test(t)) source = 'Call In'
  else if (/online|internet|web ?form|facebook|social media|digital/i.test(t)) source = 'Digital Lead'

  return {
    name: name || 'Unknown',
    phone, email, address, city, state, zip, dob: '',
    age: isNaN(age as number) ? null : age,
    gender, tobacco_use, co_borrower, mortgage_balance, lender, source,
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAgent(req);
  if (denied) return denied;
  try {
    let pages: string[] = []
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('application/json')) {


      const body = await req.json()
      pages = Array.isArray(body?.pages) ? body.pages.map((p: any) => String(p || '')) : []
      if (pages.length > 500 || pages.reduce((total, page) => total + page.length, 0) > 2000000) return NextResponse.json({ error: 'Text is too large.' }, { status: 413 })
      if (pages.length === 0) return NextResponse.json({ error: 'No page text provided' }, { status: 400 })
    } else {
      const formData = await req.formData()
      const file = formData.get('file') as File
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'PDF is too large.' }, { status: 413 })
      if (!file.name?.toLowerCase().endsWith('.pdf')) return NextResponse.json({ error: 'Please choose a PDF file.' }, { status: 400 })
      const buffer = Buffer.from(await file.arrayBuffer())
      if (!buffer.subarray(0, 1024).includes(Buffer.from('%PDF-'))) return NextResponse.json({ error: 'Invalid PDF file.' }, { status: 400 })
      const { extractText, getDocumentProxy } = await import('unpdf')
      const pdf = await getDocumentProxy(new Uint8Array(buffer))
      const r = await extractText(pdf, { mergePages: false })
      pages = Array.isArray(r.text) ? r.text : [r.text]
    }

    const leads: ParsedLead[] = []
    for (const page of pages) {
      const lead = parsePage(page.replace(/\r/g, '\n'))
      if (lead) leads.push(lead)
    }

    if (leads.length === 0) {
      return NextResponse.json({ error: 'No leads found in this PDF. Make sure it is a lead form.' }, { status: 422 })
    }
    return NextResponse.json({ leads, count: leads.length })
  } catch (err: any) {
    return NextResponse.json({ error: 'The document could not be processed. Try another PDF or enter the details manually.' }, { status: 422 })
  }
}
