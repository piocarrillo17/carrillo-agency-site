'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import { Zap, Flame } from 'lucide-react'
import { localDate } from '@/lib/date'
import { CONTACT_DISPOSITIONS } from '@/lib/constants'

type Profile = { id: string; name: string }
type Row = { date: string; dials: number; contacts: number; appts: number; sales: number }

// Activity weights — effort points per action
const WEIGHTS = { dials: 1, contacts: 3, appts: 8, sales: 25 }

export default function HustlePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [todayPts, setTodayPts] = useState(0)
  const [weekPts, setWeekPts] = useState(0)
  const [breakdown, setBreakdown] = useState({ dials: 0, contacts: 0, appts: 0, sales: 0 })
  const [streak, setStreak] = useState(0)
  const [rows, setRows] = useState<Row[]>([])

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

      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6)
      const [{ data: r }, { data: lds }] = await Promise.all([
        supabase.from('daily_activity').select('*').eq('agent_id', session.user.id).gte('date', localDate(weekAgo)).order('date'),
        supabase.from('leads').select('disposition,updated_at').eq('agent_id', session.user.id).gte('updated_at', localDate(weekAgo)),
      ])
      // Contacts derived from dispositions where we reached a live person, by the
      // day the lead was last worked — so booked/sit/etc. count even if the raw
      // daily_activity contact wasn't logged.
      const derived: Record<string, number> = {}
      ;(lds || []).forEach(l => {
        if (l.updated_at && CONTACT_DISPOSITIONS.includes(l.disposition)) {
          const d = localDate(new Date(l.updated_at)); derived[d] = (derived[d] || 0) + 1
        }
      })
      const pts = (row: any) => row.dials * WEIGHTS.dials + row.contacts * WEIGHTS.contacts + row.appts * WEIGHTS.appts + row.sales * WEIGHTS.sales
      const todayStr = localDate()
      // Merge activity rows with any days that only have derived contacts; take the
      // higher of logged vs derived contacts so neither double-counts.
      const dates = Array.from(new Set([...(r || []).map(x => x.date), ...Object.keys(derived)])).sort()
      const sorted = dates.map(date => {
        const row = (r || []).find(x => x.date === date) || { date, dials: 0, contacts: 0, appts: 0, sales: 0 }
        return { ...row, contacts: Math.max(row.contacts || 0, derived[date] || 0) }
      })
      let wk = 0, st = 0
      sorted.forEach(row => { wk += pts(row) })
      const todayRow = sorted.find(row => row.date === todayStr)
      if (todayRow) {
        setTodayPts(pts(todayRow))
        setBreakdown({ dials: todayRow.dials, contacts: todayRow.contacts, appts: todayRow.appts, sales: todayRow.sales })
      }
      for (let i = sorted.length - 1; i >= 0; i--) { if (pts(sorted[i]) > 0) st++; else break }
      setStreak(st)
      setWeekPts(wk)
      setRows(sorted.filter(row => pts(row) > 0).reverse() as Row[])
    })
  }, [router])

  if (!profile) return <Loading />

  const ptsOf = (r: Row) => r.dials * WEIGHTS.dials + r.contacts * WEIGHTS.contacts + r.appts * WEIGHTS.appts + r.sales * WEIGHTS.sales

  const lines = [
    { key: 'dials' as const, label: 'Dials' },
    { key: 'contacts' as const, label: 'Contacts' },
    { key: 'appts' as const, label: 'Appointments' },
    { key: 'sales' as const, label: 'Sales' },
  ]

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={profile.name} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black mb-6" style={{ color: 'var(--fg)' }}>Hustle Score</h1>

        {/* Top cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Today's Score */}
          <div className="card p-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(245,200,66,0.14), rgba(212,160,23,0.04))', borderColor: 'rgba(212,160,23,0.35)' }}>
            <Zap size={26} className="mx-auto mb-1 text-yellow-500" />
            <p className="text-5xl font-black gold-text leading-none">{todayPts}</p>
            <p className="text-sm mt-2" style={{ color: 'var(--fg-muted)' }}>Today&apos;s Score</p>
          </div>
          {/* This Week */}
          <div className="card p-6 text-center flex flex-col justify-center">
            <p className="text-5xl font-black leading-none" style={{ color: 'var(--fg)' }}>{weekPts}</p>
            <p className="text-sm mt-2" style={{ color: 'var(--fg-muted)' }}>This Week</p>
          </div>
          {/* Day Streak */}
          <div className="card p-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.14), rgba(249,115,22,0.04))', borderColor: 'rgba(249,115,22,0.35)' }}>
            <Flame size={26} className="mx-auto mb-1 text-orange-500" />
            <p className="text-5xl font-black leading-none text-orange-500">{streak}</p>
            <p className="text-sm mt-2" style={{ color: 'var(--fg-muted)' }}>Day Streak 🔥</p>
          </div>
        </div>

        {/* Today's Breakdown */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-black mb-3" style={{ color: 'var(--fg)' }}>Today&apos;s Breakdown</h2>
          {lines.map((l, i) => (
            <div key={l.key} className={i > 0 ? 'border-t' : ''} style={i > 0 ? { borderColor: 'var(--divider)' } : undefined}>
              <div className="flex items-center py-3">
                <span className="flex-1">
                  <span className="font-bold" style={{ color: 'var(--fg)' }}>{l.label}</span>
                  <span className="text-sm ml-2" style={{ color: 'var(--fg-subtle)' }}>× {WEIGHTS[l.key]} pts</span>
                </span>
                <span className="text-sm mr-8" style={{ color: 'var(--fg-muted)' }}>{breakdown[l.key]} activities</span>
                <span className="font-black gold-text w-12 text-right">+{breakdown[l.key] * WEIGHTS[l.key]}</span>
              </div>
            </div>
          ))}
          <div className="border-t mt-1 pt-3 flex items-center" style={{ borderColor: 'var(--divider)' }}>
            <span className="flex-1 font-black" style={{ color: 'var(--fg)' }}>Total</span>
            <span className="font-black gold-text text-lg">{todayPts}</span>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="card p-6">
          <h2 className="text-lg font-black mb-3" style={{ color: 'var(--fg)' }}>Recent Activity Log</h2>
          {rows.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--fg-subtle)' }}>No activity logged yet. Log dials and appointments on the <a href="/dials" className="gold-text font-bold">Dial Tracker →</a></p>
          ) : (
            <div>
              {rows.map((r, i) => (
                <div key={r.date} className={clsxRow(i)} style={i > 0 ? { borderColor: 'var(--divider)' } : undefined}>
                  <span className="font-bold" style={{ color: 'var(--fg)' }}>
                    {new Date(r.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--fg-muted)' }}>
                    {r.dials}d · {r.appts}a · {r.sales}s
                  </span>
                  <span className="font-black gold-text">+{ptsOf(r)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function clsxRow(i: number) {
  return `flex items-center justify-between py-3 ${i > 0 ? 'border-t' : ''}`
}
