'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Entry } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import StatCard from '@/components/StatCard'
import AchievementToast from '@/components/AchievementToast'
import clsx from 'clsx'
import { BADGES, BADGE_MAP, TIER_STYLE, earnedBadgeKeys, isoWeekKey, type BadgeDef } from '@/lib/badges'
import { localDate } from '@/lib/date'
import { commissionableAP } from '@/lib/constants'
import { hourlyVerse } from '@/lib/verses'
import { usePresence } from '@/lib/usePresence'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const fmtFull = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

type PolicyRow = {
  id: string; apv: number; status: string; year: number; month: number; date_written?: string
  comp_percent: number; advance_rate: number; commission_paid: number; commission_status: string; carrier?: string
}

type Goal = { target_apps: number; target_ap: number; target_income: number; target_dials: number }

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{ id: string; name: string } | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [policies, setPolicies] = useState<PolicyRow[]>([])
  const [goal, setGoal] = useState<Goal | null>(null)
  const [goalForm, setGoalForm] = useState({ target_apps: '', target_ap: '', target_income: '', target_dials: '' })
  const [showGoalEdit, setShowGoalEdit] = useState(false)
  const [year] = useState(new Date().getFullYear())
  const [month] = useState(new Date().getMonth() + 1)
  const [activity, setActivity] = useState<{ date: string; dials: number; contacts: number; appts: number; sales: number }[]>([])
  const [todayAppts, setTodayAppts] = useState<{ id: string; name: string; appt_date: string; appt_type?: string; disposition: string; phone: string }[]>([])
  const [overdueCallbacks, setOverdueCallbacks] = useState<{ id: string; name: string; appt_date: string; disposition: string; phone: string }[]>([])
  const [hotFollowUps, setHotFollowUps] = useState<{ id: string; name: string; appt_date: string; disposition: string; phone: string }[]>([])
  const [earnedKeys, setEarnedKeys] = useState<string[]>([])
  const [newBadges, setNewBadges] = useState<BadgeDef[]>([])

  useEffect(() => {
    // Safety net only — long enough not to bounce a slow (free-tier) session.
    const authTimeout = setTimeout(() => router.replace('/login'), 15000)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(authTimeout)
      if (!session) { router.push('/login'); return }
      const fallbackName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Agent'
      let { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!p) {
        await supabase.from('profiles').insert({ id: session.user.id, name: fallbackName, email: session.user.email, role: 'agent' })
        const { data: p2 } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        p = p2
      }
      // Never hang on a blank screen — render with a minimal profile if the row couldn't load
      setProfile(p || { id: session.user.id, name: fallbackName })

      const todayStr = localDate()
      const startOfDay = todayStr + 'T00:00:00'
      const endOfDay = todayStr + 'T23:59:59'
      const [{ data: e }, { data: pol }, { data: g }, { data: act }, { data: appts }, { data: callbacks }, { data: followUps }] = await Promise.all([
        supabase.from('entries').select('*').eq('agent_id', session.user.id).eq('year', year).order('month'),
        supabase.from('policy_log').select('id,apv,status,year,month,date_written,comp_percent,advance_rate,commission_paid,commission_status,carrier').eq('agent_id', session.user.id).eq('year', year),
        supabase.from('goals').select('*').eq('agent_id', session.user.id).eq('year', year).eq('month', month).single(),
        supabase.from('daily_activity').select('date,dials,contacts,appts,sales').eq('agent_id', session.user.id).gte('date', `${year}-01-01`),
        supabase.from('leads').select('id,name,appt_date,appt_type,disposition,phone').eq('agent_id', session.user.id).gte('appt_date', startOfDay).lte('appt_date', endOfDay).eq('is_dead', false).order('appt_date'),
        // Overdue callbacks: "Wants callback" with a past appt_date
        supabase.from('leads').select('id,name,appt_date,disposition,phone').eq('agent_id', session.user.id).eq('disposition', 'Wants callback').lt('appt_date', startOfDay).eq('is_dead', false).order('appt_date'),
        // Follow-ups due today: Sit Follow Up / Sit - Follow Up with appt today
        supabase.from('leads').select('id,name,appt_date,disposition,phone').eq('agent_id', session.user.id).in('disposition', ['Sit - Follow Up', 'Sit Follow Up']).gte('appt_date', startOfDay).lte('appt_date', endOfDay).eq('is_dead', false).order('appt_date'),
      ])
      setEntries(e || [])
      setPolicies(pol || [])
      setActivity(act || [])
      setTodayAppts(appts || [])
      setOverdueCallbacks(callbacks || [])
      setHotFollowUps(followUps || [])

      // ---- Achievements: compute stats, award any newly-earned badges ----
      try {
        const pols = pol || []
        const acts = act || []
        const written = (s: string) => ['Submitted', 'Approved', 'Issued'].includes(s)
        // best week / month AP (written business)
        const weekAP: Record<string, number> = {}
        const monthAP: Record<number, number> = {}
        for (const p of pols) {
          if (!written(p.status)) continue
          if (p.date_written) { const k = isoWeekKey(new Date(p.date_written)); weekAP[k] = (weekAP[k] || 0) + p.apv }
          monthAP[p.month] = (monthAP[p.month] || 0) + p.apv
        }
        // dials per day / week
        const weekDials: Record<string, number> = {}
        let maxDailyDials = 0
        for (const a of acts) {
          maxDailyDials = Math.max(maxDailyDials, a.dials || 0)
          const k = isoWeekKey(new Date(a.date)); weekDials[k] = (weekDials[k] || 0) + (a.dials || 0)
        }
        const stats = {
          issuedPolicies: pols.filter(p => ['Approved', 'Issued'].includes(p.status)).length,
          bestWeekAP: Math.max(0, ...Object.values(weekAP)),
          bestMonthAP: Math.max(0, ...Object.values(monthAP)),
          maxDailyDials,
          maxWeeklyDials: Math.max(0, ...Object.values(weekDials)),
        }
        const qualified = earnedBadgeKeys(stats)
        setEarnedKeys(qualified)
        const { data: existing } = await supabase.from('achievements').select('badge_key').eq('agent_id', session.user.id)
        const have = new Set((existing || []).map((r: any) => r.badge_key))
        const toAward = qualified.filter(k => !have.has(k))
        if (toAward.length) {
          await supabase.from('achievements').insert(
            toAward.map(k => ({ agent_id: session.user.id, agent_name: p?.name || 'Agent', badge_key: k }))
          )
          // Don't pop the animation on the very first load for a brand-new agent's backlog;
          // only celebrate if they already had some badges (i.e. a genuine new unlock this session)
          if (have.size > 0) setNewBadges(toAward.map(k => BADGE_MAP[k]).filter(Boolean))
        }
      } catch { /* achievements table may not exist yet — ignore */ }
      if (g) {
        setGoal(g)
        setGoalForm({ target_apps: String(g.target_apps || ''), target_ap: String(g.target_ap || ''), target_income: String(g.target_income || ''), target_dials: String(g.target_dials || '') })
      }
    })
  }, [router, year, month])

  async function saveGoal() {
    if (!profile) return
    const payload = {
      agent_id: profile.id, year, month,
      target_apps: Number(goalForm.target_apps) || 0,
      target_ap: Number(goalForm.target_ap) || 0,
      target_income: Number(goalForm.target_income) || 0,
      target_dials: Number(goalForm.target_dials) || 0,
    }
    await supabase.from('goals').upsert(payload, { onConflict: 'agent_id,year,month' })
    setGoal(payload)
    setShowGoalEdit(false)
  }

  // Inline activity logging from the dashboard — saves to daily_activity like the Dial Tracker
  async function bumpActivity(key: 'dials' | 'contacts' | 'appts' | 'sales', delta: number) {
    if (!profile) return
    const todayStr = localDate()
    const exists = activity.find(a => a.date === todayStr)
    const cur = exists || { date: todayStr, dials: 0, contacts: 0, appts: 0, sales: 0 }
    const next = { ...cur, [key]: Math.max(0, (cur as any)[key] + delta) }
    setActivity(prev => exists ? prev.map(a => a.date === todayStr ? next : a) : [...prev, next])
    await supabase.from('daily_activity').upsert({
      agent_id: profile.id, agent_name: profile.name, date: todayStr,
      dials: next.dials, contacts: next.contacts, appts: next.appts, sales: next.sales,
    }, { onConflict: 'agent_id,date' })
  }

  usePresence(profile?.id)

  if (!profile) return (
    <Loading />
  )

  // Auto-calculated from policy_log
  const calcByMonth = (m: number) => {
    const mp = policies.filter(p => p.month === m)
    return {
      apps: mp.length,
      submittedAP: mp.filter(p => ['Submitted','Approved','Issued'].includes(p.status)).reduce((s,p) => s + p.apv, 0),
      issuedAP: mp.filter(p => ['Approved','Issued'].includes(p.status)).reduce((s,p) => s + p.apv, 0),
      chargebacks: mp.filter(p => p.status === 'Chargeback').reduce((s,p) => s + p.apv, 0),
      policies: mp.filter(p => ['Approved','Issued'].includes(p.status)).length,
    }
  }

  // Commission projection used for this month's income
  const projComm = (p: PolicyRow) => commissionableAP(p.apv, p.carrier) * ((p.comp_percent ?? 100) / 100) * ((p.advance_rate ?? 75) / 100)

  // Current month progress vs goals
  const curMonth = {
    apps: policies.filter(p => p.month === month).length,
    ap: policies.filter(p => p.month === month && ['Submitted','Approved','Issued'].includes(p.status)).reduce((s, p) => s + p.apv, 0),
    income: policies.filter(p => p.month === month && p.commission_status === 'Paid').reduce((s, p) => s + (p.commission_paid || projComm(p)), 0),
    dials: activity.filter(a => new Date(a.date).getMonth() + 1 === month).reduce((s, a) => s + a.dials, 0),
  }
  const pct = (cur: number, target: number) => target > 0 ? Math.min(100, Math.round((cur / target) * 100)) : 0
  const monthData = calcByMonth(month)
  const monthName = new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long' })

  // ---- TODAY ---- (this whole view renders client-side after auth, so dates are local)
  const todayStr = localDate()
  const todayAct = activity.find(a => a.date === todayStr) || { dials: 0, contacts: 0, appts: 0, sales: 0 }
  const hustleToday = todayAct.dials * 1 + todayAct.contacts * 3 + todayAct.appts * 8 + todayAct.sales * 25
  const firstName = profile.name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Good evening' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const verse = hourlyVerse()

  const ACT = [
    { key: 'dials' as const, label: 'Dials' },
    { key: 'contacts' as const, label: 'Contacts' },
    { key: 'appts' as const, label: 'Appointments' },
    { key: 'sales' as const, label: 'Sales' },
  ]
  const GOAL_ROWS = [
    { key: 'target_apps' as const, label: 'Apps', cur: curMonth.apps, money: false },
    { key: 'target_ap' as const, label: 'AP', cur: curMonth.ap, money: true },
    { key: 'target_income' as const, label: 'Income', cur: curMonth.income, money: true },
    { key: 'target_dials' as const, label: 'Dials', cur: curMonth.dials, money: false },
  ]
  const statCards = [
    { e: '📝', v: String(monthData.apps), l: 'Apps Written' },
    { e: '📤', v: fmt(monthData.submittedAP), l: 'Submitted AP' },
    { e: '✅', v: fmt(monthData.issuedAP), l: 'Issued AP' },
    { e: '💰', v: fmt(curMonth.income), l: 'Est. Income' },
  ]

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      {newBadges.length > 0 && <AchievementToast badges={newBadges} onDone={() => setNewBadges([])} />}
      <Sidebar agentName={profile.name} />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-3xl font-black" style={{ color: 'var(--fg)' }}>
            {greeting}, <span className="gold-text">{firstName}</span> 👋
          </h1>
          <p className="mt-1" style={{ color: 'var(--fg-muted)' }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Verse */}
        <div className="card-gold p-4 mb-6">
          <p className="text-sm italic" style={{ color: 'var(--fg)' }}>“{verse.text}” <span className="not-italic" style={{ color: 'var(--fg-muted)' }}>— {verse.ref}</span></p>
        </div>

        {/* Today's Activity — inline steppers */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black" style={{ color: 'var(--fg)' }}>Today's Activity</h2>
            <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'var(--active-bg)', color: 'var(--active-fg)' }}>⚡ {hustleToday} Hustle</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {ACT.map(a => (
              <div key={a.key} className="text-center">
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--fg-muted)' }}>{a.label}</p>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => bumpActivity(a.key, -1)} aria-label={`decrease ${a.label}`}
                    className="w-9 h-9 rounded-full border flex items-center justify-center text-xl leading-none hover:opacity-70 transition"
                    style={{ borderColor: 'var(--card-border)', color: 'var(--fg-muted)' }}>−</button>
                  <span className="text-3xl font-black w-12 tabular-nums" style={{ color: 'var(--fg)' }}>{todayAct[a.key]}</span>
                  <button onClick={() => bumpActivity(a.key, 1)} aria-label={`increase ${a.label}`}
                    className="w-9 h-9 rounded-full gold-gradient text-black flex items-center justify-center text-xl leading-none font-bold hover:opacity-90 transition">+</button>
                </div>
              </div>
            ))}
          </div>
          <a href="/dials" className="block text-center text-sm font-bold gold-text mt-5 hover:opacity-80">→ Open Full Dial Tracker</a>
        </div>

        {/* This month's production — stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map(c => (
            <div key={c.l} className="card p-5 text-center">
              <div className="text-2xl mb-1">{c.e}</div>
              <div className="text-3xl font-black" style={{ color: 'var(--fg)' }}>{c.v}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>{c.l}</div>
            </div>
          ))}
        </div>

        {/* ── TODAY'S AGENDA ── */}
        {(() => {
          const totalAlerts = overdueCallbacks.length + hotFollowUps.length + todayAppts.length
          return (
            <div className="card p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black flex items-center gap-2" style={{ color: 'var(--fg)' }}>
                  📋 Today's Agenda
                </h2>
                {totalAlerts > 0 && (
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-red-600 text-white">
                    {totalAlerts} action{totalAlerts !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {totalAlerts === 0 ? (
                <p className="text-sm" style={{ color: 'var(--fg-subtle)' }}>
                  Nothing due today — all clear! 🎉 <a href="/leads" className="gold-text font-bold">Browse leads →</a>
                </p>
              ) : (
                <div className="space-y-4">

                  {/* OVERDUE CALLBACKS */}
                  {overdueCallbacks.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                        Overdue Callbacks ({overdueCallbacks.length})
                      </p>
                      <div className="space-y-1.5">
                        {overdueCallbacks.map(a => {
                          const d = new Date(a.appt_date)
                          const daysAgo = Math.floor((Date.now() - d.getTime()) / 86400000)
                          return (
                            <a key={a.id} href={`/leads/${a.id}`}
                              className="flex items-center justify-between rounded-xl px-4 py-3 border border-red-900/60 bg-red-950/30 hover:bg-red-950/50 transition group">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                                  {a.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-bold block text-white">{a.name}</span>
                                  <span className="text-xs text-red-400">Was due {daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {a.phone && (
                                  <a href={`tel:${a.phone.replace(/\D/g, '')}`} onClick={e => e.stopPropagation()}
                                    className="w-8 h-8 rounded-full gold-gradient text-black flex items-center justify-center text-xs font-black flex-shrink-0"
                                    title="Call now">
                                    📞
                                  </a>
                                )}
                                <span className="text-xs text-gray-500 group-hover:text-gray-300 transition">Open →</span>
                              </div>
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* TODAY'S APPOINTMENTS */}
                  {todayAppts.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                        Appointments Today ({todayAppts.length})
                      </p>
                      <div className="space-y-1.5">
                        {todayAppts.map(a => {
                          const t = new Date(a.appt_date)
                          const isPast = t < new Date()
                          const timeStr = t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                          return (
                            <a key={a.id} href={`/leads/${a.id}`}
                              className="flex items-center justify-between rounded-xl px-4 py-3 border hover:opacity-90 transition group"
                              style={{ borderColor: 'rgba(212,160,23,0.35)', background: 'rgba(212,160,23,0.07)' }}>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full gold-gradient text-black flex items-center justify-center text-xs font-black flex-shrink-0">
                                  {a.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-bold block" style={{ color: 'var(--fg)' }}>{a.name}</span>
                                  <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                                    {a.appt_type || a.disposition}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={clsx('text-sm font-black', isPast ? 'text-gray-500 line-through' : 'gold-text')}>{timeStr}</span>
                                {a.phone && (
                                  <a href={`tel:${a.phone.replace(/\D/g, '')}`} onClick={e => e.stopPropagation()}
                                    className="w-8 h-8 rounded-full gold-gradient text-black flex items-center justify-center text-xs font-black flex-shrink-0"
                                    title="Call now">
                                    📞
                                  </a>
                                )}
                              </div>
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* FOLLOW-UPS DUE TODAY */}
                  {hotFollowUps.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                        Follow-Ups Due Today ({hotFollowUps.length})
                      </p>
                      <div className="space-y-1.5">
                        {hotFollowUps.map(a => (
                          <a key={a.id} href={`/leads/${a.id}`}
                            className="flex items-center justify-between rounded-xl px-4 py-3 border border-cyan-900/50 bg-cyan-950/20 hover:bg-cyan-950/40 transition group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-cyan-700 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                                {a.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-white">{a.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {a.phone && (
                                <a href={`tel:${a.phone.replace(/\D/g, '')}`} onClick={e => e.stopPropagation()}
                                  className="w-8 h-8 rounded-full gold-gradient text-black flex items-center justify-center text-xs font-black flex-shrink-0"
                                  title="Call now">
                                  📞
                                </a>
                              )}
                              <span className="text-xs text-gray-500 group-hover:text-gray-300 transition">Open →</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )
        })()}

        {/* Monthly Goals */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black flex items-center gap-2" style={{ color: 'var(--fg)' }}>🎯 Monthly Goals</h2>
            <button onClick={() => setShowGoalEdit(s => !s)} className="flex items-center gap-1 text-sm gold-text font-bold hover:opacity-80">
              ✎ {showGoalEdit ? 'Cancel' : 'Edit'}
            </button>
          </div>
          {showGoalEdit ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {([['target_apps', 'Apps'], ['target_ap', 'AP ($)'], ['target_income', 'Income ($)'], ['target_dials', 'Dials']] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs mb-1" style={{ color: 'var(--fg-muted)' }}>{label}</label>
                  <input type="number" min="0" value={goalForm[key]}
                    onChange={e => setGoalForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--fg)' }} />
                </div>
              ))}
              <button onClick={saveGoal} className="col-span-2 md:col-span-4 gold-gradient text-black font-bold py-2.5 rounded-lg hover:opacity-90 transition mt-1">Save Goals</button>
            </div>
          ) : (
            <div className="space-y-4">
              {GOAL_ROWS.map(g => {
                const target = goal ? (goal[g.key] || 0) : 0
                return (
                  <div key={g.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold" style={{ color: 'var(--fg)' }}>{g.label}</span>
                      <span style={{ color: 'var(--fg-muted)' }}>
                        {g.money ? fmt(g.cur) : g.cur} / {target > 0 ? (g.money ? fmt(target) : target) : 'not set'}
                        {target > 0 && <span className="gold-text font-bold ml-2">{pct(g.cur, target)}%</span>}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                      <div className="h-full gold-gradient rounded-full transition-all" style={{ width: `${target > 0 ? pct(g.cur, target) : 0}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-black" style={{ color: 'var(--fg)' }}>🏆 Achievements</h2>
          <span className="text-xs" style={{ color: 'var(--fg-subtle)' }}>{earnedKeys.length}/{BADGES.length} unlocked</span>
          <div className="flex-1 h-px" style={{ background: 'var(--divider)' }} />
        </div>
        <div className="card p-5 mb-10">
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
            {BADGES.map(b => {
              const earned = earnedKeys.includes(b.key)
              const t = TIER_STYLE[b.tier]
              return (
                <div key={b.key} title={`${b.label} — ${b.desc}`}
                  className={clsx('flex flex-col items-center text-center gap-1 rounded-xl p-2 border transition',
                    earned ? `${t.bg} ${t.ring}` : 'grayscale')}
                  style={earned
                    ? { borderColor: 'var(--card-border)' }
                    : { background: 'var(--card-bg-2)', borderColor: 'var(--card-border)', opacity: 0.7 }}>
                  <span className="text-2xl leading-none">{b.emoji}</span>
                  <span className="text-[10px] font-bold leading-tight" style={{ color: earned ? 'var(--fg)' : 'var(--fg-muted)' }}>{b.label}</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
