'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import { useToast } from '@/components/Toast'
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react'
import { localDate } from '@/lib/date'
import { commissionableAP } from '@/lib/constants'
import clsx from 'clsx'

type Profile = { id: string; name: string; manager_id: string | null; role: string; contract_level?: number }
type Pol = { agent_id: string; apv: number; status: string; comp_percent: number; advance_rate: number; commission_paid: number; commission_status: string; date_written: string; carrier?: string }
type Expense = { id: string; agent_id: string; agent_name: string; date: string; category: string; amount: number; note: string; lead_count?: number | null; vendor?: string | null }

const CATEGORIES = ['Lead Cost', 'CRM Cost', 'Marketing', 'Other Business']
const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const advance = (p: Pol) => commissionableAP(p.apv, p.carrier) * ((p.comp_percent ?? 100) / 100) * ((p.advance_rate ?? 75) / 100)

export default function DepositsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [me, setMe] = useState<Profile | null>(null)
  const [agents, setAgents] = useState<Profile[]>([])
  const [downline, setDownline] = useState<Profile[]>([])
  const [pols, setPols] = useState<Pol[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [period, setPeriod] = useState<'month' | 'ytd'>('month')
  const [scope, setScope] = useState<'mine' | 'team'>('mine')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ date: localDate(), category: 'Lead Cost', amount: '', note: '', lead_count: '', vendor: '' })

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
      const [{ data: profs }, { data: pl }, { data: ex }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('policy_log').select('agent_id,apv,status,comp_percent,advance_rate,commission_paid,commission_status,date_written,carrier'),
        supabase.from('expenses').select('*'),
      ])
      setAgents(profs || [])
      setDownline((profs || []).filter(a => a.manager_id === p!.id))
      setPols((pl || []) as Pol[])
      setExpenses((ex || []) as Expense[])
    })
  }, [router])

  async function addExpense() {
    if (!me || !form.amount) return
    const isLead = form.category === 'Lead Cost'
    const { data } = await supabase.from('expenses').insert({
      agent_id: me.id, agent_name: me.name, date: form.date, category: form.category, amount: Number(form.amount) || 0, note: form.note,
      lead_count: isLead && form.lead_count ? Number(form.lead_count) || null : null,
      vendor: isLead && form.vendor ? form.vendor : null,
    }).select().single()
    if (data) { setExpenses(e => [...e, data as Expense]); toast('Expense added', 'success') }
    setForm({ date: localDate(), category: 'Lead Cost', amount: '', note: '', lead_count: '', vendor: '' }); setShowAdd(false)
  }
  async function delExpense(id: string) {
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(e => e.filter(x => x.id !== id))
  }

  if (!me) return <Loading />

  const isManager = downline.length > 0 || me.role === 'manager'
  const teamIds = new Set([me.id, ...downline.map(a => a.id)])
  const ids = scope === 'team' ? teamIds : new Set([me.id])

  const now = new Date()
  const inPeriod = (dateStr: string) => {
    const d = new Date(dateStr)
    if (period === 'ytd') return d.getFullYear() === now.getFullYear()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }

  const scopePols = pols.filter(p => ids.has(p.agent_id) && p.status === 'Issued' && inPeriod(p.date_written))
  const scopeExp = expenses.filter(e => ids.has(e.agent_id) && inPeriod(e.date))

  const income = scopePols.reduce((s, p) => s + (p.commission_paid || advance(p)), 0)
  const totalExp = scopeExp.reduce((s, e) => s + e.amount, 0)
  const net = income - totalExp
  const byCat = CATEGORIES.map(c => ({ cat: c, total: scopeExp.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0) })).filter(c => c.total > 0)
  const myExpenses = expenses.filter(e => e.agent_id === me.id && inPeriod(e.date)).sort((a, b) => b.date.localeCompare(a.date))

  // Per-agent P&L (team view)
  const nameOf = (id: string) => agents.find(a => a.id === id)?.name || 'Agent'
  const agentPnl = [...ids].map(id => {
    const inc = scopePols.filter(p => p.agent_id === id).reduce((s, p) => s + (p.commission_paid || advance(p)), 0)
    const exp = scopeExp.filter(e => e.agent_id === id).reduce((s, e) => s + e.amount, 0)
    return { id, name: nameOf(id), income: inc, expenses: exp, net: inc - exp }
  }).filter(r => r.income > 0 || r.expenses > 0).sort((a, b) => b.net - a.net)

  // ----- Lead ROI ----- (return = paid commission ÷ lead spend)
  const leadExp = scopeExp.filter(e => e.category === 'Lead Cost')
  const leadSpend = leadExp.reduce((s, e) => s + e.amount, 0)
  const leadsBought = leadExp.reduce((s, e) => s + (e.lead_count || 0), 0)
  const salesCount = scopePols.length // issued policies in period
  const roiPct = leadSpend > 0 ? Math.round((income / leadSpend) * 100) : null
  const costPerLead = leadsBought > 0 ? leadSpend / leadsBought : null
  const costPerSale = salesCount > 0 ? leadSpend / salesCount : null
  const closeOnLeads = leadsBought > 0 ? Math.round((salesCount / leadsBought) * 100) : null
  // ROI broken out by vendor
  const vendorMap = new Map<string, { spend: number; leads: number }>()
  leadExp.forEach(e => {
    const v = e.vendor || 'Unspecified'
    const cur = vendorMap.get(v) || { spend: 0, leads: 0 }
    cur.spend += e.amount; cur.leads += e.lead_count || 0
    vendorMap.set(v, cur)
  })
  const byVendor = [...vendorMap.entries()].map(([vendor, v]) => ({
    vendor, spend: v.spend, leads: v.leads,
    cpl: v.leads > 0 ? v.spend / v.leads : null,
  })).sort((a, b) => b.spend - a.spend)

  // Manager overrides: your spread × each downline agent's submitted AP this period
  const myLevel = me.contract_level ?? 80
  const levelOf = (id: string) => agents.find(a => a.id === id)?.contract_level ?? 80
  const overrides = downline.map(a => {
    const subAP = pols.filter(p => p.agent_id === a.id && ['Submitted', 'Approved', 'Issued'].includes(p.status) && inPeriod(p.date_written)).reduce((s, p) => s + p.apv, 0)
    const spread = Math.max(0, myLevel - levelOf(a.id))
    return { id: a.id, name: a.name, level: levelOf(a.id), spread, subAP, override: subAP * (spread / 100) }
  }).filter(r => r.override > 0).sort((a, b) => b.override - a.override)
  const overrideTotal = overrides.reduce((s, r) => s + r.override, 0)

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={me.name} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <DollarSign size={28} className="text-yellow-500" />
            <div>
              <h1 className="text-3xl font-black text-white">Deposits & P&L</h1>
              <p className="text-gray-500 mt-0.5">Commission income vs business expenses</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="inline-flex gap-1 bg-gray-900 rounded-xl p-1">
              <button onClick={() => setPeriod('month')} className={clsx('px-3 py-1.5 rounded-lg text-sm font-bold transition', period === 'month' ? 'gold-gradient text-black' : 'text-gray-400')}>This Month</button>
              <button onClick={() => setPeriod('ytd')} className={clsx('px-3 py-1.5 rounded-lg text-sm font-bold transition', period === 'ytd' ? 'gold-gradient text-black' : 'text-gray-400')}>YTD</button>
            </div>
            {isManager && (
              <div className="inline-flex gap-1 bg-gray-900 rounded-xl p-1">
                <button onClick={() => setScope('mine')} className={clsx('px-3 py-1.5 rounded-lg text-sm font-bold transition', scope === 'mine' ? 'gold-gradient text-black' : 'text-gray-400')}>Mine</button>
                <button onClick={() => setScope('team')} className={clsx('px-3 py-1.5 rounded-lg text-sm font-bold transition', scope === 'team' ? 'gold-gradient text-black' : 'text-gray-400')}>Team</button>
              </div>
            )}
          </div>
        </div>

        {/* P&L cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-green-400" /><p className="text-xs text-gray-500 uppercase tracking-wider">Commission Income</p></div>
            <p className="text-2xl font-black text-green-400">{fmt(income)}</p>
            <p className="text-xs text-gray-600 mt-1">{scopePols.length} issued policies</p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-1"><TrendingDown size={14} className="text-red-400" /><p className="text-xs text-gray-500 uppercase tracking-wider">Expenses</p></div>
            <p className="text-2xl font-black text-red-400">{fmt(totalExp)}</p>
            <p className="text-xs text-gray-600 mt-1">{scopeExp.length} entries</p>
          </div>
          <div className={clsx('rounded-xl p-5 border', net >= 0 ? 'bg-green-500/10 border-green-700/40' : 'bg-red-500/10 border-red-700/40')}>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Net Profit</p>
            <p className={clsx('text-2xl font-black', net >= 0 ? 'text-green-400' : 'text-red-400')}>{fmt(net)}</p>
            <p className="text-xs text-gray-600 mt-1">{income > 0 ? `${Math.round((net / income) * 100)}% margin` : '—'}</p>
          </div>
        </div>

        {/* Lead ROI */}
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider">Lead ROI</h2>
            <span className="text-xs text-gray-600">Return = paid commission ÷ lead spend</span>
          </div>
          {leadSpend === 0 ? (
            <p className="text-sm text-gray-600">No lead spend logged this period. Add a <span className="text-gray-400">Lead Cost</span> expense below (set the # of leads) to track ROI.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {[
                  { l: 'ROI', v: roiPct !== null ? `${roiPct}%` : '—', c: (roiPct ?? 0) >= 100 ? 'text-green-400' : 'text-red-400' },
                  { l: 'Lead Spend', v: fmt(leadSpend), c: 'text-red-400' },
                  { l: 'Commission', v: fmt(income), c: 'text-green-400' },
                  { l: 'Net on Leads', v: fmt(income - leadSpend), c: (income - leadSpend) >= 0 ? 'text-green-400' : 'text-red-400' },
                ].map(c => (
                  <div key={c.l} className="bg-black/30 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{c.l}</p>
                    <p className={clsx('text-xl font-black', c.c)}>{c.v}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center">
                {[
                  ['Leads Bought', leadsBought ? leadsBought.toLocaleString() : '—'],
                  ['Cost / Lead', costPerLead !== null ? `$${costPerLead.toFixed(2)}` : '—'],
                  ['Cost / Sale', costPerSale !== null ? `$${costPerSale.toFixed(0)}` : '—'],
                  ['Lead→Sale %', closeOnLeads !== null ? `${closeOnLeads}%` : '—'],
                ].map(([l, v]) => (
                  <div key={l} className="border border-gray-800 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{l}</p>
                    <p className="text-lg font-black text-white">{v}</p>
                  </div>
                ))}
              </div>
              {byVendor.length > 1 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        {['Vendor', 'Spend', 'Leads', 'Cost / Lead'].map((h, i) => (
                          <th key={h} className={clsx('px-3 py-2 text-xs text-gray-500 uppercase tracking-wider font-medium', i === 0 ? 'text-left' : 'text-right')}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {byVendor.map(v => (
                        <tr key={v.vendor} className="border-b border-gray-900">
                          <td className="px-3 py-2 text-white">{v.vendor}</td>
                          <td className="px-3 py-2 text-right text-red-400">{fmt(v.spend)}</td>
                          <td className="px-3 py-2 text-right text-gray-300">{v.leads || '—'}</td>
                          <td className="px-3 py-2 text-right text-gray-300">{v.cpl !== null ? `$${v.cpl.toFixed(2)}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-[11px] text-gray-600 mt-3">ROI compares total paid commission this period against lead spend (issued-policy commission). Lead spend is also counted in Expenses above, so Net Profit already reflects it.</p>
            </>
          )}
        </div>

        {/* Per-agent P&L (team view) */}
        {scope === 'team' && isManager && (
          <div className="card overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-gray-800">
              <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider">P&L by Agent</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Agent', 'Income', 'Expenses', 'Net'].map((h, i) => (
                    <th key={h} className={clsx('px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium', i === 0 ? 'text-left' : 'text-right')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agentPnl.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-600">No team activity in this period.</td></tr>
                ) : agentPnl.map(r => (
                  <tr key={r.id} className="border-b border-gray-900 hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-medium text-white">{r.name} {r.id === me.id && <span className="text-xs text-yellow-600">(You)</span>}</td>
                    <td className="px-4 py-3 text-right text-green-400 font-medium">{fmt(r.income)}</td>
                    <td className="px-4 py-3 text-right text-red-400">{fmt(r.expenses)}</td>
                    <td className={clsx('px-4 py-3 text-right font-black', r.net >= 0 ? 'text-green-400' : 'text-red-400')}>{fmt(r.net)}</td>
                  </tr>
                ))}
              </tbody>
              {agentPnl.length > 0 && (
                <tfoot>
                  <tr className="border-t border-gray-700 bg-white/5">
                    <td className="px-4 py-3 font-black text-white">Team Total</td>
                    <td className="px-4 py-3 text-right font-black text-green-400">{fmt(income)}</td>
                    <td className="px-4 py-3 text-right font-black text-red-400">{fmt(totalExp)}</td>
                    <td className={clsx('px-4 py-3 text-right font-black', net >= 0 ? 'text-green-400' : 'text-red-400')}>{fmt(net)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Team overrides (manager spread) */}
        {scope === 'team' && isManager && overrides.length > 0 && (
          <div className="card overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider">Your Overrides</h2>
              <span className="text-xs text-gray-500">Your level: <span className="text-gray-300 font-bold">{myLevel}</span></span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Agent', 'Level', 'Spread', 'Submitted AP', 'Override'].map((h, i) => (
                    <th key={h} className={clsx('px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium', i === 0 ? 'text-left' : 'text-right')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overrides.map(r => (
                  <tr key={r.id} className="border-b border-gray-900 hover:bg-white/5 transition cursor-pointer" onClick={() => router.push(`/agents/${r.id}`)}>
                    <td className="px-4 py-3 font-medium text-white">{r.name}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{r.level}</td>
                    <td className="px-4 py-3 text-right text-teal-400 font-medium">{r.spread} pts</td>
                    <td className="px-4 py-3 text-right text-gray-300">{fmt(r.subAP)}</td>
                    <td className="px-4 py-3 text-right font-black text-green-400">{fmt(r.override)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-700 bg-white/5">
                  <td className="px-4 py-3 font-black text-white" colSpan={4}>Total Override</td>
                  <td className="px-4 py-3 text-right font-black text-green-400">{fmt(overrideTotal)}</td>
                </tr>
              </tfoot>
            </table>
            <p className="px-5 py-3 text-[11px] text-gray-600">Set each agent's contract level on their profile. Override = your spread × their submitted AP for this period.</p>
          </div>
        )}

        {/* Category breakdown */}
        {byCat.length > 0 && (
          <div className="card p-5 mb-6">
            <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-3">Expenses by Category</h2>
            <div className="space-y-2">
              {byCat.map(c => (
                <div key={c.cat}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">{c.cat}</span><span className="text-white font-bold">{fmt(c.total)}</span></div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-red-500/60" style={{ width: `${totalExp > 0 ? (c.total / totalExp) * 100 : 0}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expense ledger */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider">My Expenses</h2>
            <button onClick={() => setShowAdd(s => !s)} className="flex items-center gap-1 gold-gradient text-black font-bold px-3 py-1.5 rounded-lg text-sm hover:opacity-90">
              <Plus size={14} /> {showAdd ? 'Cancel' : 'Add Expense'}
            </button>
          </div>
          {showAdd && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="bg-black border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-yellow-500" />
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="bg-black border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-yellow-500">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input type="number" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount"
                  className="w-full bg-black border border-gray-700 rounded-lg pl-6 pr-2 py-2 text-white text-sm focus:outline-none focus:border-yellow-500" />
              </div>
              <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Note"
                className="bg-black border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-yellow-500" />
              <button onClick={addExpense} className="gold-gradient text-black font-bold rounded-lg py-2 text-sm hover:opacity-90">Add</button>
              {form.category === 'Lead Cost' && (
                <div className="col-span-2 sm:col-span-5 grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <input type="number" min="0" value={form.lead_count} onChange={e => setForm(f => ({ ...f, lead_count: e.target.value }))} placeholder="# of leads"
                    className="bg-black border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-yellow-500" />
                  <input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder="Vendor (e.g. Lead Co.)"
                    className="sm:col-span-2 bg-black border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-yellow-500" />
                  <p className="sm:col-span-2 text-[11px] text-gray-600 self-center">A weekly standing order = one entry: total cost + how many leads it bought.</p>
                </div>
              )}
            </div>
          )}
          {myExpenses.length === 0 ? (
            <p className="text-xs text-gray-600">No expenses logged this period.</p>
          ) : (
            <div className="space-y-1.5">
              {myExpenses.map(e => (
                <div key={e.id} className="flex items-center justify-between text-sm border-b border-gray-900 pb-1.5 last:border-0">
                  <div>
                    <span className="text-white">{e.category}</span>
                    {e.vendor && <span className="text-gray-500"> · {e.vendor}</span>}
                    {e.lead_count ? <span className="text-gray-600"> · {e.lead_count} leads</span> : null}
                    {e.note && <span className="text-gray-600"> · {e.note}</span>}
                    <span className="text-gray-700 text-xs ml-2">{new Date(e.date + 'T00:00:00').toLocaleDateString()}</span>
                  </div>
                  <span className="flex items-center gap-3"><span className="text-red-400 font-bold">{fmt(e.amount)}</span>
                    <button onClick={() => delExpense(e.id)} className="text-gray-600 hover:text-red-400"><Trash2 size={13} /></button></span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-600 mt-4">Income = commission advances on issued policies. Log monthly earned/advance details on the <a href="/entry" className="text-yellow-500 hover:underline">monthly entry page →</a></p>
      </div>
    </div>
  )
}
