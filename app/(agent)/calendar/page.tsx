'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import { Calendar as CalIcon, Clock, Phone, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { DISP_BADGE } from '@/lib/constants'

type Profile = { id: string; name: string }
type Appt = { id: string; name: string; phone: string; appt_date: string; disposition: string }

export default function CalendarPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [appts, setAppts] = useState<Appt[]>([])
  const [cursor, setCursor] = useState(new Date())

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
      const { data } = await supabase.from('leads').select('id,name,phone,appt_date,disposition')
        .eq('agent_id', session.user.id).neq('appt_date', '').order('appt_date')
      setAppts((data || []).filter(a => a.appt_date))
    })
  }, [router])

  if (!profile) return <Loading />

  // Build month grid
  const y = cursor.getFullYear(), m = cursor.getMonth()
  const first = new Date(y, m, 1)
  const startDay = first.getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const monthName = cursor.toLocaleString('default', { month: 'long', year: 'numeric' })

  const apptsByDay: Record<string, Appt[]> = {}
  appts.forEach(a => {
    const d = new Date(a.appt_date)
    if (d.getFullYear() === y && d.getMonth() === m) {
      const key = String(d.getDate())
      ;(apptsByDay[key] ||= []).push(a)
    }
  })

  const todayKey = (() => { const t = new Date(); return t.getFullYear() === y && t.getMonth() === m ? t.getDate() : -1 })()

  // Upcoming list (future)
  const now = new Date()
  const upcoming = [...appts].filter(a => new Date(a.appt_date) >= new Date(now.toDateString())).slice(0, 12)

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={profile.name} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <CalIcon size={28} className="text-yellow-500" />
          <div>
            <h1 className="text-3xl font-black text-white">Calendar</h1>
            <p className="text-gray-500 mt-0.5">Your booked appointments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Month grid */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCursor(new Date(y, m - 1, 1))} className="text-gray-400 hover:text-white p-1"><ChevronLeft size={20} /></button>
              <h2 className="font-black text-white">{monthName}</h2>
              <button onClick={() => setCursor(new Date(y, m + 1, 1))} className="text-gray-400 hover:text-white p-1"><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="text-center text-xs text-gray-600 font-bold py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayAppts = apptsByDay[String(day)] || []
                return (
                  <div key={day} className={clsx('aspect-square rounded-lg border p-1 overflow-hidden',
                    day === todayKey ? 'border-yellow-500 bg-yellow-500/5' : 'border-gray-800')}>
                    <div className="text-xs text-gray-500 font-medium">{day}</div>
                    {dayAppts.slice(0, 2).map(a => (
                      <button key={a.id} onClick={() => router.push(`/leads/${a.id}`)}
                        className="w-full text-left text-[9px] bg-teal-900 text-teal-300 rounded px-1 mt-0.5 truncate hover:bg-teal-800">
                        {new Date(a.appt_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} {a.name.split(' ')[0]}
                      </button>
                    ))}
                    {dayAppts.length > 2 && <div className="text-[9px] text-gray-600 mt-0.5">+{dayAppts.length - 2}</div>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upcoming list */}
          <div className="card p-5">
            <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-4">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-600">No upcoming appointments. Book one from a lead.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(a => (
                  <button key={a.id} onClick={() => router.push(`/leads/${a.id}`)}
                    className="w-full text-left card p-3 hover:bg-white/5 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{a.name}</span>
                      <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold', DISP_BADGE[a.disposition] || 'bg-sky-500 text-white')}>{a.disposition}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={11} />{new Date(a.appt_date).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                      {a.phone && <span className="flex items-center gap-1"><Phone size={11} />{a.phone}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
