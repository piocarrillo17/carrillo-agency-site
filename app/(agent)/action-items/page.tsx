'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import MessageModal from '@/components/MessageModal'
import { CalendarClock, Cake, ShieldCheck, PartyPopper, Send, Link2, Check, HeartPulse, Phone, Mail } from 'lucide-react'
import clsx from 'clsx'
import { TEMPLATES, parseMonthDay, daysUntil, upcomingHolidays } from '@/lib/messages'

type Profile = { id: string; name: string; calendar_link: string }
type Lead = { id: string; name: string; phone: string; email: string; dob: string; disposition: string; appt_date: string; is_dead: boolean }
type Pol = { client_name: string; product_type: string; date_written: string; status: string; client_status?: string; flag_reason?: string }

const fd = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

export default function ActionItemsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [pols, setPols] = useState<Pol[]>([])
  const [tab, setTab] = useState<'appts' | 'birthdays' | 'reviews' | 'holidays' | 'save'>('appts')
  const [calLink, setCalLink] = useState('')
  const [calSaved, setCalSaved] = useState(false)
  const calRef = useRef(false)
  const [msg, setMsg] = useState<{ name: string; phone: string; body: string } | null>(null)
  const [holiday, setHoliday] = useState('')

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
      setProfile(p); setCalLink(p?.calendar_link || '')
      setTimeout(() => { calRef.current = true }, 200)
      const [{ data: l }, { data: pol }] = await Promise.all([
        supabase.from('leads').select('id,name,phone,email,dob,disposition,appt_date,is_dead').eq('agent_id', session.user.id),
        supabase.from('policy_log').select('client_name,product_type,date_written,status,client_status,flag_reason').eq('agent_id', session.user.id),
      ])
      setLeads(l || []); setPols(pol || [])
      const h = upcomingHolidays()[0]; if (h) setHoliday(h.name)
    })
  }, [router])


  if (!profile) return <Loading />

  const agent = profile.name.split(' ')[0]
  const first = (n: string) => n.split(' ')[0]

  // Appointments in the next 7 days
  const now = new Date()
  const week = new Date(now.getTime() + 7 * 86400000)
  const appts = leads
    .filter(l => l.appt_date && new Date(l.appt_date) >= new Date(now.toDateString()) && new Date(l.appt_date) <= week)
    .sort((a, b) => new Date(a.appt_date).getTime() - new Date(b.appt_date).getTime())

  // Birthdays in the next 14 days
  const birthdays = leads
    .filter(l => !l.is_dead && l.dob)
    .map(l => { const md = parseMonthDay(l.dob); return md ? { ...l, days: daysUntil(md.month, md.day), md } : null })
    .filter((x): x is Lead & { days: number; md: any } => !!x && x.days <= 14)
    .sort((a, b) => a.days - b.days)

  // Annual reviews — policies written 11-13 months ago
  const reviews = pols
    .map(p => { const d = new Date(p.date_written); const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()); return { ...p, months } })
    .filter(p => p.months >= 11 && p.months <= 13)
  const phoneFor = (clientName: string) => leads.find(l => l.name.toLowerCase() === clientName.toLowerCase())?.phone || ''
  const emailFor = (clientName: string) => leads.find(l => l.name.toLowerCase() === clientName.toLowerCase())?.email || ''

  const holidays = upcomingHolidays().slice(0, 6)
  const clients = leads.filter(l => !l.is_dead && l.phone)

  // Save-the-client: policies flagged / lapsed / cancelled
  const saveList = pols.filter(p => ['Flagged', 'Lapsed', 'Cancelled'].includes(p.client_status || ''))

  const counts = { appts: appts.length, birthdays: birthdays.length, reviews: reviews.length, holidays: clients.length, save: saveList.length }
  const TABS = [
    { k: 'appts' as const, label: 'Appointments', icon: CalendarClock, n: counts.appts },
    { k: 'save' as const, label: 'Save the Client', icon: HeartPulse, n: counts.save },
    { k: 'birthdays' as const, label: 'Birthdays', icon: Cake, n: counts.birthdays },
    { k: 'reviews' as const, label: 'Annual Reviews', icon: ShieldCheck, n: counts.reviews },
    { k: 'holidays' as const, label: 'Holidays', icon: PartyPopper, n: 0 },
  ]

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={profile.name} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-white">Action Items</h1>
          <p className="text-gray-500 mt-1">Pre-filled texts you can send from your phone with a quick scan</p>
        </div>


        {/* Tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {TABS.map(({ k, label, icon: Icon, n }) => (
            <button key={k} onClick={() => setTab(k)}
              className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition',
                tab === k ? 'gold-gradient text-black' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white')}>
              <Icon size={15} /> {label} {n > 0 && <span className={clsx('text-xs px-1.5 rounded-full', tab === k ? 'bg-black/20' : 'bg-gray-800')}>{n}</span>}
            </button>
          ))}
        </div>

        {/* APPOINTMENTS */}
        {tab === 'appts' && (
          <div className="space-y-2">
            {appts.length === 0 ? <Empty msg="No appointments in the next 7 days." /> : appts.map(l => {
              const d = new Date(l.appt_date)
              const now2 = new Date()
              const isToday = d.getFullYear() === now2.getFullYear() && d.getMonth() === now2.getMonth() && d.getDate() === now2.getDate()
              const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
              return (
                <Row key={l.id} name={l.name} sub={`${isToday ? 'Today' : fd(d)} · ${timeStr}`} phone={l.phone} email={l.email}
                  onOpen={() => router.push(`/leads/${l.id}`)}
                  onSend={() => setMsg({ name: first(l.name), phone: l.phone, body: TEMPLATES.appointment.build({ name: first(l.name), agent, time: timeStr, date: isToday ? undefined : fd(d), calendarLink: calLink }) })} />
              )
            })}
          </div>
        )}

        {/* SAVE THE CLIENT */}
        {tab === 'save' && (
          <div className="space-y-2">
            {saveList.length === 0 ? <Empty msg="No flagged clients. Flag a client on the Clients & Sales page." /> : saveList.map((p, i) => (
              <Row key={i} name={p.client_name} sub={`${p.client_status}${p.flag_reason ? ` · ${p.flag_reason}` : ''}`} phone={phoneFor(p.client_name)} email={emailFor(p.client_name)}
                onOpen={() => router.push('/policies')}
                onSend={() => setMsg({ name: first(p.client_name), phone: phoneFor(p.client_name), body: TEMPLATES.save.build({ name: first(p.client_name), agent }) })} />
            ))}
            {saveList.length > 0 && <p className="text-xs text-gray-600 px-1 mt-2">Reach out to keep the policy in force. Flag/update clients on <a href="/policies" className="text-yellow-500 hover:underline">Clients & Sales →</a></p>}
          </div>
        )}

        {/* BIRTHDAYS */}
        {tab === 'birthdays' && (
          <div className="space-y-2">
            {birthdays.length === 0 ? <Empty msg="No birthdays in the next 14 days." /> : birthdays.map((l: any) => (
              <Row key={l.id} name={l.name} sub={l.days === 0 ? '🎂 Today!' : `In ${l.days} day${l.days !== 1 ? 's' : ''} · ${l.md.month}/${l.md.day}`}
                phone={l.phone} email={l.email}
                onOpen={() => router.push(`/leads/${l.id}`)}
                onSend={() => setMsg({ name: first(l.name), phone: l.phone, body: TEMPLATES.birthday.build({ name: first(l.name), agent }) })} />
            ))}
          </div>
        )}

        {/* REVIEWS */}
        {tab === 'reviews' && (
          <div className="space-y-2">
            {reviews.length === 0 ? <Empty msg="No policies are due for an annual review right now." /> : reviews.map((p, i) => (
              <Row key={i} name={p.client_name} sub={`${p.product_type || 'Policy'} · written ${p.months} mo ago`}
                phone={phoneFor(p.client_name)} email={emailFor(p.client_name)}
                onSend={() => setMsg({ name: first(p.client_name), phone: phoneFor(p.client_name), body: TEMPLATES.review.build({ name: first(p.client_name), agent, product: p.product_type, calendarLink: calLink }) })} />
            ))}
          </div>
        )}

        {/* HOLIDAYS */}
        {tab === 'holidays' && (
          <div>
            <div className="card p-4 mb-4">
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Pick a holiday</label>
              <select value={holiday} onChange={e => setHoliday(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500">
                {holidays.map(h => <option key={h.name} value={h.name}>{h.name} — {fd(h.date)} ({h.days === 0 ? 'today' : `${h.days}d`})</option>)}
              </select>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-1">Send to your clients ({clients.length})</p>
            <div className="space-y-2">
              {clients.length === 0 ? <Empty msg="No clients with a phone number yet." /> : clients.map(l => (
                <Row key={l.id} name={l.name} sub={l.phone}
                  phone={l.phone} email={l.email}
                  onOpen={() => router.push(`/leads/${l.id}`)}
                  onSend={() => setMsg({ name: first(l.name), phone: l.phone, body: TEMPLATES.holiday.build({ name: first(l.name), agent, holiday }) })} />
              ))}
            </div>
          </div>
        )}
      </div>

      <MessageModal open={!!msg} onClose={() => setMsg(null)} name={msg?.name || ''} phone={msg?.phone || ''} message={msg?.body || ''} />
    </div>
  )
}

function Row({ name, sub, onSend, onOpen, phone, email }: { name: string; sub: string; onSend: () => void; onOpen?: () => void; phone?: string; email?: string }) {
  const tel = (phone || '').replace(/\D/g, '')
  return (
    <div className="card p-3 flex items-center justify-between gap-2">
      <button onClick={onOpen} disabled={!onOpen} className={clsx('text-left min-w-0 flex-1', onOpen && 'hover:opacity-80')}>
        <p className="font-bold text-white text-sm truncate">{name}</p>
        <p className="text-xs text-gray-500 truncate">{sub}</p>
      </button>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {tel && <a href={`tel:${tel}`} title="Call" className="w-9 h-9 rounded-lg bg-gray-900 border border-gray-800 text-green-400 flex items-center justify-center hover:bg-gray-800"><Phone size={15} /></a>}
        <button onClick={onSend} title="Text" className="w-9 h-9 rounded-lg bg-gray-900 border border-gray-800 text-yellow-500 flex items-center justify-center hover:bg-gray-800"><Send size={15} /></button>
        {email && <a href={`mailto:${email}`} title="Email" className="w-9 h-9 rounded-lg bg-gray-900 border border-gray-800 text-blue-400 flex items-center justify-center hover:bg-gray-800"><Mail size={15} /></a>}
      </div>
    </div>
  )
}

function Empty({ msg }: { msg: string }) {
  return <div className="card p-10 text-center text-gray-600 text-sm">{msg}</div>
}
