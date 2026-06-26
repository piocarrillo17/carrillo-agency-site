'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import { AlertTriangle, Users, DollarSign, PhoneOff, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react'
import clsx from 'clsx'
import { CARRIERS } from '@/lib/constants'

type Profile = { id: string; name: string; manager_id: string | null; role: string }
type Pol = { agent_id: string; agent_name: string; carrier: string; apv: number; status: string; comp_percent: number; advance_rate: number; commission_paid: number; date_written: string }
type Entry = { agent_id: string; adv_owed: number }
type MDebt = { id: string; agent_id: string; agent_name: string; carrier: string; amount: number; note: string }

const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const projComm = (p: Pol) => p.apv * ((p.comp_percent ?? 100) / 100) * ((p.advance_rate ?? 75) / 100)

export default function DebtPage() {
  const router = useRouter()
  const [me, setMe] = useState<Profile | null>(null)
  const [allAgents, setAllAgents] = useState<Profile[]>([])
  const [downline, setDownline] = useState<Profile[]>([])
  const [pols, setPols] = useState<Pol[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [mdebts, setMdebts] = useState<MDebt[]>([])
  const [scope, setScope] = useState<'baseshop' | 'agency'>('baseshop')
  const [showAdd, setShowAdd] = useState(false)
  const [mdForm, setMdForm] = useState({ carrier: '', amount: '', note: '' })

  async function addManualDebt() {
    if (!me || !mdForm.amount) return
    const { data } = await supabase.from('manual_debt').insert({
      agent_id: me.id, agent_name: me.name, carrier: mdForm.carrier, amount: Number(mdForm.amount) || 0, note: mdForm.note,
    }).select().single()
    if (data) setMdebts(d => [...d, data as MDebt])
    setMdForm({ carrier: '', amount: '', note: '' }); setShowAdd(false)
  }
  async function delManualDebt(id: string) {
    await supabase.from('manual_debt').delete().eq('id', id)
    setMdebts(d => d.filter(x => x.id !== id))
  }

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
      setMe(p)
      const [{ data: profs }, { data: pl }, { data: ent }, { data: md }] = await Promise.all([
        supabase.from('profiles').select('id,name,manager_id,role'),
        supabase.from('policy_log').select('agent_id,agent_name,carrier,apv,status,comp_percent,advance_rate,commission_paid,date_written'),
        supabase.from('entries').select('agent_id,adv_owed'),
        supabase.from('manual_debt').select('*'),
      ])
      setAllAgents(profs || [])
      setDownline((profs || []).filter(a => a.manager_id === p!.id))
      setPols((pl || []) as Pol[])
      setEntries((ent || []) as Entry[])
      setMdebts((md || []) as MDebt[])
    })
  }, [router])

  if (!me) return <Loading />

  const isManager = downline.length > 0 || me.role === 'manager'

  // Agent set for the chosen scope
  const baseshopIds = new Set([me.id, ...downline.map(a => a.id)])
  const scopeAgents = scope === 'baseshop'
    ? allAgents.filter(a => baseshopIds.has(a.id))
    : allAgents
  const scopeIds = new Set(scopeAgents.map(a => a.id))
  const scopePols = pols.filter(p => scopeIds.has(p.agent_id))

  const scopeMd = mdebts.filter(m => scopeIds.has(m.agent_id))
  // manual debt summed for an agent (and optionally a specific carrier)
  const mdFor = (agentId: string, carrier?: string) =>
    scopeMd.filter(m => m.agent_id === agentId && (carrier === undefined || m.carrier === carrier)).reduce((s, m) => s + (m.amount || 0), 0)
  const mdCarrier = (carrier: string) => scopeMd.filter(m => m.carrier === carrier).reduce((s, m) => s + (m.amount || 0), 0)

  // Per (agent, carrier) debt = chargeback commission; IP = issued commission
  const debtFor = (pl: Pol[]) => pl.filter(p => p.status === 'Chargeback').reduce((s, p) => s + projComm(p), 0)
  const ipFor = (pl: Pol[]) => pl.filter(p => p.status === 'Issued').reduce((s, p) => s + (p.commission_paid || projComm(p)), 0)

  // Carriers that have data (chargeback, issued, or a manual debt), in canonical order
  const activeCarriers = CARRIERS.filter(c =>
    scopePols.some(p => p.carrier === c && (p.status === 'Chargeback' || p.status === 'Issued')) || scopeMd.some(m => m.carrier === c))

  // Trend windows: new chargeback debt in last 30d vs the prior 30d
  const DAY = 86400000
  const now = Date.now()
  const recentCB = (pl: Pol[]) => pl.filter(p => p.status === 'Chargeback' && p.date_written && (now - new Date(p.date_written).getTime()) <= 30 * DAY).reduce((s, p) => s + projComm(p), 0)
  const priorCB = (pl: Pol[]) => pl.filter(p => p.status === 'Chargeback' && p.date_written && (now - new Date(p.date_written).getTime()) > 30 * DAY && (now - new Date(p.date_written).getTime()) <= 60 * DAY).reduce((s, p) => s + projComm(p), 0)

  // Agent rows
  const agentRows = scopeAgents.map(a => {
    const ap = scopePols.filter(p => p.agent_id === a.id)
    const advOwed = entries.filter(e => e.agent_id === a.id).reduce((s, e) => s + (e.adv_owed || 0), 0)
    const byCarrier: Record<string, number> = {}
    activeCarriers.forEach(c => { byCarrier[c] = debtFor(ap.filter(p => p.carrier === c)) + mdFor(a.id, c) })
    const totalDebt = debtFor(ap) + advOwed + mdFor(a.id)
    const ip = ipFor(ap)
    const recent = recentCB(ap), prior = priorCB(ap)
    const trend = recent - prior
    const isNew = prior === 0 && recent > 0 && ap.filter(p => p.status === 'Chargeback').length === ap.filter(p => p.status === 'Chargeback' && p.date_written && (now - new Date(p.date_written).getTime()) <= 30 * DAY).length
    return { agent: a, byCarrier, totalDebt, ip, advOwed, trend, isNew, hasIssued: ap.some(p => p.status === 'Issued') }
  }).filter(r => r.totalDebt > 0 || r.ip > 0).sort((a, b) => b.totalDebt - a.totalDebt)

  const totalDebt = agentRows.reduce((s, r) => s + r.totalDebt, 0)
  const totalIP = agentRows.reduce((s, r) => s + r.ip, 0)
  const noContact = agentRows.filter(r => r.totalDebt > 0 && !r.hasIssued).length

  // Debt by carrier
  const carrierCards = activeCarriers.map(c => {
    const cp = scopePols.filter(p => p.carrier === c)
    const debt = debtFor(cp) + mdCarrier(c)
    const ip = ipFor(cp)
    const agentsWith = new Set([...cp.filter(p => p.status === 'Chargeback' || p.status === 'Issued').map(p => p.agent_id), ...scopeMd.filter(m => m.carrier === c).map(m => m.agent_id)]).size
    return { carrier: c, debt, ip, ratio: ip > 0 ? (debt / ip) * 100 : 0, agents: agentsWith }
  }).filter(c => c.debt > 0 || c.ip > 0).sort((a, b) => b.debt - a.debt)

  // Reusable manual-debt card (used in both personal + manager views)
  const myManual = mdebts.filter(m => m.agent_id === me.id)
  const ManualDebtCard = (
    <div className="card p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider">Manual Debt Entries</h2>
        <button onClick={() => setShowAdd(s => !s)} className="text-xs gold-gradient text-black font-bold px-3 py-1.5 rounded-lg hover:opacity-90">
          {showAdd ? 'Cancel' : '+ Add Debt'}
        </button>
      </div>
      {showAdd && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
          <select value={mdForm.carrier} onChange={e => setMdForm(f => ({ ...f, carrier: e.target.value }))}
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500">
            <option value="">Carrier…</option>
            {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input type="number" min="0" value={mdForm.amount} onChange={e => setMdForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount"
              className="w-full bg-black border border-gray-700 rounded-lg pl-7 pr-2 py-2 text-white text-sm focus:outline-none focus:border-yellow-500" />
          </div>
          <input value={mdForm.note} onChange={e => setMdForm(f => ({ ...f, note: e.target.value }))} placeholder="Note (optional)"
            className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500" />
          <button onClick={addManualDebt} className="gold-gradient text-black font-bold rounded-lg py-2 text-sm hover:opacity-90">Add</button>
        </div>
      )}
      {myManual.length === 0 ? (
        <p className="text-xs text-gray-600">No manual debts. Use this for debt not captured by chargebacks.</p>
      ) : (
        <div className="space-y-1.5">
          {myManual.map(m => (
            <div key={m.id} className="flex items-center justify-between text-sm border-b border-gray-900 pb-1.5 last:border-0">
              <span className="text-gray-300">{m.carrier || 'General'} {m.note && <span className="text-gray-600">· {m.note}</span>}</span>
              <span className="flex items-center gap-3"><span className="text-red-400 font-bold">{fmt(m.amount)}</span>
                <button onClick={() => delManualDebt(m.id)} className="text-gray-600 hover:text-red-400 text-xs">remove</button></span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ---- Personal view (non-manager) ----
  if (!isManager) {
    const myPols = pols.filter(p => p.agent_id === me.id)
    const myCb = debtFor(myPols)
    const myAdv = entries.filter(e => e.agent_id === me.id).reduce((s, e) => s + (e.adv_owed || 0), 0)
    const myMd = myManual.reduce((s, m) => s + (m.amount || 0), 0)
    const total = myCb + myAdv + myMd
    const cbs = myPols.filter(p => p.status === 'Chargeback')
    return (
      <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
        <Sidebar agentName={me.name} />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6 flex items-center gap-3">
            <AlertTriangle size={28} className="text-orange-500" />
            <div>
              <h1 className="text-3xl font-black text-white">Debt Management</h1>
              <p className="text-gray-500 mt-0.5">What you owe back to the carrier</p>
            </div>
          </div>
          <div className={`rounded-2xl p-6 mb-6 border ${total > 0 ? 'bg-red-500/10 border-red-700/40' : 'bg-green-500/10 border-green-700/40'}`}>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Balance Owed</p>
            <p className={`text-4xl font-black ${total > 0 ? 'text-red-400' : 'text-green-400'}`}>{fmt(total)}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card p-5"><p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Advance Owed</p><p className="text-2xl font-black text-orange-400">{fmt(myAdv)}</p></div>
            <div className="card p-5"><p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Chargebacks</p><p className="text-2xl font-black text-red-400">{fmt(myCb)}</p><p className="text-xs text-gray-600 mt-1">{cbs.length} policies</p></div>
            <div className="card p-5"><p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Manual</p><p className="text-2xl font-black text-red-400">{fmt(myMd)}</p></div>
          </div>
          {ManualDebtCard}
          <p className="text-xs text-gray-600">Become a manager and assign your team on the <a href="/admin" className="text-yellow-500 hover:underline">Team page →</a> to see rolled-up debt by carrier.</p>
        </div>
      </div>
    )
  }

  // ---- Manager team view ----
  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={me.name} />
      <div className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-white">Debt Management</h1>
            <p className="text-gray-500 mt-1 text-xs uppercase tracking-wider">Baseshop = your internal team · Agency = all org agents</p>
          </div>

          {/* Scope toggle */}
          <div className="inline-flex gap-1 bg-gray-900 rounded-xl p-1 mb-6">
            <button onClick={() => setScope('baseshop')}
              className={clsx('px-4 py-2 rounded-lg text-sm font-bold transition', scope === 'baseshop' ? 'gold-gradient text-black' : 'text-gray-400')}>
              Baseshop <span className="opacity-60">{baseshopIds.size}</span>
            </button>
            <button onClick={() => setScope('agency')}
              className={clsx('px-4 py-2 rounded-lg text-sm font-bold transition', scope === 'agency' ? 'gold-gradient text-black' : 'text-gray-400')}>
              Agency <span className="opacity-60">{allAgents.length}</span>
            </button>
          </div>

          {/* Top stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-1"><DollarSign size={14} className="text-red-400" /><p className="text-xs text-gray-500 uppercase tracking-wider">Total Debt</p></div>
              <p className="text-2xl font-black text-red-400">{fmt(totalDebt)}</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-1"><Users size={14} className="text-gray-400" /><p className="text-xs text-gray-500 uppercase tracking-wider">Agents</p></div>
              <p className="text-2xl font-black text-white">{agentRows.length}</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-1"><PhoneOff size={14} className="text-yellow-400" /><p className="text-xs text-gray-500 uppercase tracking-wider">No Production</p></div>
              <p className="text-2xl font-black text-yellow-400">{noContact}</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-green-400" /><p className="text-xs text-gray-500 uppercase tracking-wider">Total IP</p></div>
              <p className="text-2xl font-black text-green-400">{fmt(totalIP)}</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Debt / IP</p>
              <p className="text-2xl font-black text-white">{totalIP > 0 ? `${Math.round((totalDebt / totalIP) * 100)}%` : '—'}</p>
            </div>
          </div>

          {ManualDebtCard}

          {/* Agent Debt Overview matrix */}
          <div className="card overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-500" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Agent Debt Overview</h2>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{agentRows.length} agents</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium sticky left-0 bg-[var(--card-bg)]">Agent</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Trend (30d)</th>
                    <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium">Total Debt</th>
                    {activeCarriers.map(c => (
                      <th key={c} className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider font-medium whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agentRows.length === 0 ? (
                    <tr><td colSpan={activeCarriers.length + 3} className="px-4 py-12 text-center text-gray-600">No debt in this scope. 🎉</td></tr>
                  ) : agentRows.map(r => (
                    <tr key={r.agent.id} className="border-b border-gray-900 hover:bg-white/5 transition">
                      <td className="px-4 py-3 font-medium text-white sticky left-0 bg-[var(--card-bg)]">{r.agent.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.isNew ? (
                          <span className="text-xs font-bold text-gray-500">NEW</span>
                        ) : r.trend > 0 ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-400"><ArrowUp size={12} />+{fmt(r.trend)}</span>
                        ) : r.trend < 0 ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-green-400"><ArrowDown size={12} />{fmt(r.trend)}</span>
                        ) : (
                          <span className="text-xs text-gray-600">No change</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-red-400">{fmt(r.totalDebt)}</td>
                      {activeCarriers.map(c => (
                        <td key={c} className="px-4 py-3 text-right text-gray-400">{r.byCarrier[c] > 0 ? fmt(r.byCarrier[c]) : '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-700 bg-white/5">
                    <td className="px-4 py-3 font-black text-white sticky left-0 bg-[var(--card-bg)]">Total</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right font-black text-red-400">{fmt(totalDebt)}</td>
                    {activeCarriers.map(c => (
                      <td key={c} className="px-4 py-3 text-right font-bold text-gray-300">{fmt(agentRows.reduce((s, r) => s + (r.byCarrier[c] || 0), 0))}</td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Debt by Carrier cards */}
          <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-4">Debt by Carrier</h2>
          <p className="text-xs text-gray-600 mb-4">Outstanding debt vs issue-paid production per carrier</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {carrierCards.map(c => (
              <div key={c.carrier} className="card p-5">
                <p className="font-black text-white mb-3">{c.carrier}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Debt</span><span className="text-red-400 font-bold">{fmt(c.debt)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">IP</span><span className="text-green-400 font-bold">{fmt(c.ip)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Debt/IP</span><span className={clsx('font-bold', c.ratio > 100 ? 'text-red-400' : 'text-gray-300')}>{c.ip > 0 ? `${c.ratio.toFixed(1)}%` : '—'}</span></div>
                </div>
                <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-800">{c.agents} agent{c.agents !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
