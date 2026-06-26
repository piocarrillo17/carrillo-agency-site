// Build an "Add to Google Calendar" link (no OAuth needed — opens Google Calendar
// with the event pre-filled; the agent taps Save). Works for appointments AND callbacks.
export function googleCalLink(opts: {
  title: string
  start: string          // datetime-local string or ISO
  durationMins?: number
  details?: string
  guestEmail?: string    // adds the client as a guest on the event
}): string {
  const s = new Date(opts.start)
  if (isNaN(s.getTime())) return ''
  const e = new Date(s.getTime() + (opts.durationMins ?? 60) * 60000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.title,
    dates: `${fmt(s)}/${fmt(e)}`,
    details: opts.details || '',
  })
  if (opts.guestEmail && /\S+@\S+\.\S+/.test(opts.guestEmail)) params.set('add', opts.guestEmail)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
