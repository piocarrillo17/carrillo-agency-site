'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import { Target, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { isoWeekKey } from '@/lib/badges'

type Me = { id: string; name: string; role: string; contract_level?: number }
type Row = {
  agent_id: string; agent_name: string; level: number; override: number
  dials: number; contacts: number; shows: number; noShows: number; appts: number; sales: number
  apps: number; submittedAP: number; issuedAP: number
}
type Range = 'week' | 'month' | 'ytd'

const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${(n || 0).toFixed(0)}`
const pctStr = (num: number, den: number) => den > 0 ? `${Math.round((num / den) * 100)}%` : '—'

export default function CoachingPage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [range, setRange] = useState<Range>('month')
  const [loading, setLoading] = useState(true)
  const [notManager, setNotManager] = useState(false)
  const year = new Date().getFullYear()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      const { data: meP } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setMe(meP as any)
      const myLevel = (meP as any)?.contract_level ?? 80

      // Manager's downline (RLS lets a manager read their team's activity/policies)
      const { data: team } = await supabase.from('profiles').select('*').eq('manager_id', session.user.id)
      const teamList = (team || []).filter(t => t.id !== session.user.id)
      if (teamList.length === 0) { setNotManager(true); setLoading(false); return }

      const ids = teamList.map(t => t.id)
      const [{ data: acts }, { data: pols }, { data: lds }] = await Promise.all([
        supabase.from('daily_activity').select('agent_id,date,dials,contacts,appts,sales').in('agent_id', ids).gte('date', `${year}-01-01`),
        supabase.from('policy_log').select('agent_id,apv,status,month,year,date_written').in('agent_id', ids).eq('year', year),
        supabase.from('leads').select('agent_id,disposition,updated_at').in('agent_id', ids),
      ])
      // Leads you actually spoke with live (used to backfill contacts when the
      // Dial Tracker count isn't logged) and appointments that were sat (shows).
      const CONTACTED = ['Wants callback', 'Booked', 'Not interested', 'Do not call',
        'Appt Showed', 'Appt No Show', 'Appt Rescheduled', 'Sit Follow Up', 'Sit No Sale', 'Sit - No Sale', 'Sit - Follow Up', 'Closed']
      const SHOWN = ['Appt Showed', 'Sit Follow Up', 'Sit No Sale', 'Sit - No Sale', 'Sit - Follow Up']

      const now = new Date()
      const thisWeek = isoWeekKey(now)
      const thisMonth = now.getMonth() + 1
      const inActRange = (d: string) => range === 'ytd' ? true : range === 'month'
        ? new Date(d).getMonth() + 1 === thisMonth : isoWeekKey(new Date(d)) === thisWeek
      const inPolRange = (p: any) => range === 'ytd' ? true : range === 'month'
        ? p.month === thisMonth : (p.date_written ? isoWeekKey(new Date(p.date_written)) === thisWeek : false)
      const inLeadRange = (l: any) => !l.updated_at ? false : range === 'ytd' ? true : range === 'month'
        ? new Date(l.updated_at).getMonth() + 1 === thisMonth : isoWeekKey(new Date(l.updated_at)) === thisWeek
      const written = (s: string) => ['Submitted', 'Approved', 'Issued'].includes(s)
      const issued = (s: string) => ['Approved', 'Issued'].includes(s)

      const built: Row[] = teamList.map(t => {
        const a = (acts || []).filter(r => r.agent_id === t.id && inActRange(r.date))
        const p = (pols || []).filter(r => r.agent_id === t.id && inPolRange(r))
        const l = (lds || []).filter(r => r.agent_id === t.id && inLeadRange(r))
        const submittedAP = p.filter(r => written(r.status)).reduce((s, r) => s + r.apv, 0)
        const agentLevel = (t as any).contract_level ?? 80
        const spread = Math.max(0, myLevel - agentLevel)
        const loggedContacts = a.reduce((s, r) => s + (r.contacts || 0), 0)
        const leadContacts = l.filter(r => CONTACTED.includes(r.disposition)).length
        return {
          agent_id: t.id, agent_name: t.name, level: agentLevel,
          override: submittedAP * (spread / 100),
          dials: a.reduce((s, r) => s + (r.dials || 0), 0),
          contacts: Math.max(loggedContacts, leadContacts, p.length),
          // Sits not yet closed + every app written (a close always means it showed).
          shows: l.filter(r => SHOWN.includes(r.disposition)).length + p.length,
          noShows: l.filter(r => r.disposition === 'Appt No Show').length,
          appts: a.reduce((s, r) => s + (r.appts || 0), 0),
          sales: a.reduce((s, r) => s + (r.sales || 0), 0),
          apps: p.length,
          submittedAP,
          issuedAP: p.filter(r => issued(r.status)).reduce((s, r) => s + r.apv, 0),
        }
      }).sort((x, y) => y.submittedAP - x.submittedAP)

      setRows(built)
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, range])

  if (loading || !me) return <Loading />

  const team = { dials: 0, contacts: 0, shows: 0, noShows: 0, appts: 0, sales: 0, apps: 0, submittedAP: 0, issuedAP: 0, override: 0 }
  rows.forEach(r => { team.dials += r.dials; team.contacts += r.contacts; team.shows += r.shows; team.noShows += r.noShows; team.appts += r.appts; team.sales += r.sales; team.apps += r.apps; team.submittedAP += r.submittedAP; team.issuedAP += r.issuedAP; team.override += r.override })

  const ranges: { key: Range; label: string }[] = [
    { key: 'week', label: 'This Week' }, { key: 'month', label: 'This Month' }, { key: 'ytd', label: 'Year to Date' },
  ]

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={me.name} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Target size={26} className="text-yellow-500" />
          <div>
            <h1 className="text-3xl font-black text-white">Coaching</h1>
            <p className="text-gray-500 text-sm mt-0.5">Your team's activity & production — click an agent to dig in</p>
          </div>
        </div>

        {notManager ? (
          <div className="card p-10 text-center text-gray-500">
            No agents on your team yet. Add agents to your downline from the{' '}
            <button onClick={() => router.push('/admin')} className="text-yellow-500 hover:underline">Team page</button> to coach them here.
          </div>
        ) : (
          <>
            {/* Range toggle */}
            <div className="inline-flex gap-1 bg-gray-900 rounded-xl p-1 mb-5">
              {ranges.map(r => (
                <button key={r.key} onClick={() => setRange(r.key)}
                  className={clsx('px-4 py-2 rounded-lg text-sm font-bold transition', range === r.key ? 'gold-gradient text-black' : 'text-gray-400')}>
                  {r.label}
                </button>
              ))}
            </div>

            {/* Team totals */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3 mb-6">
              {[
                ['Dials', team.dials.toLocaleString()], ['Contacts', team.contacts.toLocaleString()],
                ['Appts', team.appts.toLocaleString()], ['Sales', team.sales.toLocaleString()],
                ['Contact %', pctStr(team.contacts, team.dials)], ['Show %', pctStr(team.shows, team.shows + team.noShows)],
                ['Close %', pctStr(team.sales, team.appts)],
                ['Sub AP', fmt(team.submittedAP)], ['My Override', fmt(team.override)],
              ].map(([l, v]) => (
                <div key={l} className="card p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{l}</p>
                  <p className={clsx('text-lg font-black', l === 'My Override' ? 'text-green-400' : 'gold-text')}>{v}</p>
                </div>
              ))}
            </div>

            {/* Per-agent table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Agent', 'Lvl', 'Dials', 'Contacts', 'Appts', 'Sales', 'Contact %', 'Show %', 'Close %', 'Apps', 'Sub AP', 'Issued AP', 'My Override', ''].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr><td colSpan={14} className="px-4 py-10 text-center text-gray-600">No activity in this period.</td></tr>
                    ) : rows.map(r => (
                      <tr key={r.agent_id} onClick={() => router.push(`/agents/${r.agent_id}`)}
                        className="border-b border-gray-900 hover:bg-white/5 transition cursor-pointer">
                        <td className="px-3 py-3 font-bold text-white whitespace-nowrap">{r.agent_name}</td>
                        <td className="px-3 py-3 text-gray-400">{r.level}</td>
                        <td className="px-3 py-3 text-gray-300">{r.dials.toLocaleString()}</td>
                        <td className="px-3 py-3 text-gray-300">{r.contacts.toLocaleString()}</td>
                        <td className="px-3 py-3 text-gray-300">{r.appts}</td>
                        <td className="px-3 py-3 text-green-400 font-medium">{r.sales}</td>
                        <td className="px-3 py-3 text-gray-300">{pctStr(r.contacts, r.dials)}</td>
                        <td className="px-3 py-3 text-teal-400">{pctStr(r.shows, r.shows + r.noShows)}</td>
                        <td className="px-3 py-3 text-yellow-400 font-medium">{pctStr(r.sales, r.appts)}</td>
                        <td className="px-3 py-3 text-gray-300">{r.apps}</td>
                        <td className="px-3 py-3 text-gray-300">{fmt(r.submittedAP)}</td>
                        <td className="px-3 py-3 text-green-400">{fmt(r.issuedAP)}</td>
                        <td className="px-3 py-3 text-green-400 font-bold">{fmt(r.override)}</td>
                        <td className="px-3 py-3 text-gray-600"><ChevronRight size={16} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3">Showing your downline only. Low contact % → coach dial windows; low close % → coach the appointment/presentation.</p>
          </>
        )}
      </div>
    </div>
  )
}
