import { requireAgent } from "@/lib/requireAgent";
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function grab(text: string, patterns: RegExp[]): string {
  for (const p of patterns) { const m = text.match(p); if (m && m[1]) return m[1].trim() }
  return ''
}
const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
const num = (s: string) => s ? Number(s.replace(/[,$]/g, '')) : 0
const splitCaps = (s: string) => {            // "JoseCardenas" -> "Jose Cardenas"
  const m = s.match(/^([A-Z][a-z]+)([A-Z].+)$/)
  return m ? `${m[1]} ${m[2]}` : s
}

type Result = {
  insured_name: string; owner_name: string; dob: string; address: string
  phone: string; email: string; death_benefit: number; premium: number
  carrier: string; product_type: string
  beneficiaries: { name: string; relationship: string; percent: string; phone: string; dob: string; type: string }[]
}
const empty = (): Result => ({
  insured_name: '', owner_name: '', dob: '', address: '', phone: '', email: '',
  death_benefit: 0, premium: 0, carrier: '', product_type: '', beneficiaries: [],
})

function detectCarrier(t: string): string {
  const map: [RegExp, string][] = [
    [/american[- ]?amicable|amicable life/i, 'American Amicable'],
    [/foresters|independent order/i, 'Foresters'],
    [/corebridge|american general|simplinow|\bAGL\b/i, 'Corebridge'],
    [/transamerica/i, 'Transamerica'],
    [/united home life|\bUHL\b/i, 'UHL'],
    [/mutual of omaha|united of omaha|\bomaha\b/i, 'Mutual of Omaha'],
    [/americo/i, 'Americo'],
    [/banner life|legal & general/i, 'Banner'],
    [/gerber life/i, 'Gerber'],
    [/royal neighbors/i, 'Royal Neighbors'],
    [/f&g|fidelity (&|and) guaranty/i, 'F&G'],
    [/\bsbli\b/i, 'SBLI'],
    [/occidental/i, 'Occidental'],
    [/national life group|\bNLG\b/i, 'NLG'],
  ]
  for (const [re, name] of map) if (re.test(t)) return name
  return ''
}

const PRODUCT_RE = /\b(Whole Life|Term Life|Final Expense|Universal Life|Mortgage Protection|Indexed Universal Life|Guaranteed Universal Life)\b/i



function parseAmAm(t: string): Partial<Result> {




  const r: Partial<Result> = {}

  const nmM = t.match(/INTERVIEW NOT REQ([A-Z][a-z]+(?:[A-Z][a-z]*)*)X/)
  if (nmM) r.insured_name = nmM[1].replace(/([A-Z])/g, ' $1').trim()

  const phones = [...t.matchAll(/\((\d{3})\)\s*(\d{3}-\d{4})/g)]
  const clientPhone = phones.find(m => m[1] !== '254' && m[1] !== '800')
  r.phone = clientPhone ? `(${clientPhone[1]}) ${clientPhone[2]}` : ''

  const addrBlk = t.match(/\)\s*\d{3}-\d{4}([A-Z][a-z]+)(\d{3,6}\s+[A-Za-z][A-Za-z0-9 .,'#\-]+?)([A-Z]{2})(\d{5})/)
  if (addrBlk) r.address = `${addrBlk[2].trim()}, ${addrBlk[1]}, ${addrBlk[3]} ${addrBlk[4]}`

  r.email = grab(t, [/\d{5}(?:-\d{4})?([a-zA-Z][a-zA-Z0-9._%+\-]*@[a-zA-Z0-9.\-]+\.(?:com|net|org|edu))/])

  r.dob = grab(t, [/(\d{2}\/\d{2}\/\d{4})\d{2}[A-Z]{2}/, /\b(\d{2}\/\d{2}\/\d{4})\b/])

  r.death_benefit = num(grab(t, [
    /(?:Daughter|Son|Child|Spouse|Other|Trust|Estate|Mother|Father)X(\d{4,7})X/,
    /\$\s*([\d,]{4,})\s+M\d{6}/,
  ]))

  r.premium = num(grab(t, [/Bank\s+MON([\d]+\.\d{2})/, /\bMON([\d]+\.\d{2})/]))

  r.product_type = grab(t, [/\b(Home Certainty\s*(?:\d+|\([^)]+\)))/i, PRODUCT_RE]) || 'Mortgage Protection'

  if (!r.insured_name) {
    const esignedM = t.match(/([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?[A-Z][a-z]+)\s*\(e[-.]?sign/)
    if (esignedM) r.insured_name = esignedM[1].replace(/\s+/g, ' ').trim()
  }

  const REL = 'Spouse|Wife|Husband|Son|Daughter|Child|Parent|Mother|Father|Brother|Sister|Grandchild|Partner|Trust|Estate|Other|Friend'
  const benRe = new RegExp(`([A-Z][a-z]+\\s+[A-Z][a-z]+)\\s+(\\d{2}\\/\\d{2}\\/\\d{4})[\\s\\S]{0,60}?(${REL})`, 'gi')
  const bens: { name: string; relationship: string; percent: string; phone: string; dob: string; type: string }[] = []
  let bm: RegExpExecArray | null
  const benSection = t.match(/Primary\s+Name\s+DOB[\s\S]{0,2000}/i)?.[0] || ''
  while ((bm = benRe.exec(benSection)) !== null) {
    const type = bens.length === 0 ? 'Primary' : 'Contingent'
    bens.push({ name: bm[1], relationship: bm[3], percent: bens.length === 0 ? '100' : '0', phone: '', dob: bm[2], type })
  }
  if (bens.length) r.beneficiaries = bens

  return r
}

function parseForesters(t: string): Partial<Result> {
  const r: Partial<Result> = {}

  const nm = t.match(/([A-Z][a-z]+)([A-Z][a-z'\-]+)X\d{2,6}\s+[A-Z]/)
  if (nm) r.insured_name = `${nm[1]} ${nm[2]}`

  r.phone = grab(t, [/\d{3}-\d{2}-\d{4}\s*(\(\d{3}\)\s?\d{3}-\d{4})/, /(\(\d{3}\)\s?\d{3}-\d{4})/])

  let em = grab(t, [/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(?:com|net|org|edu|gov|us))/i])
  em = em.replace(/^[A-Z0-9.]+(?=[a-z])/, '')   // drop leading "000.00XX77" style junk
  if (em && /^[a-z]/i.test(em)) r.email = em

  const MON = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec'
  const M3 = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  const toDate = (mon: string, d: string, y: string) => {
    const mo = M3.indexOf(mon.slice(0, 3).toLowerCase()) + 1
    return mo ? `${String(mo).padStart(2, '0')}/${d.padStart(2, '0')}/${y}` : ''
  }

  const dm = t.match(new RegExp(`\\)\\s?\\d{3}-\\d{4}(${MON})[a-z]*\\s+(\\d{1,2}),\\s*(\\d{4})`, 'i'))
    || t.match(new RegExp(`\\b(${MON})[a-z]*\\s+(\\d{1,2}),\\s*(\\d{4})`, 'i'))
  if (dm) r.dob = toDate(dm[1], dm[2], dm[3])


  const addr = t.match(/X(\d{2,6}\s+[A-Za-z0-9 .,'#\-]+?)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)([A-Z]{2})(\d{5})\d{3}-\d{2}-\d{4}/)
  if (addr) r.address = `${addr[1].trim().replace(/\s+/g, ' ')}, ${addr[2]}, ${addr[3]} ${addr[4]}`

  r.premium = num(grab(t, [/monthly premium quoted[\s\S]{0,90}?Application\.?\s*X*([\d,]+\.\d{2})/i]))

  const REL = 'Child|Grandchild|Spouse|Wife|Husband|Son|Daughter|Mother|Father|Brother|Sister|Parent|Sibling|Friend|Partner|Niece|Nephew|Cousin|Aunt|Uncle|Other|Trust|Estate'
  const benRe = new RegExp(`([A-Z][A-Za-z'’.\\-]+(?:\\s+[A-Z][A-Za-z'’.\\-]+)*?)\\s*(${MON})[a-z]*\\s+(\\d{1,2}),\\s*(\\d{4})(${REL})X(\\d{1,3})`, 'g')
  const bens: { name: string; relationship: string; percent: string; phone: string; dob: string; type: string }[] = []
  let mb: RegExpExecArray | null
  while ((mb = benRe.exec(t)) !== null) {
    const bname = mb[1].replace(/^(?:Share|Name|Type|Primary|Contingent|Revocable|Irrevocable)\s*/i, '').trim().replace(/\s+/g, ' ')
    if (bname) bens.push({ name: bname, relationship: mb[5], percent: mb[6], phone: '', dob: toDate(mb[2], mb[3], mb[4]), type: 'Primary' })
  }

  let cum = 0
  bens.forEach(b => { b.type = cum < 100 ? 'Primary' : 'Contingent'; cum += Number(b.percent) || 0 })
  if (bens.length) r.beneficiaries = bens


  const sched = grab(t, [/Face Amount:\s*\$?\s*([\d,]+\.\d{2})/i])
  if (sched) r.death_benefit = num(sched)
  else {
    const fa = grab(t, [/([\d,]{4,7})[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-/])
    if (fa) r.death_benefit = num(fa)
  }

  const m = t.match(/Zip:\s*_+\s*([A-Z][a-z]+)([A-Z][a-zA-Z'\-]+)([\d,]{4,})X/)
  if (m) { if (!r.insured_name) r.insured_name = `${m[1]} ${m[2]}`; if (!r.death_benefit) r.death_benefit = num(m[3]) }
  r.product_type = grab(t, [/\b(Term Life|Whole Life)\b/i])
  return r
}

function parseTransamerica(t: string): Partial<Result> {
  const r: Partial<Result> = {}

  const m = t.match(/Date([A-Z][a-z]+(?: [A-Z])? [A-Z][a-z]+)([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.\w+)(\d{3}-\d{3}-\d{4})/)
  if (m) { r.insured_name = m[1].trim(); r.email = m[2]; r.phone = m[3] }
  r.dob = grab(t, [/\b(\d{2}\/\d{2}\/\d{4})XXX/])
  r.product_type = grab(t, [/\b(Whole Life|Term Life|Final Expense|Universal Life)\b\s+Insurance Application/i, PRODUCT_RE])
  return r
}

function parseCorebridge(t: string): Partial<Result> {
  const r: Partial<Result> = {}

  const blk = t.match(/(\d{2}\/\d{2}\/\d{4})([A-Z][a-z]+)\d{3}-\d{2}-\d{4}(\(\d{3}\)\s*\d{3}-\d{4})([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+?\.(?:com|net|org|edu))(.+?)([A-Z]{2})(\d{5})(?:-\d{4})?/)
  let first = ''
  if (blk) {
    r.dob = blk[1]; first = blk[2]; r.phone = blk[3]; r.email = blk[4]

    const cityM = blk[5].match(/^(.+?)([A-Z][a-z]+(?: [A-Z][a-z]+)?)$/)
    const street = cityM ? cityM[1] : blk[5]
    const city = cityM ? cityM[2] : ''
    r.address = `${street}, ${city}, ${blk[6]} ${blk[7]}`.replace(/,\s*,/g, ',')
  }
  const last = grab(t, [/(?:Yes|No)([A-Z][a-z]+)\s+ICC/])
  if (first || last) r.insured_name = `${first} ${last}`.trim()

  const prod = t.match(/PRODUCT INFORMATION\s*(\d+\.\d{2})(\d{3,7})((?:Whole|Term|Universal|Final)[A-Za-z ]*Life|SimpliNow[A-Za-z ]*)/i)
  if (prod) { r.premium = num(prod[1]); r.death_benefit = num(prod[2]); r.product_type = prod[3].trim() }
  if (!r.product_type) r.product_type = grab(t, [/\b(SimpliNow [A-Za-z ]+?)(?:Female|Male)/, PRODUCT_RE])
  return r
}

function parseUHL(t: string): Partial<Result> {
  const r: Partial<Result> = {}

  const blk = t.match(/Zip Code([A-Z][a-z']+)([A-Z][a-z']+)[A-Z]?(\d{2}\/\d{2}\/\d{4})/)
  if (blk) { r.insured_name = `${blk[2]} ${blk[1]}`; r.dob = blk[3] }   // First Last, DOB

  if (!r.insured_name) r.insured_name = grab(t, [
    /\.(?:com|net|org)([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z'\-]+)\s+\d{3}-\d{3}/,
    /([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z'\-]+)\s+200-854/,
  ])

  const ea = t.match(/(?:\d+)?([a-z][\w.\-]*@[\w.\-]+\.(?:com|net|org))(\d+\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*?\s+(?:Ave|St|Dr|Rd|Blvd|Ln|Way|Ct|Cir|Trl|Drive|Street|Avenue|Road|Lane|Boulevard))/)
  if (ea) {
    r.email = ea[1]
    let addr = ea[2].trim()

    const csz = t.match(/\d{3}-\d{2}-\d{4}([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)([A-Z][a-z]+)(\d{5})/)
    if (csz) addr = `${addr}, ${csz[1]}, ${US_STATE[csz[2]] || csz[2]} ${csz[3]}`
    r.address = addr
  } else {
    r.email = ''   // no client email found — don't fall back to the agent's
  }

  r.phone = grab(t, [/Cell#?:?\s*(\(\d{3}\)\s*\d{3}-\d{4})/])
  r.product_type = grab(t, [PRODUCT_RE]) || 'Whole Life'
  return r
}

const US_STATE: Record<string, string> = {
  Texas: 'TX', California: 'CA', Florida: 'FL', NewYork: 'NY', Arizona: 'AZ', Nevada: 'NV',
  Georgia: 'GA', Colorado: 'CO', Tennessee: 'TN', Oklahoma: 'OK', Louisiana: 'LA', Alabama: 'AL',
  Mississippi: 'MS', Arkansas: 'AR', Missouri: 'MO', Kansas: 'KS', Indiana: 'IN', Ohio: 'OH',
  Illinois: 'IL', Michigan: 'MI', Virginia: 'VA', Carolina: 'NC', Washington: 'WA', Oregon: 'OR',
}

function parseMOO(t: string): Partial<Result> {

  const r: Partial<Result> = {}

  const m = t.match(/([A-Z][a-z]+ [A-Z][a-z]+)\s+(\d{2})\s+(Male|Female)/)
  if (m) r.insured_name = m[1]
  r.product_type = grab(t, [PRODUCT_RE])
  return r
}

function digitsToDate(raw: string): string {
  const d = (raw || '').replace(/\D/g, '')
  let mm = '', dd = '', yyyy = ''
  if (d.length === 8) { mm = d.slice(0, 2); dd = d.slice(2, 4); yyyy = d.slice(4, 8) }
  else if (d.length === 7) {
    yyyy = d.slice(-4); const head = d.slice(0, 3)
    if (Number(head.slice(0, 2)) <= 12) { mm = head.slice(0, 2); dd = '0' + head.slice(2) }
    else { mm = '0' + head.slice(0, 1); dd = head.slice(1, 3) }
  } else if (d.length === 6) { mm = '0' + d.slice(0, 1); dd = '0' + d.slice(1, 2); yyyy = d.slice(2, 6) }
  else return ''
  return `${mm}/${dd}/${yyyy}`
}

function parseBanner(t: string): Partial<Result> {
  const r: Partial<Result> = {}

  const m = t.match(/([A-Z][a-z]+)([A-Z])?([A-Z][a-z]+)(\d{7,8})\d{9}([a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,})(\d{1,6}\s+[A-Za-z][A-Za-z0-9 .,'#\-]+?)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)([A-Z]{2})(\d{5})(\d{10})/)
  if (m) {
    r.insured_name = [m[1], m[2], m[3]].filter(Boolean).join(' ')
    r.dob = digitsToDate(m[4])
    r.email = m[5]
    r.address = `${m[6].trim().replace(/\s+/g, ' ')}, ${m[7]}, ${m[8]} ${m[9]}`
    const ph = m[10]; r.phone = `(${ph.slice(0, 3)}) ${ph.slice(3, 6)}-${ph.slice(6)}`
  }


  const fb = t.match(/Zip([\d,]{5,9})(.+?)([A-Z][a-z]+)([A-Z][a-z]+)(Spouse|Wife|Husband|Child|Son|Daughter|Parent|Mother|Father|Brother|Sister|Grandchild|Sibling|Partner|Trust|Estate|Other|Friend)(\d{1,3})(\d{6,8})/)
  if (fb) {
    r.death_benefit = num(fb[1])
    if (!r.product_type && /term/i.test(fb[2])) r.product_type = 'Term Life'
    r.beneficiaries = [{ name: `${fb[3]} ${fb[4]}`, relationship: fb[5], percent: fb[6], phone: '', dob: digitsToDate(fb[7]), type: 'Primary' }]
  }
  if (!r.product_type) r.product_type = grab(t, [PRODUCT_RE]) || 'Term Life'
  return r
}

function parseGeneric(t: string): Partial<Result> {
  const r: Partial<Result> = {}
  r.insured_name = grab(t, [
    /(?:proposed insured|insured name|primary insured)[:\s]+(?!(?:been|has|have|is|was|any|all|ever)\b)([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)/i,
    /(?:applicant)[:\s]+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)/i,
  ])
  r.phone = grab(t, [/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]\d{4})/])
  r.dob = grab(t, [/(?:date of birth|dob|birth ?date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i])
  r.email = grab(t, [/([A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.(?:com|net|org|edu))/i])
  r.death_benefit = num(grab(t, [/(?:face amount|death benefit|coverage amount|amount of (?:life )?insurance(?: applied for)?(?:[^$\d\n]{0,40}))\$?\s*([\d,]{4,})/i]))
  r.premium = num(grab(t, [/(?:monthly|modal|planned|total)?\s*premium[^$\d\n]{0,30}\$?\s*([\d,]+\.\d{2})/i]))
  r.product_type = grab(t, [PRODUCT_RE])
  return r
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import('unpdf')
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const r = await extractText(pdf, { mergePages: true })
  return Array.isArray(r.text) ? r.text.join('\n') : r.text
}


function extractEmbeddedHtmlText(buffer: Buffer): string {
  const raw = buffer.toString('latin1')
  const start = raw.indexOf('<html')
  if (start === -1) return ''
  const end = raw.lastIndexOf('</html>') + 7
  const html = raw.slice(start, end > start + 100 ? end : start + 60000)
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export async function POST(req: NextRequest) {
  const denied = await requireAgent(req);
  if (denied) return denied;
  try {
    let rawText: string
    let embeddedHtml = ''
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('application/json')) {

      const body = await req.json()
      rawText = String(body?.text || '')
      if (rawText.length > 2000000) return NextResponse.json({ error: 'Text is too large.' }, { status: 413 })
    } else {
      const formData = await req.formData()
      const file = formData.get('file') as File
      if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
      if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'PDF is too large.' }, { status: 413 })
      if (!file.name?.toLowerCase().endsWith('.pdf')) return NextResponse.json({ error: 'Please choose a PDF file.' }, { status: 400 })
      const buffer = Buffer.from(await file.arrayBuffer())
      if (!buffer.subarray(0, 1024).includes(Buffer.from('%PDF-'))) return NextResponse.json({ error: 'Invalid PDF file.' }, { status: 400 })
      rawText = await extractPdfText(buffer)
      embeddedHtml = extractEmbeddedHtmlText(buffer)
    }

    const joined = rawText.replace(/([a-zA-Z0-9._%+\-])\n+(@[a-zA-Z0-9.\-]+\.(?:com|net|org|edu))/g, '$1$2')
    const t = joined.replace(/\r/g, '\n') + (embeddedHtml ? '\n' + embeddedHtml : '')

    if (t.replace(/\s/g, '').length < 40) {
      return NextResponse.json({
        error: 'This PDF appears to be a scanned image with no readable text. Please enter the application details manually.',
      }, { status: 422 })
    }

    const carrier = detectCarrier(t)
    const extractors: Record<string, (t: string) => Partial<Result>> = {
      'American Amicable': parseAmAm,
      'Foresters': parseForesters,
      'Transamerica': parseTransamerica,
      'Corebridge': parseCorebridge,
      'UHL': parseUHL,
      'Mutual of Omaha': parseMOO,
      'Banner': parseBanner,
    }

    const specific = extractors[carrier] ? extractors[carrier](t) : {}
    const generic = parseGeneric(t)
    const out = empty()
    out.carrier = carrier
    for (const k of Object.keys(out) as (keyof Result)[]) {
      if (k === 'carrier') continue
      const sv = (specific as any)[k]
      const gv = (generic as any)[k]
      if (k === 'beneficiaries') { out.beneficiaries = (sv && sv.length ? sv : gv) || []; continue }
      if (k === 'death_benefit' || k === 'premium') { (out as any)[k] = sv || gv || 0; continue }
      ;(out as any)[k] = (sv || gv || '').toString().trim()
    }

    if (carrier === 'UHL') out.email = (specific as any).email ?? out.email

    out.insured_name = out.insured_name ? splitCaps(out.insured_name) : ''
    out.owner_name = out.owner_name || out.insured_name
    out.product_type = out.product_type ? titleCase(out.product_type) : ''

    return NextResponse.json(out)
  } catch (err: any) {
    return NextResponse.json({ error: 'The document could not be processed. Try another PDF or enter the details manually.' }, { status: 422 })
  }
}
