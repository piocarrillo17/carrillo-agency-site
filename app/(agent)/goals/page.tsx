'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import { Circle, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import { localDate } from '@/lib/date'

type Profile = { id: string; name: string }
type Goal = {
  target_apps: number; target_ap: number; target_income: number; target_dials: number
  daily_dials: number; daily_appts: number; daily_shares: number
}
type Today = { dials: number; contacts: number; appts: number; sales: number; shares: number }
type Pol = { apv: number; status: string; commission_paid: number; commission_status: string; comp_percent: number; advance_rate: number }

const today = () => localDate()
const blankGoal: Goal = { target_apps: 0, target_ap: 0, target_income: 0, target_dials: 0, daily_dials: 0, daily_appts: 0, daily_shares: 0 }
const fmt = (n: number) => `$${(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`

export default function GoalsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tab, setTab] = useState<'checklist' | 'goals'>('checklist')
  const [goal, setGoal] = useState<Goal>(blankGoal)
  const [todayAct, setTodayAct] = useState<Today>({ dials: 0, contacts: 0, appts: 0, sales: 0, shares: 0 })
  const [policies, setPolicies] = useState<Pol[]>([])
  const [form, setForm] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const year = new Date().getFullYear()
  const month = new Date().getMonth() + 1

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('id,name').eq('id', session.user.id).single()
      setProfile(p)
      const [{ data: g }, { data: a }, { data: pol }] = await Promise.all([
        supabase.from('goals').select('*').eq('agent_id', session.user.id).eq('year', year).eq('month', month).single(),
        supabase.from('daily_activity').select('dials,contacts,appts,sales,shares').eq('agent_id', session.user.id).eq('date', today()).single(),
        supabase.from('policy_log').select('apv,status,commission_paid,commission_status,comp_percent,advance_rate').eq('agent_id', session.user.id).eq('year', year).eq('month', month),
      ])
      const gg = { ...blankGoal, ...(g || {}) }
      setGoal(gg)
      setForm({
        target_apps: String(gg.target_apps || ''), target_ap: String(gg.target_ap || ''),
        target_income: String(gg.target_income || ''), target_dials: String(gg.target_dials || ''),
        daily_dials: String(gg.daily_dials || ''), daily_appts: String(gg.daily_appts || ''), daily_shares: String(gg.daily_shares || ''),
      })
      if (a) setTodayAct({ dials: a.dials || 0, contacts: a.contacts || 0, appts: a.appts || 0, sales: a.sales || 0, shares: a.shares || 0 })
      setPolicies((pol || []) as Pol[])
      setLoading(false)
    })
  }, [router, year, month])

  async function saveGoals() {
    if (!profile) return
    const payload = {
      agent_id: profile.id, year, month,
      target_apps: Number(form.target_apps) || 0, target_ap: Number(form.target_ap) || 0,
      target_income: Number(form.target_income) || 0, target_dials: Number(form.target_dials) || 0,
      daily_dials: Number(form.daily_dials) || 0, daily_appts: Number(form.daily_appts) || 0, daily_shares: Number(form.daily_shares) || 0,
    }
    await supabase.from('goals').upsert(payload, { onConflict: 'agent_id,year,month' })
    setGoal(g => ({ ...g, ...payload }))
    setSaved(true); setTimeout(() => setSaved(false), 1800)
  }

  function setMetricLocal(metric: 'dials' | 'appts' | 'shares', value: string) {
    setTodayAct(t => ({ ...t, [metric]: Math.max(0, Number(value) || 0) }))
  }
  async function commitMetric(next: Today) {
    if (!profile) return
    await supabase.from('daily_activity').upsert({
      agent_id: profile.id, agent_name: profile.name, date: today(),
      dials: next.dials, contacts: next.contacts, appts: next.appts, sales: next.sales, shares: next.shares,
    }, { onConflict: 'agent_id,date' })
  }

  if (loading || !profile) return <Loading />

  // ----- Monthly production for the progress bars -----
  const written = (s: string) => ['Submitted', 'Approved', 'Issued'].includes(s)
  const projComm = (p: Pol) => p.apv * ((p.comp_percent ?? 100) / 100) * ((p.advance_rate ?? 75) / 100)
  const monthApps = policies.length
  const monthSubAP = policies.filter(p => written(p.status)).reduce((s, p) => s + p.apv, 0)
  const monthIncome = policies.filter(p => p.commission_status === 'Paid').reduce((s, p) => s + (p.commission_paid || projComm(p)), 0)

  const monthName = new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const todayLabel = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })

  const checklist = [
    { key: 'dials' as const, label: 'Dials per Day', done: todayAct.dials, target: goal.daily_dials },
    { key: 'appts' as const, label: 'Appointments per Day', done: todayAct.appts, target: goal.daily_appts },
    { key: 'shares' as const, label: 'Sharing Opportunities', done: todayAct.shares, target: goal.daily_shares },
  ]

  const progress = [
    { label: 'Apps Written', cur: monthApps, target: goal.target_apps, money: false },
    { label: 'Submitted AP', cur: monthSubAP, target: goal.target_ap, money: true },
    { label: 'Income', cur: monthIncome, target: goal.target_income, money: true },
    { label: 'Dials (Today)', cur: todayAct.dials, target: goal.target_dials, money: false },
  ]

  const tabs = [['checklist', 'Daily Checklist'], ['goals', 'Monthly Goals']] as const
  const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none'
  const inputStyle = { background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--fg)' } as const
  const labelStyle = { color: 'var(--fg-muted)' } as const

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={profile.name} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black mb-5" style={{ color: 'var(--fg)' }}>Goals &amp; Daily Plan</h1>

        {/* Tabs */}
        <div className="inline-flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'var(--card-bg-2)', border: '1px solid var(--card-border)' }}>
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={clsx('px-5 py-2 rounded-lg text-sm font-bold transition', tab === k ? 'ring-1' : '')}
              style={tab === k
                ? { background: 'var(--card-bg)', color: 'var(--fg)', boxShadow: '0 1px 2px rgba(0,0,0,0.08)', borderColor: 'rgba(212,160,23,0.5)' }
                : { color: 'var(--fg-muted)' }}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'checklist' ? (
          <div className="space-y-6">
            {/* Today's checklist */}
            <div className="card p-6">
              <h2 className="text-lg font-black mb-4" style={{ color: 'var(--fg)' }}>Today&apos;s Checklist — {todayLabel}</h2>
              <div>
                {checklist.map((it, i) => {
                  const met = it.target > 0 && it.done >= it.target
                  return (
                    <div key={it.key} className={clsx('flex items-center gap-3 py-3', i > 0 && 'border-t')} style={i > 0 ? { borderColor: 'var(--divider)' } : undefined}>
                      {met
                        ? <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                        : <Circle size={20} className="flex-shrink-0" style={{ color: 'var(--fg-subtle)' }} />}
                      <span className="flex-1 font-bold" style={{ color: 'var(--fg)' }}>{it.label}</span>
                      <input type="number" min="0" inputMode="numeric" value={it.done || ''}
                        onChange={e => setMetricLocal(it.key, e.target.value)}
                        onBlur={() => commitMetric(todayAct)}
                        className="w-14 bg-transparent text-right font-black text-lg focus:outline-none"
                        style={{ color: 'var(--fg)' }} placeholder="0" />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Set daily targets */}
            <div className="card p-6">
              <h2 className="text-lg font-black mb-4" style={{ color: 'var(--fg)' }}>Set Daily Targets</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {([['daily_dials', 'Dials/Day'], ['daily_appts', 'Appts/Day'], ['daily_shares', 'Shares/Day']] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1.5" style={labelStyle}>{label}</label>
                    <input type="number" value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className={inputCls} style={inputStyle} placeholder="0" />
                  </div>
                ))}
              </div>
              <button onClick={saveGoals} className="gold-gradient text-black font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition mt-5">
                {saved ? '✓ Saved' : 'Save Daily Targets'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress */}
            <div className="card p-6">
              <h2 className="text-lg font-black mb-5" style={{ color: 'var(--fg)' }}>Progress — {monthName}</h2>
              <div className="space-y-5">
                {progress.map(p => {
                  const has = p.target > 0
                  const pct = has ? Math.min(100, Math.round((p.cur / p.target) * 100)) : 0
                  return (
                    <div key={p.label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-bold" style={{ color: 'var(--fg)' }}>{p.label}</span>
                        <span style={{ color: 'var(--fg-muted)' }}>
                          {p.money ? fmt(p.cur) : p.cur} / {has ? (p.money ? fmt(p.target) : p.target) : 'no target'}
                          {has && <span className="gold-text font-bold ml-2">{pct}%</span>}
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                        <div className="h-full gold-gradient rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Set monthly goals */}
            <div className="card p-6">
              <h2 className="text-lg font-black mb-4" style={{ color: 'var(--fg)' }}>Set Monthly Goals</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([['target_apps', 'Apps Target'], ['target_ap', 'AP Target ($)'], ['target_income', 'Income Target ($)'], ['target_dials', 'Monthly Dials']] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1.5" style={labelStyle}>{label}</label>
                    <input type="number" value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className={inputCls} style={inputStyle} placeholder="0" />
                  </div>
                ))}
              </div>
              <button onClick={saveGoals} className="gold-gradient text-black font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition mt-5">
                {saved ? '✓ Saved' : 'Save Goals'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
