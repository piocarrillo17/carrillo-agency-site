'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import { Users, UserPlus, UserMinus, Search, Crown } from 'lucide-react'
import clsx from 'clsx'
import { usePresence, presenceLabel } from '@/lib/usePresence'

type Profile = { id: string; name: string; email: string; role: string; manager_id: string | null; last_seen: string | null }

export default function AdminPage() {
  const router = useRouter()
  const [me, setMe] = useState<Profile | null>(null)
  const [agents, setAgents] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'team' | 'all'>('team')

  usePresence(me?.id)

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
      loadAgents()
    })
  }, [router])

  // Refresh presence every 30s so the page stays live
  useEffect(() => {
    const t = setInterval(loadAgents, 30_000)
    return () => clearInterval(t)
  }, [])

  async function loadAgents() {
    const { data } = await supabase.from('profiles').select('*').order('name')
    setAgents(data || [])
  }

  async function assign(agentId: string, toMyTeam: boolean) {
    if (!me) return
    await supabase.from('profiles').update({ manager_id: toMyTeam ? me.id : null }).eq('id', agentId)
    if (toMyTeam && me.role !== 'manager') {
      await supabase.from('profiles').update({ role: 'manager' }).eq('id', me.id)
      setMe({ ...me, role: 'manager' })
    }
    setAgents(list => list.map(a => a.id === agentId ? { ...a, manager_id: toMyTeam ? me.id : null } : a))
  }

  if (!me) return <Loading />

  const myTeam = agents.filter(a => a.manager_id === me.id && a.id !== me.id)
  const others = agents.filter(a => a.manager_id !== me.id && a.id !== me.id)
  const list = (tab === 'team' ? myTeam : others).filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()))

  const onlineCount = agents.filter(a => {
    if (!a.last_seen) return false
    return Date.now() - new Date(a.last_seen).getTime() < 5 * 60_000
  }).length

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={me.name} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Users size={28} className="text-yellow-500" />
          <div>
            <h1 className="text-3xl font-black text-white">Team Management</h1>
            <p className="text-gray-500 mt-0.5">
              Assign agents to your downline
              {me.role === 'manager' && <span className="inline-flex items-center gap-1 text-yellow-500 ml-1"><Crown size={12} /> Manager</span>}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">My Team</p>
            <p className="text-3xl font-black gold-text">{myTeam.length}</p>
            <p className="text-xs text-gray-600 mt-1">downline agents</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Agents</p>
            <p className="text-3xl font-black text-white">{agents.length}</p>
            <p className="text-xs text-gray-600 mt-1">in the system</p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Online Now</p>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-3xl font-black text-green-400">{onlineCount}</p>
            </div>
            <p className="text-xs text-gray-600 mt-1">active in last 5 min</p>
          </div>
        </div>

        {/* Who's online right now — quick strip */}
        {onlineCount > 0 && (
          <div className="card p-4 mb-6 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider text-green-400 flex items-center gap-1.5 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live
            </span>
            {agents.filter(a => a.last_seen && Date.now() - new Date(a.last_seen).getTime() < 5 * 60_000).map(a => (
              <div key={a.id} className="flex items-center gap-1.5 bg-green-950/40 border border-green-800/50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-sm font-bold text-white">{a.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('team')}
            className={clsx('px-4 py-2 rounded-lg text-sm font-bold transition', tab === 'team' ? 'gold-gradient text-black' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white')}>
            My Team ({myTeam.length})
          </button>
          <button onClick={() => setTab('all')}
            className={clsx('px-4 py-2 rounded-lg text-sm font-bold transition', tab === 'all' ? 'gold-gradient text-black' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white')}>
            Available Agents ({others.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500" />
        </div>

        {/* Agent list */}
        <div className="card overflow-hidden">
          {list.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-600">
              {tab === 'team' ? 'No agents on your team yet. Add them from "Available Agents".' : 'No available agents.'}
            </div>
          ) : list.map(a => {
            const { label, online } = presenceLabel(a.last_seen)
            return (
              <div key={a.id} className="flex items-center justify-between px-5 py-4 border-b border-gray-900 last:border-0">
                <button onClick={() => router.push(`/agents/${a.id}`)} className="flex items-center gap-3 text-left group flex-1 min-w-0">
                  {/* Avatar with online dot */}
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center text-black font-black text-xs">
                      {a.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <span className={clsx(
                      'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-950',
                      online ? 'bg-green-400' : 'bg-gray-600'
                    )} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm group-hover:text-yellow-500 transition truncate">{a.name}</p>
                    <p className="text-xs text-gray-500 truncate">{a.email}</p>
                  </div>
                  {/* Last seen */}
                  <span className={clsx(
                    'ml-3 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                    online ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'
                  )}>
                    {label}
                  </span>
                </button>

                <div className="flex-shrink-0 ml-3">
                  {tab === 'team' ? (
                    <button onClick={() => assign(a.id, false)}
                      className="flex items-center gap-2 bg-gray-900 border border-gray-700 text-gray-400 hover:text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition">
                      <UserMinus size={15} /> Remove
                    </button>
                  ) : (
                    <button onClick={() => assign(a.id, true)}
                      className="flex items-center gap-2 gold-gradient text-black px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition">
                      <UserPlus size={15} /> Add to Team
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
