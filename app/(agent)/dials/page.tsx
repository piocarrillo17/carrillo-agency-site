'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import { Phone, UserCheck, Calendar, Trophy, Minus, Plus } from 'lucide-react'
import { localDate } from '@/lib/date'

type Profile = { id: string; name: string }
type Activity = { dials: number; contacts: number; appts: number; sales: number }
type Period = 'day' | 'week' | 'month'

const ZERO: Activity = { dials: 0, contacts: 0, appts: 0, sales: 0 }
const today = () => localDate()
const iso = (d: Date) => localDate(d)

// Work week runs Saturday → Friday. Returns the Saturday that starts the current week.
function weekStartSat(d = new Date()): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  s.setDate(s.getDate() - ((s.getDay() + 1) % 7)) // Sat=6 → 0 back, Sun=0 → 1 back … Fri=5 → 6 back
  return s
}

const METRICS = [
  { key: 'dials' as const, label: 'Dials', icon: Phone, color: 'text-blue-400' },
  { key: 'contacts' as const, label: 'Contacts', icon: UserCheck, color: 'text-teal-400' },
  { key: 'appts' as const, label: 'Appointments', icon: Calendar, color: 'text-yellow-400' },
  { key: 'sales' as const, label: 'Sales', icon: Trophy, color: 'text-green-400' },
]

export default function DialTrackerPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [byDate, setByDate] = useState<Record<string, Activity>>({})
  const [period, setPeriod] = useState<Period>('week')
  const [saving, setSaving] = useState(false)
  const [logDate, setLogDate] = useState(today())
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week, -1 = last week, etc.
  const [monthOffset, setMonthOffset] = useState(0)
  const [callQueue, setCallQueue] = useState<{ id: string; name: string; phone: string; disposition: string }[]>([])
  const [dialLeads, setDialLeads] = useState<{ disposition: string; updated_at: string }[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      let { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!p) {
        const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Agent'
        await supabase.from('profiles').insert({ id: session.user.id, name, email: session.user.email, role: 'agent' })
        const { data: p2 } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        p = p2
      }
      setProfile(p)

      // Pull 90 days of history so past weeks and months are always available
      const rangeStart = new Date(); rangeStart.setDate(rangeStart.getDate() - 90)
      const { data: rows } = await supabase.from('daily_activity').select('date,dials,contacts,appts,sales')
        .eq('agent_id', session.user.id).gte('date', iso(rangeStart))
      const map: Record<string, Activity> = {}
      ;(rows || []).forEach(r => { map[r.date] = { dials: r.dials || 0, contacts: r.contacts || 0, appts: r.appts || 0, sales: r.sales || 0 } })
      setByDate(map)

      // Call queue (leads ≤ 1 month old that still need a dial) + history for the time tip
      const oneMonthAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
      const [{ data: queue }, { data: dl }] = await Promise.all([
        supabase.from('leads').select('id,name,phone,disposition').eq('agent_id', session.user.id).eq('is_dead', false).gte('created_at', oneMonthAgo).in('disposition', ['Not Called', 'Wants callback', 'No answer', 'Left voicemail']).order('updated_at').limit(50),
        supabase.from('leads').select('disposition,updated_at').eq('agent_id', session.user.id),
      ])
      setCallQueue(queue || [])
      setDialLeads(dl || [])
      try { sessionStorage.setItem('callQueueIds', JSON.stringify((queue || []).map(l => l.id))) } catch {}
    })
  }, [router])

  async function bump(key: keyof Activity, delta: number) {
    if (!profile) return
    const t = logDate
    const cur = byDate[t] || ZERO
    const next = { ...cur, [key]: Math.max(0, cur[key] + delta) }
    setByDate(m => ({ ...m, [t]: next }))
    setSaving(true)
    await supabase.from('daily_activity').upsert({
      agent_id: profile.id, agent_name: profile.name, date: t, ...next
    }, { onConflict: 'agent_id,date' })
    setSaving(false)
  }

  if (!profile) return <Loading />

  const rate = (a: number, b: number) => b > 0 ? `${Math.round((a / b) * 100)}%` : '—'

  // ----- Period totals with prev/next navigation -----
  const now = new Date()
  const ws = new Date(weekStartSat(now)); ws.setDate(ws.getDate() + weekOffset * 7)
  const we = new Date(ws); we.setDate(ws.getDate() + 6)
  const viewMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const inPeriod = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    if (period === 'day') return dateStr === today()
    if (period === 'month') return d.getMonth() === viewMonth.getMonth() && d.getFullYear() === viewMonth.getFullYear()
    return d >= ws && d <= we
  }
  const total: Activity = Object.entries(byDate).reduce((s, [date, a]) => inPeriod(date)
    ? { dials: s.dials + a.dials, contacts: s.contacts + a.contacts, appts: s.appts + a.appts, sales: s.sales + a.sales } : s, { ...ZERO })
  const fmtD = (d: Date) => d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const isCurrentPeriod = (period === 'week' && weekOffset === 0) || (period === 'month' && monthOffset === 0) || period === 'day'
  const periodLabel = period === 'day' ? 'Today'
    : period === 'month' ? viewMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })
    : `Work Week · ${fmtD(ws)} – ${fmtD(we)}`

  // Best time to dial: learn from when past dials actually reached people
  const WINDOWS = [
    { key: 'morning', label: 'morning', lo: 5, hi: 12 },
    { key: 'afternoon', label: 'afternoon', lo: 12, hi: 17 },
    { key: 'evening', label: 'evening', lo: 17, hi: 22 },
  ]
  const REACHED = ['Booked', 'Wants callback', 'Appt Showed', 'Sit Follow Up', 'Sit No Sale', 'Closed']
  const NOCONTACT = ['No answer', 'Left voicemail']
  const winStats = WINDOWS.map(w => ({ ...w, reached: 0, total: 0 }))
  for (const l of dialLeads) {
    if (!l.updated_at) continue
    const isReached = REACHED.includes(l.disposition)
    if (!isReached && !NOCONTACT.includes(l.disposition)) continue
    const h = new Date(l.updated_at).getHours()
    const w = winStats.find(x => h >= x.lo && h < x.hi)
    if (!w) continue
    w.total++; if (isReached) w.reached++
  }
  const totalDialed = winStats.reduce((s, w) => s + w.total, 0)
  const reachRate = (w: { reached: number; total: number }) => (w.total ? w.reached / w.total : 0)
  let dialTip = ''
  if (totalDialed >= 8) {
    const best = [...winStats].filter(w => w.total >= 2).sort((a, b) => reachRate(b) - reachRate(a))[0]
    const busiest = [...winStats].sort((a, b) => b.total - a.total)[0]
    if (best && busiest) {
      dialTip = best.key !== busiest.key && reachRate(best) > reachRate(busiest)
        ? `Most of your dials land in the ${busiest.label} (${Math.round(reachRate(busiest) * 100)}% reached). Try the ${best.label} — you reach ${Math.round(reachRate(best) * 100)}% there.`
        : `Your ${best.label} dials connect best (${Math.round(reachRate(best) * 100)}% reached). Lean into that window.`
    }
  }

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={profile.name} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-5">
          <h1 className="text-3xl font-black text-white">Dial Tracker</h1>
          <p className="text-gray-500 mt-1">Tap as you dial — saves automatically {saving && <span className="text-yellow-600">· saving…</span>}{logDate !== today() && <span className="text-yellow-500 ml-1">· editing past date</span>}</p>
        </div>

        {/* Period toggle */}
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div className="inline-flex gap-1 bg-gray-900 rounded-xl p-1">
            {(['day', 'week', 'month'] as Period[]).map(pk => (
              <button key={pk} onClick={() => { setPeriod(pk); setWeekOffset(0); setMonthOffset(0) }}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition ${period === pk ? 'gold-gradient text-black' : 'text-gray-400'}`}>
                {pk}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {period !== 'day' && (
              <button onClick={() => period === 'week' ? setWeekOffset(o => o - 1) : setMonthOffset(o => o - 1)}
                className="w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition text-sm">‹</button>
            )}
            <span className="text-xs text-gray-500 font-medium">{periodLabel}</span>
            {period !== 'day' && (
              <button onClick={() => period === 'week' ? setWeekOffset(o => Math.min(0, o + 1)) : setMonthOffset(o => Math.min(0, o + 1))}
                disabled={isCurrentPeriod}
                className="w-7 h-7 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition text-sm disabled:opacity-30">›</button>
            )}
          </div>
        </div>

        {/* Date selector for logging — defaults to today, can be changed to fix past entries */}
        <div className="flex items-center gap-3 mb-4">
          <label className="text-xs text-gray-500 font-bold uppercase tracking-wider whitespace-nowrap">Logging for</label>
          <input
            type="date"
            value={logDate}
            max={today()}
            onChange={e => setLogDate(e.target.value || today())}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-500"
          />
          {logDate !== today() && (
            <button onClick={() => setLogDate(today())} className="text-xs text-yellow-500 hover:underline">Back to today</button>
          )}
        </div>

        {/* Big counters — show the selected period's tally */}
        <div className="grid grid-cols-2 gap-4 mb-2">
          {METRICS.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="card-gold p-5 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Icon size={16} className={color} />
                <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">{label}</span>
              </div>
              <p className={`text-5xl font-black ${color} mb-3`}>{total[key]}</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => bump(key, -1)} className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition">
                  <Minus size={18} />
                </button>
                <button onClick={() => bump(key, 1)} className="w-14 h-14 rounded-full gold-gradient text-black flex items-center justify-center hover:opacity-90 transition font-black">
                  <Plus size={24} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-600 text-center mb-8">
          {period === 'day' ? 'Showing today.' : isCurrentPeriod ? `Showing the current ${period} — taps still log today.` : `Viewing past ${period} — read only. Use ‹ › to navigate.`}
        </p>

        {/* Up Next to Call — work straight down the list while you dial */}
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider">Up Next to Call</h2>
            {callQueue.length > 0 && <span className="text-[11px] text-gray-600">{callQueue.length} leads</span>}
          </div>
          {dialTip && (
            <div className="mb-3 flex items-start gap-2 rounded-lg bg-yellow-500/10 px-3 py-2" style={{ border: '1px solid rgba(212,160,23,0.4)' }}>
              <span className="text-xs mt-0.5 flex-shrink-0">⏰</span>
              <p className="text-[11px] font-medium leading-snug" style={{ color: 'var(--fg)' }}>{dialTip}</p>
            </div>
          )}
          {callQueue.length === 0 ? (
            <p className="text-sm text-gray-600 py-6 text-center">Queue's clear! 🎯<br /><a href="/leads" className="text-yellow-500 hover:underline text-xs">Add leads →</a></p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {callQueue.map(l => {
                const tel = (l.phone || '').replace(/\D/g, '')
                return (
                  <div key={l.id} className="flex items-center gap-2 card p-3">
                    <a href={`/leads/${l.id}?queue=1`} className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{l.name}</p>
                      <p className="text-xs text-gray-600 truncate">{l.phone || 'No phone'} · {l.disposition}</p>
                    </a>
                    {tel && (
                      <a href={`tel:${tel}`} onClick={() => { setLogDate(today()); bump('dials', 1) }}
                        className="flex items-center gap-1 gold-gradient text-black font-black text-xs px-3 py-2 rounded-lg hover:opacity-90 transition flex-shrink-0">
                        <Phone size={13} /> Call
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Conversion for the selected period */}
        <div className="card p-5">
          <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-4 capitalize">{period} Conversion</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs text-gray-500 mb-1">Contact Rate</p><p className="text-xl font-black text-white">{rate(total.contacts, total.dials)}</p></div>
            <div><p className="text-xs text-gray-500 mb-1">Appt Rate</p><p className="text-xl font-black text-white">{rate(total.appts, total.contacts)}</p></div>
            <div><p className="text-xs text-gray-500 mb-1">Close Rate</p><p className="text-xl font-black text-white">{rate(total.sales, total.appts)}</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}
