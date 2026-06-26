'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Entry } from '@/lib/supabase'
import { commissionableAP } from '@/lib/constants'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MSHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmt = (n: number) => `$${(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
const rate = (a: number, b: number) => b > 0 ? `${Math.round((a / b) * 100)}%` : '—'

type Profile = { id: string; name: string }
type PolicyRow = { apv: number; status: string; month: number; comp_percent: number; advance_rate: number; commission_paid: number; commission_status: string; carrier?: string }
type Act = { date: string; dials: number; contacts: number; appts: number; sales: number }
type Outcome = { disposition: string; updated_at: string }
type Expense = { date: string; category: string; amount: number; lead_count?: number | null }

export default function AnalyticsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [policies, setPolicies] = useState<PolicyRow[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [activity, setActivity] = useState<Act[]>([])
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [expenseRows, setExpenseRows] = useState<Expense[]>([])
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([])
  const [viewId, setViewId] = useState('')
  const [year] = useState(new Date().getFullYear())
  const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1)

  async function loadFor(agentId: string) {
    const [{ data: pol }, { data: ent }, { data: act }, { data: lo }, { data: ex }] = await Promise.all([
      supabase.from('policy_log').select('apv,status,month,year,comp_percent,advance_rate,commission_paid,commission_status,carrier').eq('agent_id', agentId).eq('year', year),
      supabase.from('entries').select('*').eq('agent_id', agentId).eq('year', year),
      supabase.from('daily_activity').select('date,dials,contacts,appts,sales').eq('agent_id', agentId).gte('date', `${year}-01-01`),
      supabase.from('leads').select('disposition,updated_at').eq('agent_id', agentId),
      supabase.from('expenses').select('date,category,amount,lead_count').eq('agent_id', agentId).gte('date', `${year}-01-01`),
    ])
    setPolicies((pol || []) as PolicyRow[])
    setEntries((ent || []) as Entry[])
    setActivity((act || []) as Act[])
    setOutcomes((lo || []) as Outcome[])
    setExpenseRows((ex || []) as Expense[])
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('id,name').eq('id', session.user.id).single()
      setProfile(p); setViewId(session.user.id)
      // Manager? build a picker of self + downline (RLS lets a manager read their team)
      const { data: team } = await supabase.from('profiles').select('id,name').eq('manager_id', session.user.id)
      const downline = (team || []).filter(t => t.id !== session.user.id)
      setAgents([{ id: session.user.id, name: `${p?.name || 'Me'} (You)` }, ...downline])
      loadFor(session.user.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, year])

  if (!profile) return <Loading />

  const projComm = (p: PolicyRow) => commissionableAP(p.apv, p.carrier) * ((p.comp_percent ?? 100) / 100) * ((p.advance_rate ?? 75) / 100)
  const written = (s: string) => ['Submitted', 'Approved', 'Issued'].includes(s)
  const issuedS = (s: string) => ['Approved', 'Issued'].includes(s)

  // ----- Selected-month rollup -----
  const mp = policies.filter(p => p.month === selMonth)
  const entry = entries.find(e => e.month === selMonth)
  const mAct = activity.filter(a => new Date(a.date + 'T00:00:00').getMonth() + 1 === selMonth)
    .reduce((s, r) => ({ dials: s.dials + r.dials, contacts: s.contacts + r.contacts, appts: s.appts + r.appts, sales: s.sales + r.sales }), { dials: 0, contacts: 0, appts: 0, sales: 0 })
  const mOut = outcomes.filter(o => o.updated_at && new Date(o.updated_at).getMonth() + 1 === selMonth)
  // Appointments that were sat but not yet closed (lead still on a sit disposition).
  const SHOWN = ['Appt Showed', 'Sit Follow Up', 'Sit No Sale', 'Sit - No Sale', 'Sit - Follow Up']
  // A "contact" is any lead you actually spoke with live (not just dialed / voicemail).
  const CONTACTED = ['Wants callback', 'Booked', 'Not interested', 'Do not call',
    'Appt Showed', 'Appt No Show', 'Appt Rescheduled', 'Sit Follow Up', 'Sit No Sale', 'Sit - No Sale', 'Sit - Follow Up', 'Closed']
  // Every app written = an appointment that showed AND closed. Counting closes via
  // the policy log means a closed deal always counts as a show, even after the lead
  // is moved to an "active client" status later on.
  const shows = mOut.filter(o => SHOWN.includes(o.disposition)).length + mp.length
  const noShows = mOut.filter(o => o.disposition === 'Appt No Show').length
  // Use logged contacts if present, otherwise fall back to contacts derived from lead
  // dispositions (and from apps written, since a sale always implies a live contact).
  const leadContacts = mOut.filter(o => CONTACTED.includes(o.disposition)).length
  const contacts = Math.max(mAct.contacts, leadContacts, mp.length)

  // Expenses from the expenses table (where lead costs live) for the selected month.
  const mExp = expenseRows.filter(e => new Date(e.date + 'T00:00:00').getMonth() + 1 === selMonth)
  const mExpTotal = mExp.reduce((s, e) => s + (e.amount || 0), 0)
  const mLeadExp = mExp.filter(e => e.category === 'Lead Cost')
  const leadSpend = mLeadExp.reduce((s, e) => s + (e.amount || 0), 0)
  const leadsBought = mLeadExp.reduce((s, e) => s + (e.lead_count || 0), 0)

  const m = {
    apps: mp.length,
    issued: mp.filter(p => issuedS(p.status)).length,
    submittedAP: mp.filter(p => written(p.status)).reduce((s, p) => s + p.apv, 0),
    issuedAP: mp.filter(p => issuedS(p.status)).reduce((s, p) => s + p.apv, 0),
    chargebacks: mp.filter(p => p.status === 'Chargeback').reduce((s, p) => s + p.apv, 0),
    income: mp.filter(p => p.commission_status === 'Paid').reduce((s, p) => s + (p.commission_paid || projComm(p)), 0),
    pending: mp.filter(p => p.commission_status !== 'Paid' && p.status !== 'Chargeback').reduce((s, p) => s + projComm(p), 0),
    earned: entry?.earned || 0,
    // Logged expenses (incl. lead costs) plus any legacy monthly expense entry.
    expenses: mExpTotal + (entry?.mo_expenses || 0),
  }
  // Lead ROI for the month: paid commission ÷ lead spend.
  const roiPct = leadSpend > 0 ? Math.round((m.income / leadSpend) * 100) : null
  const costPerLead = leadsBought > 0 ? leadSpend / leadsBought : null
  // Take Home = commission you've actually been paid, minus expenses and chargebacks.
  const takeHome = m.income - m.expenses - m.chargebacks

  const funnel = [
    { label: 'Dials', value: mAct.dials, color: '#1e6f5c' },
    { label: 'Contacts', value: contacts, color: '#2a9d8f' },
    { label: 'Appointments', value: mAct.appts, color: '#5ec5b6' },
    { label: 'Sales', value: mAct.sales, color: '#F5C842' },
  ]
  const fmax = Math.max(mAct.dials, 1)

  // ----- Full-year data for the chart + breakdown table -----
  const calc = (mo: number) => {
    const pm = policies.filter(p => p.month === mo)
    return {
      apps: pm.length,
      policies: pm.filter(p => issuedS(p.status)).length,
      submittedAP: pm.filter(p => written(p.status)).reduce((s, p) => s + p.apv, 0),
      issuedAP: pm.filter(p => issuedS(p.status)).reduce((s, p) => s + p.apv, 0),
      chargebacks: pm.filter(p => p.status === 'Chargeback').reduce((s, p) => s + p.apv, 0),
      income: pm.filter(p => p.commission_status === 'Paid').reduce((s, p) => s + (p.commission_paid || projComm(p)), 0),
    }
  }
  const chartData = MSHORT.map((mo, i) => ({ month: mo, 'Submitted AP': calc(i + 1).submittedAP, 'Issued AP': calc(i + 1).issuedAP }))

  const canNext = selMonth < (new Date().getMonth() + 1) || year < new Date().getFullYear()

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={profile.name} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-white">Analytics</h1>
            <p className="text-gray-500 mt-1">Production, funnel & financials by month</p>
          </div>
          {agents.length > 1 && (
            <select value={viewId} onChange={e => { setViewId(e.target.value); loadFor(e.target.value) }}
              className="bg-gray-900 border border-gray-800 text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500">
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={() => setSelMonth(mo => mo > 1 ? mo - 1 : mo)} disabled={selMonth <= 1}
            className="w-9 h-9 rounded-full bg-gray-900 border border-gray-800 text-gray-300 hover:text-white flex items-center justify-center disabled:opacity-30"><ChevronLeft size={18} /></button>
          <span className="text-lg font-black text-white w-44 text-center">{MONTHS[selMonth - 1]} {year}</span>
          <button onClick={() => setSelMonth(mo => mo < 12 ? mo + 1 : mo)} disabled={!canNext}
            className="w-9 h-9 rounded-full bg-gray-900 border border-gray-800 text-gray-300 hover:text-white flex items-center justify-center disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>

        {/* Production */}
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-2 font-bold">Production</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Apps Written', value: String(m.apps) },
            { label: 'Policies Issued', value: String(m.issued) },
            { label: 'Dials', value: mAct.dials.toLocaleString() },
            { label: 'Submitted AP', value: fmt(m.submittedAP) },
            { label: 'Issued AP', value: fmt(m.issuedAP) },
            { label: 'Chargebacks', value: fmt(m.chargebacks) },
          ].map(c => (
            <div key={c.label} className="card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{c.label}</p>
              <p className="text-2xl font-black gold-text">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Money */}
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-2 font-bold">Money</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Income (Paid)', value: fmt(m.income), c: 'text-green-400' },
            { label: 'Pending Comm.', value: fmt(m.pending), c: 'text-yellow-400' },
            { label: 'Expenses', value: fmt(m.expenses), c: 'text-red-400' },
            { label: 'Take Home', value: fmt(takeHome), c: 'gold-text' },
          ].map(c => (
            <div key={c.label} className="card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{c.label}</p>
              <p className={`text-2xl font-black ${c.c}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Lead ROI */}
        {leadSpend > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Lead ROI', value: roiPct !== null ? `${roiPct}%` : '—', c: (roiPct ?? 0) >= 100 ? 'text-green-400' : 'text-red-400' },
              { label: 'Lead Spend', value: fmt(leadSpend), c: 'text-red-400' },
              { label: 'Leads Bought', value: leadsBought ? leadsBought.toLocaleString() : '—', c: 'text-white' },
              { label: 'Cost / Lead', value: costPerLead !== null ? `$${costPerLead.toFixed(2)}` : '—', c: 'text-white' },
            ].map(c => (
              <div key={c.label} className="card p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{c.label}</p>
                <p className={`text-2xl font-black ${c.c}`}>{c.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Conversion + Funnel */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Contact Rate', value: rate(contacts, mAct.dials) },
            { label: 'Book Rate', value: rate(mAct.appts, contacts) },
            { label: 'Show Rate', value: rate(shows, shows + noShows) },
            { label: 'Close Rate', value: rate(mAct.sales, mAct.appts) },
          ].map(c => (
            <div key={c.label} className="card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{c.label}</p>
              <p className="text-2xl font-black gold-text">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="card p-6 mb-6">
          <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-5">{MONTHS[selMonth - 1]} Funnel</h2>
          <div className="space-y-3">
            {funnel.map((f, i) => {
              const prev = i > 0 ? funnel[i - 1].value : f.value
              return (
                <div key={f.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300 font-medium">{f.label}</span>
                    <span className="text-gray-400">{f.value}{i > 0 && <span className="text-yellow-500 ml-2 font-bold">{rate(f.value, prev)}</span>}</span>
                  </div>
                  <div className="h-7 bg-gray-800 rounded-lg overflow-hidden">
                    <div className="h-full rounded-lg flex items-center justify-end pr-2 text-xs font-bold text-black transition-all"
                      style={{ width: `${Math.max((f.value / fmax) * 100, 4)}%`, background: f.color }}>
                      {f.value > 0 && f.value}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Year chart */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Annual Premium by Month · {year}</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
              <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} labelStyle={{ color: '#999' }} formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} />
              <Bar dataKey="Submitted AP" fill="#444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Issued AP" fill="#F5C842" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly breakdown table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-bold text-white">Monthly Breakdown · {year}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Month', 'Apps', 'Issued', 'Sub AP', 'Issued AP', 'Earned', 'Expenses', 'Take Home', 'Dials'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MSHORT.map((mo, i) => {
                  const c = calc(i + 1)
                  const e = entries.find(x => x.month === i + 1)
                  const earned = c.income, exp = e?.mo_expenses || 0
                  const th = earned - exp - c.chargebacks
                  const dials = activity.filter(a => new Date(a.date + 'T00:00:00').getMonth() === i).reduce((s, a) => s + a.dials, 0)
                  return (
                    <tr key={mo} className={`border-b border-gray-900 ${i + 1 === selMonth ? 'bg-yellow-500/5' : 'hover:bg-white/5'} transition cursor-pointer`} onClick={() => setSelMonth(i + 1)}>
                      <td className="px-3 py-3 font-medium text-gray-300 whitespace-nowrap">{mo}</td>
                      <td className="px-3 py-3 text-yellow-500 font-bold">{c.apps}</td>
                      <td className="px-3 py-3 text-gray-300">{c.policies}</td>
                      <td className="px-3 py-3 text-gray-300">{fmt(c.submittedAP)}</td>
                      <td className="px-3 py-3 text-green-400 font-medium">{fmt(c.issuedAP)}</td>
                      <td className="px-3 py-3 text-green-400">{earned > 0 ? fmt(earned) : '—'}</td>
                      <td className="px-3 py-3 text-red-400">{exp > 0 ? fmt(exp) : '—'}</td>
                      <td className="px-3 py-3 text-gray-300">{th !== 0 ? fmt(th) : '—'}</td>
                      <td className="px-3 py-3 text-gray-300">{dials || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
