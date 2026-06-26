// Message templates + date helpers for the Action Items outreach hub.

export type MsgCtx = {
  name: string          // recipient first name
  agent: string         // agent first name
  time?: string         // e.g. "7:00 PM"
  date?: string         // e.g. "Thursday, Jun 5"
  holiday?: string      // e.g. "Thanksgiving"
  product?: string      // e.g. "Whole Life"
  calendarLink?: string // agent's scheduling link
}

export type TemplateKey = 'appointment' | 'birthday' | 'holiday' | 'review' | 'save'

export const TEMPLATES: Record<TemplateKey, { label: string; build: (c: MsgCtx) => string }> = {
  appointment: {
    label: 'Scheduled Call Reminder',
    build: c =>
      `Hi ${c.name}, it's ${c.agent} — just a quick reminder about our scheduled call ${c.date ? `on ${c.date}` : 'today'}${c.time ? ` at ${c.time}` : ''}. Looking forward to connecting with you!` +
      (c.calendarLink ? `\n\nIf the timing no longer works, grab whatever's best here: ${c.calendarLink}` : ''),
  },
  birthday: {
    label: 'Birthday',
    build: c =>
      `Happy Birthday, ${c.name}! 🎉 Wishing you a wonderful year ahead. Thank you for trusting me with your coverage — I'm always here if you need anything. — ${c.agent}`,
  },
  holiday: {
    label: 'Holiday',
    build: c =>
      `Happy ${c.holiday || 'Holidays'}, ${c.name}! 🎊 Wishing you and your family a wonderful ${c.holiday || 'holiday season'}. Grateful to have you as a client. — ${c.agent}`,
  },
  review: {
    label: 'Annual Policy Review',
    build: c =>
      `Hi ${c.name}, it's been about a year since we set up your ${c.product || 'policy'} — I'd love to do a quick annual review to make sure your coverage still fits your needs. Do you have 10 minutes this week? — ${c.agent}` +
      (c.calendarLink ? `\n\nGrab a time here: ${c.calendarLink}` : ''),
  },
  save: {
    label: 'Save the Client',
    build: c =>
      `Hi ${c.name}, it's ${c.agent}. I just wanted to check in on your coverage and make sure everything's still in good standing for you and your family. ` +
      `Whenever you have a moment, give me a call or text back — I'm here to help. — ${c.agent}`,
  },
}

// Build an sms: deep link. iOS uses `&body=`, works on Android too.
export function smsLink(phone: string, body: string): string {
  const clean = phone.replace(/[^\d+]/g, '')
  return `sms:${clean}${clean ? '?' : ''}&body=${encodeURIComponent(body)}`
}

// Parse a free-text DOB (MM/DD/YYYY, YYYY-MM-DD, M/D/YY) → {month, day} (1-based month) or null
export function parseMonthDay(dob: string): { month: number; day: number } | null {
  if (!dob) return null
  let m: RegExpMatchArray | null
  if ((m = dob.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return { month: +m[2], day: +m[3] }
  if ((m = dob.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-]\d{2,4}/))) return { month: +m[1], day: +m[2] }
  return null
}

// Days until the next occurrence of month/day from today (0 = today)
export function daysUntil(month: number, day: number): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let next = new Date(now.getFullYear(), month - 1, day)
  if (next < today) next = new Date(now.getFullYear() + 1, month - 1, day)
  return Math.round((next.getTime() - today.getTime()) / 86400000)
}

// US holidays (fixed-date ones + key floating approximations for the current year)
export function upcomingHolidays(): { name: string; date: Date; days: number }[] {
  const y = new Date().getFullYear()
  const nthWeekday = (month: number, weekday: number, n: number) => {
    const d = new Date(y, month, 1)
    let count = 0
    while (true) { if (d.getDay() === weekday) { count++; if (count === n) break }; d.setDate(d.getDate() + 1) }
    return new Date(d)
  }
  const lastWeekday = (month: number, weekday: number) => {
    const d = new Date(y, month + 1, 0)
    while (d.getDay() !== weekday) d.setDate(d.getDate() - 1)
    return new Date(d)
  }
  const list = [
    { name: "New Year's Day", date: new Date(y, 0, 1) },
    { name: "Valentine's Day", date: new Date(y, 1, 14) },
    { name: 'Easter', date: new Date(y, 3, 20) }, // approx
    { name: "Mother's Day", date: nthWeekday(4, 0, 2) },
    { name: 'Memorial Day', date: lastWeekday(4, 1) },
    { name: "Father's Day", date: nthWeekday(5, 0, 3) },
    { name: 'Independence Day', date: new Date(y, 6, 4) },
    { name: 'Labor Day', date: nthWeekday(8, 1, 1) },
    { name: 'Halloween', date: new Date(y, 9, 31) },
    { name: 'Thanksgiving', date: nthWeekday(10, 4, 4) },
    { name: 'Christmas', date: new Date(y, 11, 25) },
  ]
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return list
    .map(h => {
      let d = h.date
      if (d < today) d = new Date(d.getFullYear() + 1, d.getMonth(), d.getDate())
      return { name: h.name, date: d, days: Math.round((d.getTime() - today.getTime()) / 86400000) }
    })
    .sort((a, b) => a.days - b.days)
}
