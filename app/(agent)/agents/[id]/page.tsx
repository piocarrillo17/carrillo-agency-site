'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import { ArrowLeft, Trophy } from 'lucide-react'
import clsx from 'clsx'
import { BADGES, TIER_STYLE } from '@/lib/badges'

type ProfileStats = {
  total_apps: number; total_issued: number; submitted_ap: number; issued_ap: number
  best_week_ap: number; best_month_ap: number; total_dials: number
}
const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${(n || 0).toFixed(0)}`

export default function AgentProfilePage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string

  const [me, setMe] = useState<{ id: string; name: string; role: string; contract_level: number } | null>(null)
  const [agentName, setAgentName] = useState('')
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [earned, setEarned] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [level, setLevel] = useState(80)        // viewed agent's contract level
  const [levelInput, setLevelInput] = useState('')
  const [savingLevel, setSavingLevel] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      const { data: meP } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setMe(meP as any)

      const [{ data: prof }, { data: ach }, { data: st }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', agentId).single(),
        supabase.from('achievements').select('badge_key').eq('agent_id', agentId),
        supabase.rpc('agent_profile_stats', { p_agent_id: agentId }),
      ])
      setAgentName(prof?.name || 'Agent')
      setLevel(prof?.contract_level ?? 80)
      setLevelInput(String(prof?.contract_level ?? 80))
      setEarned(new Set((ach || []).map((r: any) => r.badge_key)))
      const row = Array.isArray(st) ? st[0] : st
      if (row) setStats({
        total_apps: Number(row.total_apps) || 0,
        total_issued: Number(row.total_issued) || 0,
        submitted_ap: Number(row.submitted_ap) || 0,
        issued_ap: Number(row.issued_ap) || 0,
        best_week_ap: Number(row.best_week_ap) || 0,
        best_month_ap: Number(row.best_month_ap) || 0,
        total_dials: Number(row.total_dials) || 0,
      })
      setLoading(false)
    })
  }, [router, agentId])

  async function saveLevel() {
    const lvl = Math.max(0, Math.min(200, Number(levelInput) || 0))
    setSavingLevel(true)
    await supabase.from('profiles').update({ contract_level: lvl }).eq('id', agentId)
    setLevel(lvl); setLevelInput(String(lvl)); setSavingLevel(false)
  }

  if (loading || !me) return <Loading />

  const isManager = me.role === 'manager'
  const isSelf = agentId === me.id
  const canEditLevel = isManager   // only managers set contract levels
  const myLevel = me.contract_level ?? 80
  const spread = Math.max(0, myLevel - level)
  // Override = your spread × the agent's written business (downline only)
  const overrideYTD = (!isSelf && spread > 0) ? (stats?.submitted_ap || 0) * (spread / 100) : 0

  const earnedBadges = BADGES.filter(b => earned.has(b.key))
  const initials = agentName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const statCards: { label: string; value: string }[] = [
    { label: 'Best Week AP', value: fmt(stats?.best_week_ap || 0) },
    { label: 'Best Month AP', value: fmt(stats?.best_month_ap || 0) },
    { label: 'Apps Written', value: String(stats?.total_apps || 0) },
    { label: 'Policies Issued', value: String(stats?.total_issued || 0) },
    { label: 'Submitted AP', value: fmt(stats?.submitted_ap || 0) },
    { label: 'Issued AP', value: fmt(stats?.issued_ap || 0) },
    { label: 'Total Dials', value: (stats?.total_dials || 0).toLocaleString() },
    { label: 'Badges', value: `${earnedBadges.length}/${BADGES.length}` },
  ]

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={me.name} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center text-black font-black text-xl">{initials}</div>
          <div>
            <h1 className="text-3xl font-black text-white">{agentName}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{agentId === me.id ? 'Your profile' : 'Agent profile'}</p>
          </div>
        </div>

        {/* Contract level & override */}
        <div className="card p-5 mb-6">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Contract Level</p>
              {canEditLevel ? (
                <div className="flex items-center gap-2">
                  <select value={levelInput} onChange={e => setLevelInput(e.target.value)}
                    className="w-24 bg-black border border-gray-700 rounded-lg px-3 py-2 text-white font-black text-lg focus:outline-none focus:border-yellow-500">
                    {[80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  {levelInput !== String(level) && (
                    <button onClick={saveLevel} disabled={savingLevel} className="gold-gradient text-black font-bold text-sm px-3 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
                      {savingLevel ? '…' : 'Save'}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-2xl font-black gold-text">{level}</p>
              )}
            </div>
            {!isSelf && (
              <>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Level</p>
                  <p className="text-2xl font-black text-gray-300">{myLevel}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Spread</p>
                  <p className="text-2xl font-black text-teal-400">{spread} pts</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Override (YTD)</p>
                  <p className="text-2xl font-black text-green-400">{fmt(overrideYTD)}</p>
                </div>
              </>
            )}
          </div>
          {!isSelf && (
            <p className="text-[11px] text-gray-600 mt-3">Override = your spread ({spread}%) × {agentName.split(' ')[0]}'s submitted AP ({fmt(stats?.submitted_ap || 0)}).</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {statCards.map(s => (
            <div key={s.label} className="card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-xl font-black gold-text">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-yellow-500" />
          <h2 className="text-xl font-black text-white">Achievements</h2>
          <span className="text-xs text-gray-600">{earnedBadges.length} earned</span>
        </div>
        {earnedBadges.length === 0 ? (
          <div className="card p-8 text-center text-gray-600">No badges earned yet.</div>
        ) : (
          <div className="card p-5">
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-3">
              {BADGES.map(b => {
                const has = earned.has(b.key)
                const t = TIER_STYLE[b.tier]
                return (
                  <div key={b.key} title={`${b.label} — ${b.desc}`}
                    className={clsx('flex flex-col items-center text-center gap-1 rounded-xl p-3 transition',
                      has ? `${t.bg} ring-1 ${t.ring}` : 'bg-gray-900/40 opacity-30 grayscale')}>
                    <span className="text-3xl leading-none">{b.emoji}</span>
                    <span className={clsx('text-[10px] font-bold leading-tight', has ? 'text-white' : 'text-gray-500')}>{b.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
