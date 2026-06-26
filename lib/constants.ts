export const CARRIERS = [
  'Banner', 'Corebridge', 'Mutual of Omaha', 'American Amicable', 'Foresters',
  'Americo', 'F&G', 'SBLI', 'Transamerica', 'Royal Neighbors', 'Gerber',
  'Occidental', 'NLG', 'UHL',
]

// Disposition definitions with consistent colors used everywhere.
// `books` => opens the appointment date/time picker (callback or appt)
export const DISPOSITIONS: { label: string; badge: string; btn: string; counts: 'dial' | 'appt' | 'show' | 'noshow' | 'sale' | 'none'; dead?: boolean; books?: boolean; appt?: boolean; both?: boolean; contact?: boolean }[] = [
  // Dialing outcomes — shown in "How did the call go?"
  { label: 'No answer',       badge: 'bg-violet-500 text-white',      btn: 'border-gray-600 text-gray-400 hover:bg-gray-800',     counts: 'dial' },
  { label: 'Left voicemail',  badge: 'bg-blue-500 text-white',        btn: 'border-blue-700 text-blue-400 hover:bg-blue-950',     counts: 'dial' },
  { label: 'Wrong number',    badge: 'bg-rose-500 text-white',        btn: 'border-red-700 text-red-400 hover:bg-red-950',        counts: 'dial', dead: true },
  { label: 'Not interested',  badge: 'bg-red-500 text-white',         btn: 'border-red-600 text-red-400 hover:bg-red-950',        counts: 'dial', dead: true, contact: true },
  { label: 'Wants callback',  badge: 'bg-purple-500 text-white',      btn: 'border-purple-600 text-purple-400 hover:bg-purple-950', counts: 'dial', books: true, contact: true },
  { label: 'Booked',          badge: 'bg-teal-500 text-white',        btn: 'border-teal-600 text-teal-400 hover:bg-teal-950',     counts: 'appt', books: true, contact: true },
  { label: 'Do not call',     badge: 'bg-red-700 text-white',         btn: 'border-red-800 text-red-600 hover:bg-red-950',        counts: 'dial', dead: true, contact: true },
  // "Sit" outcomes — work for BOTH a one-call sit (off a cold call) AND a booked
  // appointment. They show in both the call section and the appointment-outcome box.
  // The dial/appointment tally is auto-detected (see setDisposition): counted only
  // when there was no prior booked appointment. Always counts as a sit/show.
  { label: 'Sit - No Sale',   badge: 'bg-pink-600 text-white',        btn: 'border-pink-600 text-pink-400 hover:bg-pink-950',     counts: 'show', both: true, contact: true },
  { label: 'Sit - Follow Up', badge: 'bg-cyan-600 text-white',        btn: 'border-cyan-600 text-cyan-400 hover:bg-cyan-950',     counts: 'show', both: true, books: true, contact: true },
  // Appointment outcomes — shown in the "Appointment Outcome" box once booked
  { label: 'Appt Showed',     badge: 'bg-green-500 text-white',       btn: 'border-green-600 text-green-400 hover:bg-green-950',  counts: 'show', appt: true, contact: true },
  { label: 'Appt No Show',    badge: 'bg-orange-500 text-white',      btn: 'border-orange-600 text-orange-400 hover:bg-orange-950', counts: 'noshow', appt: true },
  { label: 'Appt Rescheduled',badge: 'bg-indigo-500 text-white',      btn: 'border-purple-600 text-purple-400 hover:bg-purple-950', counts: 'none', appt: true, contact: true },
  { label: 'Closed',          badge: 'bg-yellow-400 text-black',      btn: 'border-yellow-500 text-black bg-yellow-500 hover:bg-yellow-400 font-black', counts: 'sale', appt: true, contact: true },
]

// Dispositions that mean a live person was reached (used to count contacts)
export const CONTACT_DISPOSITIONS = DISPOSITIONS.filter(d => d.contact).map(d => d.label)

// Per-carrier application fee subtracted from the annual premium BEFORE commission
// is calculated (e.g. Banner charges $90). AP/production tracking is unaffected.
export const CARRIER_APP_FEE: Record<string, number> = { Banner: 90 }
export const appFeeFor = (carrier?: string) => CARRIER_APP_FEE[(carrier || '').trim()] || 0
// Commissionable premium = annual premium minus the carrier's app fee (never below 0)
export const commissionableAP = (apv: number, carrier?: string) => Math.max(0, (apv || 0) - appFeeFor(carrier))

export const CLIENT_STATUSES = ['Active', 'Pending', 'Lapsed']
export const CHARGEBACK_REASONS = ['NSF', 'Cancelled', 'Lapsed', 'Declined', 'Non-Payment', 'Other']

// Lead channel/vendor, grouped Digital (Facebook) vs Analog (mail/postcard).
// The freshness GRADE (A = new, B–H = bonus/aged) is a separate dimension below.
// Free-text custom values are allowed too — any value still gets a stable color.
export const LEAD_TYPE_GROUPS: { category: string; types: string[] }[] = [
  {
    category: 'Digital (Facebook)',
    types: ['Digital Lighthouse - MP', 'Digital Lighthouse - GL', 'Razor Ridge - MP', 'Razor Ridge - GL'],
  },
  {
    category: 'Analog (Mail / Postcard)',
    types: ['Mail-In', 'Call-In'],
  },
  { category: 'Other', types: ['Referral'] },
]
export const LEAD_TYPES = LEAD_TYPE_GROUPS.flatMap(g => g.types)

// Lead freshness grade. A = newest; if unsold for ~3 weeks it ages A→B→…→H.
// Anything B–H is a "bonus" lead.
export const LEAD_GRADES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
export const isBonusGrade = (g?: string) => !!g && g.toUpperCase() !== 'A'
export function gradeBadge(g?: string): string {
  if (!g) return ''
  return g.toUpperCase() === 'A' ? 'bg-green-600 text-white' : 'bg-amber-500 text-black'
}
const TYPE_PALETTE = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500',
  'bg-cyan-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500', 'bg-rose-500',
  'bg-lime-500', 'bg-sky-500', 'bg-fuchsia-500', 'bg-green-500',
]
// Stable color for any lead-type string (so custom vendors are consistent everywhere)
export function leadTypeColor(name: string): string {
  const n = (name || '').trim()
  if (!n) return 'bg-gray-500'
  let h = 0
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0
  return TYPE_PALETTE[h % TYPE_PALETTE.length]
}

export const DISP_BADGE: Record<string, string> = Object.fromEntries(
  [
    ['Not Called', 'bg-sky-500 text-white'],
    // Legacy labels (merged into Sit - No Sale / Sit - Follow Up) — keep their colors
    ['Sit No Sale', 'bg-amber-500 text-black'],
    ['Sit Follow Up', 'bg-cyan-600 text-white'],
    ...DISPOSITIONS.map(d => [d.label, d.badge]),
  ]
)

export const DISP_META: Record<string, typeof DISPOSITIONS[number]> = Object.fromEntries(
  DISPOSITIONS.map(d => [d.label, d])
)

// GHL-style pipeline stages (drag-and-drop buckets)
export const PIPELINE_STAGES = [
  'New', 'Dialed Once', 'Dialed Twice', 'Dialed 3x', 'Dialed 4x',
  'Follow Up', 'Appt Set', 'Appt No Show', 'Appt Showed',
  'Signed', 'Pending Approval', 'Active Client', 'Stale',
]

export const DIAL_MODES = [
  { value: 1, label: 'Single dial', desc: 'Each disposition moves the lead one bucket' },
  { value: 2, label: 'Double dial', desc: 'Two dispositions move the lead one bucket' },
  { value: 3, label: 'Triple dial', desc: 'Three dispositions move the lead one bucket' },
]

// dial_count → pipeline bucket. `mode` = dials per "round" (1 single, 2 double, 3 triple):
// the bucket only advances once a full round of dials is completed.
export function dialBucket(count: number, mode: number = 1): string {
  const m = mode >= 1 ? mode : 1
  const rounds = Math.floor(count / m)
  if (rounds >= 4) return 'Dialed 4x'
  if (rounds === 3) return 'Dialed 3x'
  if (rounds === 2) return 'Dialed Twice'
  if (rounds === 1) return 'Dialed Once'
  return 'New'
}
