'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import { Phone, GripVertical, X, ExternalLink, Mail, Save, Search, FileText } from 'lucide-react'
import clsx from 'clsx'
import { PIPELINE_STAGES, DISPOSITIONS, CLIENT_STATUSES, DISP_META } from '@/lib/constants'

// Older imports were labeled "Bought Lead" — show them as "Call In"
const srcLabel = (s: string) => s === 'Bought Lead' ? 'Call In' : (s || '—')

// Maps carrier name → exact filename in /public/carriers/ (case-sensitive, with extension)
const CARRIER_LOGO: Record<string, string> = {
  'Banner':            'Banner.PNG',
  'Corebridge':        'Corebridge.JPG',
  'Mutual of Omaha':   'Mutual Of Omaha.PNG',
  'American Amicable': 'American Amicable.PNG',
  'Foresters':         'Foresters.JPG',
  'Americo':           'Americo.JPG',
  'F&G':               'F&G.PNG',
  'SBLI':              'SBLI.JPG',
  'Transamerica':      'Transamerica.JPG',
  'UHL':               'United Home Life.png',
  'United Home Life':  'United Home Life.png',
}
const CARRIER_FALLBACK: Record<string, { label: string; bg: string }> = {
  'Royal Neighbors': { label: 'RN',     bg: '#1565c0' },
  'Gerber':          { label: 'GERBER', bg: '#1976d2' },
  'Occidental':      { label: 'OCC',    bg: '#37474f' },
  'NLG':             { label: 'NLG',    bg: '#4527a0' },
}
function CarrierLogo({ carrier }: { carrier?: string }) {
  const c = carrier || ''
  const file = CARRIER_LOGO[c]
  const [failed, setFailed] = React.useState(false)
  if (!file || failed) {
    const fb = CARRIER_FALLBACK[c]
    return fb
      ? <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-wider text-white" style={{ background: fb.bg }}>{fb.label}</span>
      : <span className="text-xs text-gray-400">{c || '—'}</span>
  }
  return <img src={`/carriers/${file}`} alt={c} onError={() => setFailed(true)} className="h-5 object-contain" />
}

type Profile = { id: string; name: string }
type Lead = {
  id: string; name: string; phone: string; email: string; source: string
  pipeline_stage: string; disposition: string; is_dead: boolean
  client_status: string; notes: string; appt_date: string; created_at: string; updated_at: string
}

const STAGE_COLOR: Record<string, string> = {
  'New': 'border-t-blue-500',
  'Dialed Once': 'border-t-sky-500',
  'Dialed Twice': 'border-t-cyan-500',
  'Dialed 3x': 'border-t-indigo-500',
  'Dialed 4x': 'border-t-purple-500',
  'Follow Up': 'border-t-violet-500',
  'Appt Set': 'border-t-teal-500',
  'Appt No Show': 'border-t-red-500',
  'Appt Showed': 'border-t-green-500',
  'Signed': 'border-t-yellow-500',
  'Pending Approval': 'border-t-amber-500',
  'Active Client': 'border-t-green-600',
  'Stale': 'border-t-gray-600',
}
// Solid colored headers (readable on light & dark)
const STAGE_HEADER: Record<string, string> = {
  'New': 'bg-blue-600 text-white',
  'Dialed Once': 'bg-sky-600 text-white',
  'Dialed Twice': 'bg-cyan-600 text-white',
  'Dialed 3x': 'bg-indigo-600 text-white',
  'Dialed 4x': 'bg-purple-600 text-white',
  'Follow Up': 'bg-violet-600 text-white',
  'Appt Set': 'bg-teal-600 text-white',
  'Appt No Show': 'bg-red-600 text-white',
  'Appt Showed': 'bg-green-600 text-white',
  'Signed': 'bg-yellow-400 text-black',
  'Pending Approval': 'bg-amber-500 text-black',
  'Active Client': 'bg-green-600 text-white',
  'Stale': 'bg-zinc-600 text-white',
}
// Dial stages get a quick "call next" button at the top
const DIAL_STAGES = ['New', 'Dialed Once', 'Dialed Twice', 'Dialed 3x', 'Dialed 4x', 'Follow Up']

export default function PipelinePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [policies, setPolicies] = useState<{ id: string; client_name: string; status: string; carrier: string; pipeline_stage?: string | null; policy_type?: string; product_type?: string; apv?: number; gross_ap?: number; premium?: number; face_amount?: number }[]>([])
  const [dragId, setDragId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<string | null>(null)
  const [quick, setQuick] = useState<Lead | null>(null)
  const [savingQuick, setSavingQuick] = useState(false)
  const [view, setView] = useState<'active' | 'dead'>('active')
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'custom'>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showRecentlyDialed, setShowRecentlyDialed] = useState(false)

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
      const [{ data }, { data: pols }] = await Promise.all([
        supabase.from('leads').select('id,name,phone,email,source,pipeline_stage,disposition,is_dead,client_status,notes,appt_date,created_at,updated_at')
          .eq('agent_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('policy_log').select('id,client_name,status,carrier,pipeline_stage,policy_type,product_type,apv,gross_ap,premium,face_amount').eq('agent_id', session.user.id),
      ])
      const loadedLeads = data || []
      const loadedPols = (pols || []) as any[]

      // Auto-sync lead names to match policy client_name when they refer to the same person
      // (e.g. "Rodolfo Ramon" → "Rodolfo M. Ramon" from the uploaded policy)
      const normName = (n?: string) => {
        const p = (n || '').trim().toLowerCase().split(/\s+/).filter(Boolean)
        return p.length >= 2 ? `${p[0]} ${p[p.length - 1]}` : (p[0] || '')
      }
      const polByNorm = new Map<string, string>() // norm → canonical client_name from policy
      for (const p of loadedPols) { const k = normName(p.client_name); if (k && !polByNorm.has(k)) polByNorm.set(k, p.client_name) }

      const updates: Promise<any>[] = []
      const syncedLeads = loadedLeads.map(l => {
        const k = normName(l.name)
        const canonical = polByNorm.get(k)
        if (canonical && canonical !== l.name) {
          updates.push(Promise.resolve(supabase.from('leads').update({ name: canonical }).eq('id', l.id)))
          return { ...l, name: canonical }
        }
        return l
      })
      if (updates.length) await Promise.all(updates)

      setLeads(syncedLeads)
      setPolicies(loadedPols)
    })
  }, [router])

  async function moveToStage(leadId: string, stage: string) {
    setLeads(list => list.map(l => l.id === leadId ? { ...l, pipeline_stage: stage } : l))
    await supabase.from('leads').update({ pipeline_stage: stage }).eq('id', leadId)
  }

  async function reactivate(leadId: string) {
    setLeads(list => list.map(l => l.id === leadId ? { ...l, is_dead: false, pipeline_stage: 'New' } : l))
    await supabase.from('leads').update({ is_dead: false, pipeline_stage: 'New' }).eq('id', leadId)
  }

  async function movePolicyToStage(policyId: string, stage: string) {
    setPolicies(list => list.map(p => p.id === policyId ? { ...p, pipeline_stage: stage } : p))
    await supabase.from('policy_log').update({ pipeline_stage: stage }).eq('id', policyId)
  }

  function onDrop(stage: string) {
    if (dragId?.startsWith('policy:')) movePolicyToStage(dragId.slice(7), stage)
    else if (dragId) moveToStage(dragId, stage)
    setDragId(null); setOverStage(null)
  }

  async function saveQuick() {
    if (!quick) return
    setSavingQuick(true)
    const patch: any = {
      pipeline_stage: quick.pipeline_stage, client_status: quick.client_status,
      disposition: quick.disposition, notes: quick.notes, appt_date: quick.appt_date,
      is_dead: quick.is_dead,
    }
    await supabase.from('leads').update(patch).eq('id', quick.id)
    setLeads(list => list.map(l => l.id === quick.id ? { ...l, ...patch } : l))
    setSavingQuick(false)
    setQuick(null)
  }

  if (!profile) return <Loading />

  // Date-range filter on when the lead was added
  const inRange = (created: string) => {
    if (dateRange === 'all' || !created) return true
    const d = new Date(created); const now = new Date()
    if (dateRange === 'week') { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w }
    if (dateRange === 'month') { const m = new Date(now); m.setMonth(now.getMonth() - 1); return d >= m }
    if (dateRange === 'custom') {
      if (customFrom && d < new Date(customFrom + 'T00:00:00')) return false
      if (customTo && d > new Date(customTo + 'T23:59:59')) return false
    }
    return true
  }

  // Match leads ↔ policies by FIRST + LAST name (ignore middle initials, etc.)
  const STATUS_STAGE: Record<string, string> = { Submitted: 'Signed', Approved: 'Active Client', Issued: 'Active Client' }
  const POST_SALE = new Set(['Signed', 'Pending Approval', 'Active Client'])
  const norm = (n?: string) => { const p = (n || '').trim().toLowerCase().split(/\s+/).filter(Boolean); return p.length >= 2 ? `${p[0]} ${p[p.length - 1]}` : (p[0] || '') }
  // Which post-sale stage each client (by name) belongs in, from their policy
  const policyStage = new Map<string, string>()
  policies.forEach(p => { const st = p.pipeline_stage || STATUS_STAGE[p.status]; const k = norm(p.client_name); if (st && k && !policyStage.has(k)) policyStage.set(k, st) })
  // A lead that has a policy is a client: show it in the policy's stage unless it's
  // already been manually placed in a post-sale stage.
  const effStage = (l: Lead) => { const ps = policyStage.get(norm(l.name)); const cur = l.pipeline_stage || 'New'; return (ps && !POST_SALE.has(cur)) ? ps : cur }
  const isClientLead = (l: Lead) => policyStage.has(norm(l.name))
  // Policy cards only for clients that have NO matching lead at all
  const leadNorms = new Set(leads.map(l => norm(l.name)))
  const seenPolicy = new Set<string>()
  const policyCards = policies.flatMap(p => {
    const stage = p.pipeline_stage || STATUS_STAGE[p.status]
    const key = norm(p.client_name)
    if (!stage || !key || leadNorms.has(key) || seenPolicy.has(key)) return []
    seenPolicy.add(key)
    return [{ id: 'policy:' + p.id, name: p.client_name, source: p.carrier || 'Client', pipeline_stage: stage, isPolicy: true } as any]
  })

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={profile.name} />
      <div className="px-4 py-8">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-black text-white">Pipeline</h1>
            <p className="text-gray-500 mt-1">
              {view === 'active' ? 'Drag leads between stages to stay organized' : 'Leads marked not interested / do not call'} · {leads.filter(l => view === 'active' ? !l.is_dead : l.is_dead).length}
            </p>
          </div>
          <div className="inline-flex gap-1 bg-gray-900 rounded-xl p-1">
            <button onClick={() => setView('active')}
              className={clsx('px-4 py-2 rounded-lg text-sm font-bold transition', view === 'active' ? 'gold-gradient text-black' : 'text-gray-400')}>
              Active Pipeline
            </button>
            <button onClick={() => setView('dead')}
              className={clsx('px-4 py-2 rounded-lg text-sm font-bold transition', view === 'dead' ? 'bg-red-900 text-red-300' : 'text-gray-400')}>
              Dead Leads ({leads.filter(l => l.is_dead).length})
            </button>
          </div>
        </div>

        {/* Search + date filters */}
        {view === 'active' && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, or email..."
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            {(['all', 'week', 'month', 'custom'] as const).map(r => (
              <button key={r} onClick={() => setDateRange(r)}
                className={clsx('px-3 py-2 rounded-lg text-xs font-medium transition capitalize',
                  dateRange === r ? 'bg-yellow-500/15 text-yellow-500 border border-yellow-700' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white')}>
                {r === 'all' ? 'All time' : r === 'week' ? 'This week' : r === 'month' ? 'This month' : 'Custom'}
              </button>
            ))}
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-yellow-500" />
                <span className="text-gray-600 text-xs">to</span>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-yellow-500" />
              </div>
            )}
            <button onClick={() => setShowRecentlyDialed(v => !v)}
              className={clsx('px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5',
                showRecentlyDialed ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-600' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white')}>
              <Phone size={11} /> {showRecentlyDialed ? 'Showing recently dialed' : 'Recently dialed'}
            </button>
          </div>
        )}

        {/* DEAD LEADS view — simple grid with reactivate */}
        {view === 'dead' ? (
          <div className="max-w-7xl mx-auto">
            {leads.filter(l => l.is_dead).length === 0 ? (
              <div className="card p-12 text-center text-gray-600">No dead leads. Everything's still in play. 🎯</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {leads.filter(l => l.is_dead).map(lead => (
                  <div key={lead.id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <button onClick={() => router.push(`/leads/${lead.id}?from=pipeline`)} className="font-bold text-white hover:text-yellow-500 hover:underline text-left">{lead.name}</button>
                      <span className="text-[10px] font-bold bg-red-950 text-red-400 px-2 py-0.5 rounded-full whitespace-nowrap">{lead.disposition}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{srcLabel(lead.source)}</p>
                    {lead.phone && <p className="text-xs text-gray-600 flex items-center gap-1 mt-1"><Phone size={10} />{lead.phone}</p>}
                    <button onClick={() => reactivate(lead.id)}
                      className="mt-3 w-full bg-green-900/30 border border-green-700 text-green-400 text-xs font-bold py-2 rounded-lg hover:bg-green-900/50 transition">
                      Reactivate Lead
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
        /* ACTIVE Kanban board — horizontal scroll */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map(stage => {
            const q = search.toLowerCase().trim()
            const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            const realLeads = leads.filter(l => !l.is_dead && effStage(l) === stage && inRange(l.created_at)
              && (!q || l.name.toLowerCase().includes(q) || (l.phone || '').includes(search.trim()) || (l.email || '').toLowerCase().includes(q))
              && (!showRecentlyDialed || (l.updated_at >= cutoff)))
            const stagePolicies = policyCards.filter(c => c.pipeline_stage === stage && (!q || c.name.toLowerCase().includes(q)))
            const stageLeads = [...realLeads, ...stagePolicies]
            return (
              <div key={stage}
                onDragOver={e => { e.preventDefault(); setOverStage(stage) }}
                onDragLeave={() => setOverStage(s => s === stage ? null : s)}
                onDrop={() => onDrop(stage)}
                className={clsx('flex-shrink-0 w-64 rounded-xl transition flex flex-col h-[calc(100vh-180px)]', overStage === stage && 'bg-yellow-500/5 ring-2 ring-yellow-500/40')}>
                <div className={clsx('rounded-t-xl px-3 py-2.5 mb-2 flex-shrink-0', STAGE_HEADER[stage] || 'bg-zinc-600 text-white')}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm">{stage}</span>
                    <span className="text-xs font-bold bg-black/25 px-2 py-0.5 rounded-full">{stageLeads.length}</span>
                  </div>
                  {DIAL_STAGES.includes(stage) && (() => {
                    const next = stageLeads.find(l => l.phone)
                    if (!next) return null
                    return (
                      <button onClick={() => {
                        try { sessionStorage.setItem('callQueueIds', JSON.stringify(stageLeads.map(l => l.id))) } catch {}
                        router.push(`/leads/${next.id}?queue=1`)
                      }}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 bg-white text-gray-900 text-xs font-black py-1.5 rounded-lg hover:bg-gray-100 transition shadow">
                        <Phone size={12} /> Call next · {next.name.split(' ')[0]}
                      </button>
                    )
                  })()}
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-[80px]">
                  {stageLeads.map((lead: any) => lead.isPolicy ? (
                    <div key={lead.id} draggable
                      onDragStart={() => setDragId(lead.id)}
                      onDragEnd={() => { setDragId(null); setOverStage(null) }}
                      onClick={() => router.push('/policies')}
                      className={clsx('card p-3 cursor-pointer hover:border-yellow-500/40 transition group', dragId === lead.id && 'opacity-40')}>
                      <div className="flex items-start gap-2">
                        <GripVertical size={14} className="text-gray-700 group-hover:text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-sm truncate">{lead.name}</p>
                          <p className="text-xs text-gray-500 truncate">{lead.source}</p>
                          <span className="text-[9px] font-black uppercase tracking-wider text-green-400">● Client</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={lead.id} draggable
                      onDragStart={() => setDragId(lead.id)}
                      onDragEnd={() => { setDragId(null); setOverStage(null) }}
                      onClick={() => setQuick(lead)}
                      className={clsx('card p-3 cursor-pointer hover:border-yellow-500/40 transition group', dragId === lead.id && 'opacity-40')}>
                      <div className="flex items-start gap-2">
                        <GripVertical size={14} className="text-gray-700 group-hover:text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <button onClick={e => { e.stopPropagation(); router.push(`/leads/${lead.id}?from=pipeline`) }}
                            className="font-bold text-white text-sm truncate hover:text-yellow-500 hover:underline text-left block w-full">
                            {lead.name}
                          </button>
                          <p className="text-xs text-gray-500 truncate">{srcLabel(lead.source)}</p>
                          {isClientLead(lead) && <span className="text-[9px] font-black uppercase tracking-wider text-green-400">● Client</span>}
                          {lead.phone && <p className="text-xs text-gray-600 flex items-center gap-1 mt-1"><Phone size={10} />{lead.phone}</p>}
                          {lead.updated_at && <p className="text-[10px] text-gray-700 mt-0.5">{(() => { const d = new Date(lead.updated_at); const now = new Date(); const mins = Math.floor((now.getTime() - d.getTime()) / 60000); if (mins < 60) return `${mins}m ago`; if (mins < 1440) return `${Math.floor(mins/60)}h ago`; return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) })()}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && <div className="text-center text-xs text-gray-700 py-6 border border-dashed border-gray-800 rounded-lg">Drop here</div>}
                </div>
              </div>
            )
          })}
        </div>
        )}
      </div>

      {/* Quick-edit window */}
      {quick && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-end z-50" onClick={() => setQuick(null)}>
          <div onClick={e => e.stopPropagation()}
            className="card-gold h-full w-full max-w-md rounded-l-2xl flex flex-col shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div className="min-w-0">
                <h2 className="text-lg font-black text-white truncate">{quick.name}</h2>
                <p className="text-xs text-gray-500">{srcLabel(quick.source)}</p>
              </div>
              <button onClick={() => setQuick(null)} className="text-gray-500 hover:text-white flex-shrink-0"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5 flex-1">
              {/* Quick actions */}
              <button onClick={() => router.push(`/leads/${quick.id}?from=pipeline`)}
                className="w-full flex items-center justify-center gap-2 gold-gradient text-black font-bold py-2.5 rounded-xl text-sm hover:opacity-90 transition">
                <ExternalLink size={15} /> Open Full Lead
              </button>

              {quick.phone && <p className="text-sm text-gray-400 flex items-center gap-2"><Phone size={13} className="text-gray-600" />{quick.phone}</p>}
              {quick.email && <p className="text-sm text-gray-400 flex items-center gap-2"><Mail size={13} className="text-gray-600" />{quick.email}</p>}

              {/* Policy details — shown when this lead is a client */}
              {(() => {
                // Flexible match: first + last must both appear anywhere in each name (handles middle names, suffixes)
                const nameMatch = (a?: string, b?: string) => {
                  const wa = (a || '').trim().toLowerCase().split(/\s+/).filter(Boolean)
                  const wb = (b || '').trim().toLowerCase().split(/\s+/).filter(Boolean)
                  if (wa.length < 2 || wb.length < 2) return norm(a) === norm(b)
                  return wa[0] === wb[0] && wa[wa.length - 1] === wb[wb.length - 1]
                }
                const my = policies.filter(p => nameMatch(p.client_name, quick.name))
                const money = (n?: number) => `$${(Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                if (!my.length) {
                  return (
                    <div className="rounded-xl border border-dashed border-gray-700 p-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">No policy linked yet</p>
                      <button onClick={() => router.push('/policies')} className="text-xs text-yellow-500 hover:underline font-bold">+ Add policy in Policy Log →</button>
                    </div>
                  )
                }
                return (
                  <div className="rounded-xl border p-3" style={{ background: 'var(--card-bg-2)', borderColor: 'rgba(34,197,94,0.45)' }}>
                    <p className="text-xs font-black uppercase tracking-wider text-green-400 mb-2">● Client — Policy Details</p>
                    <div className="space-y-3">
                      {my.map(p => (
                        <div key={p.id} onClick={() => router.push('/policies')} className="cursor-pointer">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-white text-sm">{p.policy_type || p.product_type || 'Policy'}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white whitespace-nowrap">{p.status}</span>
                          </div>
                          <div className="mt-0.5"><CarrierLogo carrier={p.carrier} /></div>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <div><p className="text-[10px] text-gray-500 uppercase tracking-wider">Face Amount</p><p className="font-bold text-white text-sm">{p.face_amount ? money(p.face_amount) : '—'}</p></div>
                            <div><p className="text-[10px] text-gray-500 uppercase tracking-wider">Annual Premium</p><p className="font-bold text-white text-sm">{money(p.gross_ap ?? p.apv)}</p></div>
                            <div><p className="text-[10px] text-gray-500 uppercase tracking-wider">Monthly</p><p className="font-bold text-white text-sm">{p.premium ? money(p.premium) : '—'}</p></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Stage */}
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Pipeline Stage</label>
                <select value={quick.pipeline_stage || 'New'} onChange={e => setQuick(q => q ? { ...q, pipeline_stage: e.target.value } : q)}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500">
                  {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Disposition + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Disposition</label>
                  <select value={quick.disposition} onChange={e => {
                    const val = e.target.value
                    const meta = DISP_META[val]
                    setQuick(q => q ? { ...q, disposition: val, is_dead: meta?.dead ? true : q.is_dead } : q)
                  }}
                    className="w-full bg-black border border-gray-700 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-yellow-500">
                    <option value="Not Called">Not Called</option>
                    {DISPOSITIONS.map(d => <option key={d.label} value={d.label}>{d.label}</option>)}
                  </select>
                  {DISP_META[quick.disposition]?.dead && (
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input type="checkbox" checked={!!quick.is_dead}
                        onChange={e => setQuick(q => q ? { ...q, is_dead: e.target.checked } : q)}
                        className="accent-red-500 w-4 h-4" />
                      <span className="text-xs text-red-400 font-semibold">Move to Dead Leads</span>
                    </label>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Client Status</label>
                  <select value={quick.client_status || 'Active'} onChange={e => setQuick(q => q ? { ...q, client_status: e.target.value } : q)}
                    className="w-full bg-black border border-gray-700 rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-yellow-500">
                    {CLIENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Appointment */}
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Appointment</label>
                <input type="datetime-local" step={900} value={quick.appt_date || ''} onChange={e => setQuick(q => q ? { ...q, appt_date: e.target.value } : q)}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Notes</label>
                <textarea value={quick.notes || ''} onChange={e => setQuick(q => q ? { ...q, notes: e.target.value } : q)} rows={4}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500 resize-none" placeholder="Quick notes…" />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
              <button onClick={() => setQuick(null)} className="flex-1 bg-gray-900 border border-gray-700 text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-800 transition">Cancel</button>
              <button onClick={saveQuick} disabled={savingQuick}
                className="flex-1 flex items-center justify-center gap-2 gold-gradient text-black font-black py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50">
                <Save size={16} /> {savingQuick ? 'Saving…' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
