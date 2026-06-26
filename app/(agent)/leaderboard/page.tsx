'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import { Trophy, Medal } from 'lucide-react'
import clsx from 'clsx'
import { localDate } from '@/lib/date'

type Period = 'today' | 'week' | 'month' | 'ytd'
type Metric = 'ap' | 'policies' | 'dials' | 'hustle'
type AgentSummary = {
  agent_id: string; agent_name: string
  apps: number; submitted_ap: number; issued_ap: number; policies: number
  dials: number; contacts: number; appts: number; sales: number; hustle: number
}

const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`

function rangeFor(period: Period): { start: string; end: string } {
  const now = new Date()
  const end = localDate(now)
  if (period === 'today') return { start: end, end }
  if (period === 'week') {
    const back = (now.getDay() + 1) % 7 // days since Saturday
    const s = new Date(now); s.setDate(now.getDate() - back)
    return { start: localDate(s), end }
  }
  if (period === 'month') return { start: localDate(new Date(now.getFullYear(), now.getMonth(), 1)), end }
  return { start: localDate(new Date(now.getFullYear(), 0, 1)), end } // ytd
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{ id: string; name: string } | null>(null)
  const [agents, setAgents] = useState<AgentSummary[]>([])
  const [metric, setMetric] = useState<Metric>('ap')
  const [period, setPeriod] = useState<Period>('month')
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      const fallbackName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Agent'
      const { data: p } = await supabase.from('profiles').select('id,name').eq('id', session.user.id).single()
      setProfile(p || { id: session.user.id, name: fallbackName })
    }).catch(() => router.replace('/login'))
  }, [router])

  useEffect(() => {
    let cancelled = false
    setLoadingData(true)
    const { start, end } = rangeFor(period)
    supabase.rpc('leaderboard_stats', { p_start: start, p_end: end }).then(({ data: stats }) => {
      if (cancelled) return
      const rows: AgentSummary[] = (stats || []).map((s: any) => {
        const dials = Number(s.dials) || 0, contacts = Number(s.contacts) || 0, appts = Number(s.appts) || 0, sales = Number(s.sales) || 0
        return {
          agent_id: s.agent_id, agent_name: s.agent_name,
          apps: Number(s.apps) || 0, submitted_ap: Number(s.submitted_ap) || 0, issued_ap: Number(s.issued_ap) || 0,
          policies: Number(s.policies) || 0, dials, contacts, appts, sales,
          hustle: dials * 1 + contacts * 3 + appts * 8 + sales * 25,
        }
      })
      setAgents(rows)
      setLoadingData(false)
    })
    return () => { cancelled = true }
  }, [period])

  const metricVal = (a: AgentSummary) => metric === 'ap' ? a.submitted_ap : metric === 'policies' ? a.policies : metric === 'dials' ? a.dials : a.hustle
  const metricStr = (a: AgentSummary) => metric === 'ap' ? fmt(a.submitted_ap) : metricVal(a).toLocaleString()
  const sorted = [...agents].filter(a => metricVal(a) > 0).sort((a, b) => metricVal(b) - metricVal(a))

  const metricTabs: { key: Metric; label: string }[] = [
    { key: 'ap', label: 'AP' }, { key: 'policies', label: 'Policies' },
    { key: 'dials', label: 'Dials' }, { key: 'hustle', label: 'Hustle' },
  ]
  const periodTabs: { key: Period; label: string }[] = [
    { key: 'today', label: 'Today' }, { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' }, { key: 'ytd', label: 'YTD' },
  ]

  const rankIcon = (i: number) => {
    if (i === 0) return <Trophy size={18} className="text-yellow-400" />
    if (i === 1) return <Medal size={18} className="text-gray-300" />
    if (i === 2) return <Medal size={18} className="text-amber-600" />
    return <span className="text-gray-600 font-bold text-sm w-[18px] text-center">{i + 1}</span>
  }

  // Segmented control styling (matches the mockup: light pill, white active)
  const seg = (active: boolean) => clsx('px-4 py-2 rounded-lg text-sm font-bold transition')
  const segStyle = (active: boolean) => active
    ? { background: 'var(--card-bg)', color: 'var(--fg)', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
    : { color: 'var(--fg-muted)' }

  if (!profile) return <Loading />

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={profile.name} />
      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="mb-6 flex items-center gap-3">
          <Trophy size={28} className="text-yellow-500" />
          <h1 className="text-3xl font-black" style={{ color: 'var(--fg)' }}>Leaderboard</h1>
        </div>

        {/* Metric + period segmented controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="inline-flex gap-1 p-1 rounded-xl" style={{ background: 'var(--card-bg-2)', border: '1px solid var(--card-border)' }}>
            {metricTabs.map(t => (
              <button key={t.key} onClick={() => setMetric(t.key)} className={seg(metric === t.key)} style={segStyle(metric === t.key)}>{t.label}</button>
            ))}
          </div>
          <div className="inline-flex gap-1 p-1 rounded-xl" style={{ background: 'var(--card-bg-2)', border: '1px solid var(--card-border)' }}>
            {periodTabs.map(t => (
              <button key={t.key} onClick={() => setPeriod(t.key)} className={seg(period === t.key)} style={segStyle(period === t.key)}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Top 3 podium */}
        {sorted.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[sorted[1], sorted[0], sorted[2]].map((agent, podiumIdx) => {
              const rank = podiumIdx === 1 ? 0 : podiumIdx === 0 ? 1 : 2
              const heights = ['h-28', 'h-36', 'h-24']
              const isFirst = rank === 0
              return (
                <div key={agent.agent_id} className={clsx('card flex flex-col items-center justify-end p-4', heights[podiumIdx], isFirst && 'card-gold')}>
                  {isFirst && <Trophy size={20} className="text-yellow-400 mb-1" />}
                  <p className="text-xs font-bold" style={{ color: 'var(--fg-muted)' }}>#{rank + 1}</p>
                  <p className={clsx('font-black text-sm text-center', isFirst && 'gold-text')} style={isFirst ? undefined : { color: 'var(--fg)' }}>
                    {agent.agent_name.split(' ')[0]}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--fg-muted)' }}>{metricStr(agent)}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Full rankings */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--divider)' }}>
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>
              Rankings — {periodTabs.find(p => p.key === period)?.label} · {metricTabs.find(m => m.key === metric)?.label}
            </h2>
          </div>
          {loadingData ? (
            <div className="px-6 py-12 text-center" style={{ color: 'var(--fg-subtle)' }}>Loading…</div>
          ) : sorted.length === 0 ? (
            <div className="px-6 py-12 text-center" style={{ color: 'var(--fg-subtle)' }}>No {metricTabs.find(m => m.key === metric)?.label} logged for this period yet.</div>
          ) : (
            <div>
              {sorted.map((agent, i) => {
                const isMe = agent.agent_id === profile.id
                return (
                  <div key={agent.agent_id}
                    className={clsx('flex items-center gap-4 px-6 py-4 border-b last:border-0 transition', isMe && 'bg-yellow-500/10')}
                    style={{ borderColor: 'var(--divider)' }}>
                    <div className="w-6 flex justify-center flex-shrink-0">{rankIcon(i)}</div>
                    <div className="flex-1 min-w-0">
                      <button onClick={() => router.push(`/agents/${agent.agent_id}`)}
                        className={clsx('font-bold hover:underline text-left truncate', isMe && 'gold-text')}
                        style={isMe ? undefined : { color: 'var(--fg)' }}>
                        {agent.agent_name} {isMe && <span className="text-xs text-yellow-600">(You)</span>}
                      </button>
                      <p className="text-xs" style={{ color: 'var(--fg-subtle)' }}>{agent.apps} apps · {agent.dials.toLocaleString()} dials</p>
                    </div>
                    <p className="text-xl font-black gold-text whitespace-nowrap">{metricStr(agent)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
