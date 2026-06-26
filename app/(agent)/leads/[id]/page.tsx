'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import ScriptWidget from '@/components/ScriptWidget'
import LeadClosingScript from '@/components/LeadClosingScript'
import LeadFIF from '@/components/LeadFIF'
import { Phone, ArrowLeft, CheckCircle, Calendar, Zap, X, HeartCrack, Heart, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { DISPOSITIONS, DISP_BADGE, DISP_META, dialBucket, CLIENT_STATUSES, PIPELINE_STAGES } from '@/lib/constants'
import { localDate } from '@/lib/date'
import { googleCalLink } from '@/lib/calendar'
import { blankFIF, type FIFData } from '@/lib/fifTypes'
import type { ClosingCtx } from '@/lib/closingScript'

type TabId = 'overview' | 'script' | 'fif'

type Lead = {
  id: string
  agent_id: string
  name: string
  phone: string
  email: string
  source: string
  disposition: string
  dob: string
  address: string
  city: string
  state: string
  zip: string
  age: number | null
  gender: string
  tobacco_use: string
  co_borrower: string
  mortgage_balance: string
  lender: string
  monthly_mortgage: string
  height: string
  weight: string
  notes: string
  appt_date: string
  appt_type?: string
  dial_count: number
  is_dead: boolean
  pipeline_stage: string
  client_status: string
  created_at: string
  fif_data?: string
}

const today = () => localDate()

// Mask typed digits into MM/DD/YYYY
function maskDob(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}
// Age from a DOB string (MM/DD/YYYY or YYYY-MM-DD)
function ageFromDob(dob: string): number | null {
  if (!dob) return null
  let y = 0, mo = 0, d = 0
  let m = dob.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) { mo = +m[1]; d = +m[2]; y = +m[3] }
  else { const m2 = dob.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (!m2) return null; y = +m2[1]; mo = +m2[2]; d = +m2[3] }
  const n = new Date(); let a = n.getFullYear() - y
  if (n.getMonth() + 1 < mo || (n.getMonth() + 1 === mo && n.getDate() < d)) a--
  return a >= 0 && a < 120 ? a : null
}

type Profile = { id: string; name: string; dial_mode?: number }
const DISP_COLOR = DISP_BADGE

function Toggle({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="inline-flex rounded-lg border border-gray-700 overflow-hidden">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={clsx(
            'px-4 py-2 text-sm font-bold transition',
            value === opt ? 'gold-gradient text-black' : 'bg-black text-gray-400 hover:text-white'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const fromPipeline = searchParams.get('from') === 'pipeline'

  const [profile, setProfile] = useState<Profile | null>(null)
  const [lead, setLead] = useState<Lead | null>(null)
  const [clientPolicies, setClientPolicies] = useState<any[]>([])
  const [settingDisp, setSettingDisp] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('overview')
const [fifData, setFifData] = useState<FIFData>(blankFIF())
  const [closingCtx, setClosingCtx] = useState<Partial<ClosingCtx>>({})

  // Editable form state
  const [form, setForm] = useState({
    name: '', email: '', dob: '', height: '', weight: '',
    tobacco_use: 'Unknown', co_borrower: 'Unknown', monthly_mortgage: '', notes: '', appt_date: '',
  })
  const [autoStatus, setAutoStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [noteEntries, setNoteEntries] = useState<{ ts: string; text: string }[]>([])
  const [newNote, setNewNote] = useState('')
  const [showApptModal, setShowApptModal] = useState(false)
  const [apptDraft, setApptDraft] = useState('')
  const [apptEdit, setApptEdit] = useState(false)   // true = just fixing the time, keep disposition
  const [apptDisp, setApptDisp] = useState<string>('Booked')
  const [apptType, setApptType] = useState('Close')
  const loadedRef = useRef(false)
  const [queueNav, setQueueNav] = useState<{ next: string | null; prev: string | null; pos: number; total: number } | null>(null)

  // When opened from the dashboard "Up Next to Call" queue, offer next/prev navigation
  useEffect(() => {
    if (typeof window === 'undefined') return
    const fromQueue = new URLSearchParams(window.location.search).get('queue') === '1'
    if (!fromQueue) { setQueueNav(null); return }
    try {
      const ids: string[] = JSON.parse(sessionStorage.getItem('callQueueIds') || '[]')
      const idx = ids.indexOf(id)
      if (idx === -1) { setQueueNav(null); return }
      setQueueNav({
        prev: idx > 0 ? ids[idx - 1] : null,
        next: idx < ids.length - 1 ? ids[idx + 1] : null,
        pos: idx + 1, total: ids.length,
      })
    } catch { setQueueNav(null) }
  }, [id])

  // Increment today's daily_activity counter for a given metric
  async function tallyActivity(agentId: string, agentName: string, metric: 'dials' | 'contacts' | 'appts' | 'sales') {
    const { data: row } = await supabase.from('daily_activity').select('*').eq('agent_id', agentId).eq('date', today()).single()
    const base = row || { dials: 0, contacts: 0, appts: 0, sales: 0 }
    await supabase.from('daily_activity').upsert({
      agent_id: agentId, agent_name: agentName, date: today(),
      dials: base.dials + (metric === 'dials' ? 1 : 0),
      contacts: base.contacts + (metric === 'contacts' ? 1 : 0),
      appts: base.appts + (metric === 'appts' ? 1 : 0),
      sales: base.sales + (metric === 'sales' ? 1 : 0),
    }, { onConflict: 'agent_id,date' })
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
      setProfile(p)
      const { data: l } = await supabase.from('leads').select('*').eq('id', id).single()
      if (l) {
        setLead(l)
        // If this lead became a client, pull their policy(ies) to show what they signed up for
        if (l.name) {
          supabase.from('policy_log').select('id,policy_type,product_type,carrier,apv,premium,status,date_written')
            .eq('agent_id', l.agent_id).ilike('client_name', l.name.trim())
            .then(({ data: pols }) => setClientPolicies(pols || []))
        }
        setForm({
          name: l.name || '', email: l.email || '', dob: l.dob || '',
          height: l.height || '', weight: l.weight || '',
          tobacco_use: l.tobacco_use || 'Unknown', co_borrower: l.co_borrower || 'Unknown',
          monthly_mortgage: l.monthly_mortgage || '', notes: l.notes || '', appt_date: l.appt_date || '',
        })
        // Parse notes: JSON array of {ts, text} or legacy plain text
        try {
          const parsed = JSON.parse(l.notes || '[]')
          if (Array.isArray(parsed)) setNoteEntries(parsed)
          else if (l.notes) setNoteEntries([{ ts: l.created_at || new Date().toISOString(), text: l.notes }])
        } catch {
          if (l.notes) setNoteEntries([{ ts: l.created_at || new Date().toISOString(), text: l.notes }])
        }
        // Load FIF data
        try {
          const fif = l.fif_data ? JSON.parse(l.fif_data) : blankFIF()
          // Pre-fill from lead if blank
          const blank = blankFIF()
          const merged: FIFData = {
            ...blank,
            ...fif,
            insured: fif.insured || l.name || '',
            email: fif.email || l.email || '',
            phone: fif.phone || l.phone || '',
            address: fif.address || l.address || '',
            cityStateZip: fif.cityStateZip || [l.city, l.state, l.zip].filter(Boolean).join(', '),
            lender: fif.lender || l.lender || '',
            payment: fif.payment || l.monthly_mortgage || '',
            loanAmount: fif.loanAmount || l.mortgage_balance || '',
            expMortgage: fif.expMortgage || l.monthly_mortgage || '',
          }
          setFifData(merged)
          // Pre-fill closing script ctx from lead
          const cJson = fif.closingJson ? JSON.parse(fif.closingJson) : {}
          setClosingCtx({
            clientName: l.name?.split(' ')[0] || '',
            state: l.state || '',
            mortgagePayment: l.monthly_mortgage || '',
            mortgageBalance: l.mortgage_balance || '',
            clientDOB: l.dob || '',
            height: l.height || '',
            weight: l.weight || '',
            tobacco: l.tobacco_use === 'Yes' ? 'Cigarettes' : l.tobacco_use === 'No' ? 'None' : '',
            ...cJson,
          })
        } catch {
          setFifData(blankFIF())
        }
        setTimeout(() => { loadedRef.current = true }, 300)
      }
    })
  }, [id, router])

  // Debounced autosave — fires 900ms after the last edit
  useEffect(() => {
    if (!loadedRef.current || !lead) return
    setAutoStatus('saving')
    const t = setTimeout(async () => {
      await supabase.from('leads').update({
        name: form.name, email: form.email, dob: form.dob,
        height: form.height, weight: form.weight,
        tobacco_use: form.tobacco_use, co_borrower: form.co_borrower,
        monthly_mortgage: form.monthly_mortgage, notes: JSON.stringify(noteEntries), appt_date: form.appt_date,
        updated_at: new Date().toISOString()
      }).eq('id', id)
      setAutoStatus('saved')
      setTimeout(() => setAutoStatus('idle'), 1500)
    }, 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, noteEntries])

  const handleClosingCtxChange = useCallback((ctx: ClosingCtx) => {
    setClosingCtx(ctx)
    setFifData(prev => {
      const next = { ...prev, closingJson: JSON.stringify(ctx) }
      supabase.from('leads').update({ fif_data: JSON.stringify(next) }).eq('id', id).then(() => {})
      return next
    })
  }, [id])

  async function setDisposition(disp: string, apptDate?: string) {
    if (!lead || !profile) return
    setSettingDisp(disp)
    const meta = DISP_META[disp]
    const isDead = !!meta?.dead
    const hadAppt = !!lead.appt_date   // a booked appointment already existed before this
    const newDialCount = (lead.dial_count || 0) + 1
    // Map disposition → pipeline stage. Plain dials fall through to the Dialed-N bucket.
    const stageMap: Record<string, string> = {
      'Booked': 'Appt Set',
      'Wants callback': 'Follow Up', 'Sit Follow Up': 'Follow Up', 'Sit - Follow Up': 'Follow Up',
      'Appt Showed': 'Appt Showed', 'Sit No Sale': 'Appt Showed', 'Sit - No Sale': 'Appt Showed', 'Appt No Show': 'Appt No Show',
      'Appt Rescheduled': 'Appt Set',
      'Closed': 'Signed', 'Not interested': 'Stale', 'Do not call': 'Stale', 'Wrong number': 'Stale',
    }
    const update: any = {
      disposition: disp,
      dial_count: newDialCount,
      is_dead: isDead,
      pipeline_stage: (() => {
        const computed = stageMap[disp] || dialBucket(newDialCount, profile.dial_mode || 1)
        // Never regress a dial-bucket stage — if the lead was manually placed further ahead,
        // keep it there (or advance it) rather than jumping it backward.
        if (!stageMap[disp]) {
          const DIAL_BUCKETS = ['New', 'Dialed Once', 'Dialed Twice', 'Dialed 3x', 'Dialed 4x']
          const curIdx = PIPELINE_STAGES.indexOf(lead.pipeline_stage || 'New')
          const newIdx = PIPELINE_STAGES.indexOf(computed)
          if (newIdx < curIdx && DIAL_BUCKETS.includes(lead.pipeline_stage || '')) return lead.pipeline_stage
        }
        return computed
      })(),
      updated_at: new Date().toISOString(),
    }
    if (apptDate !== undefined) update.appt_date = apptDate
    await supabase.from('leads').update(update).eq('id', id)
    setLead(l => l ? { ...l, ...update } : l)

    // Tally to Dial Tracker — keep leads / tracker / pipeline in sync.
    // Anything that isn't an in-person appointment OUTCOME is a phone dial.
    const isApptOutcome = !!meta?.appt   // Appt Showed/No Show/Closed
    if (meta?.both) {
      // Sit outcome (Sit - No Sale / Sit - Follow Up). A one-call sit (no prior
      // appointment) counts a fresh dial + appointment; a booked appointment's
      // dial & appt were already counted, so don't double-count.
      if (!hadAppt) {
        await tallyActivity(profile.id, profile.name, 'dials')
        await tallyActivity(profile.id, profile.name, 'appts')
      }
    } else if (!isApptOutcome) {
      await tallyActivity(profile.id, profile.name, 'dials')          // every call counts as a dial
      if (meta?.counts === 'appt') await tallyActivity(profile.id, profile.name, 'appts') // Booked also = an appt
    } else if (meta?.counts === 'sale') {
      await tallyActivity(profile.id, profile.name, 'sales')
    }
    // Any disposition where we actually reached a live person counts as a contact.
    if (meta?.contact) await tallyActivity(profile.id, profile.name, 'contacts')

    setSettingDisp('')
  }

  async function setClientStatus(status: string) {
    if (!lead) return
    await supabase.from('leads').update({ client_status: status }).eq('id', id)
    setLead(l => l ? { ...l, client_status: status } : l)
  }

  async function deleteLead() {
    if (!lead) return
    if (!window.confirm(`Permanently delete ${lead.name}? This cannot be undone.`)) return
    await supabase.from('leads').delete().eq('id', id)
    router.push('/leads')
  }

  async function toggleDead() {
    if (!lead) return
    const next = !lead.is_dead
    await supabase.from('leads').update({ is_dead: next, pipeline_stage: next ? 'Stale' : 'New' }).eq('id', id)
    setLead(l => l ? { ...l, is_dead: next } : l)
  }

  function openApptModal(disp: string) {
    setApptEdit(false)
    setApptDisp(disp)
    setApptType(/follow/i.test(disp) ? 'Follow-Up' : disp === 'Wants callback' ? 'Callback' : 'Close')
    setApptDraft(form.appt_date || '')
    setShowApptModal(true)
  }

  // Remove an appointment booked by mistake
  async function deleteAppt() {
    if (!lead) return
    if (!window.confirm('Delete this appointment? The lead stays, just the appointment is removed.')) return
    await supabase.from('leads').update({ appt_date: null }).eq('id', id)
    setLead(l => l ? { ...l, appt_date: '' } : l)
    setForm(f => ({ ...f, appt_date: '' }))
  }

  // Fix the appointment time without changing the disposition/outcome
  function openEditApptTime() {
    setApptEdit(true)
    setApptDraft(form.appt_date || lead?.appt_date || '')
    setShowApptModal(true)
  }

  async function confirmAppt() {
    if (apptEdit) {
      await supabase.from('leads').update({ appt_date: apptDraft }).eq('id', id)
      setLead(l => l ? { ...l, appt_date: apptDraft } : l)
      setForm(f => ({ ...f, appt_date: apptDraft }))
      setShowApptModal(false)
      return
    }
    await setDisposition(apptDisp, apptDraft)
    await supabase.from('leads').update({ appt_type: apptType }).eq('id', id)
    setLead(l => l ? { ...l, appt_type: apptType } : l)
    setForm(f => ({ ...f, appt_date: apptDraft }))
    setShowApptModal(false)
  }

  if (!profile || !lead) return (
    <Loading />
  )

  const isOwn = lead.agent_id === profile.id
  const firstName = lead.name.split(' ')[0]
  const cleanPhone = lead.phone.replace(/\D/g, '')

  // Build the "from the lead form" rows
  const formRows: { label: string; value: string }[] = []
  if (lead.age) formRows.push({ label: 'Age', value: String(lead.age) })
  if (lead.dob) formRows.push({ label: 'Date of birth', value: lead.dob })
  if (lead.gender) formRows.push({ label: 'Gender', value: lead.gender })
  if (lead.tobacco_use && lead.tobacco_use !== 'Unknown') formRows.push({ label: 'Tobacco use', value: lead.tobacco_use })
  if (lead.co_borrower && lead.co_borrower !== 'Unknown') formRows.push({ label: 'Co-borrower', value: lead.co_borrower })
  if (lead.address) formRows.push({ label: 'Street', value: lead.address })
  if (lead.city) formRows.push({ label: 'City', value: lead.city })
  if (lead.state) formRows.push({ label: 'State', value: lead.state })
  if (lead.zip) formRows.push({ label: 'ZIP', value: lead.zip })
  if (lead.mortgage_balance) formRows.push({ label: 'Mortgage balance', value: lead.mortgage_balance })
  if (lead.monthly_mortgage) formRows.push({ label: 'Monthly mortgage', value: `$${Number(lead.monthly_mortgage).toLocaleString()}` })
  if (lead.lender) formRows.push({ label: 'Lender', value: lead.lender })

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={profile.name} />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Back + call-queue navigation */}
        <div className="flex items-center justify-between mb-6 gap-3">
          <button onClick={() => router.push(fromPipeline ? '/pipeline' : '/leads')} className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition">
            <ArrowLeft size={16} /> {fromPipeline ? 'Pipeline' : 'All Leads'}
          </button>
          {queueNav && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium mr-1">Call queue {queueNav.pos}/{queueNav.total}</span>
              <button
                onClick={() => queueNav.prev && router.push(`/leads/${queueNav.prev}?queue=1`)}
                disabled={!queueNav.prev}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition">
                <ArrowLeft size={14} /> Prev
              </button>
              <button
                onClick={() => queueNav.next && router.push(`/leads/${queueNav.next}?queue=1`)}
                disabled={!queueNav.next}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold gold-gradient text-black hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition">
                Next lead <ArrowLeft size={14} className="rotate-180" />
              </button>
            </div>
          )}
        </div>

        {/* Name + actions */}
        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-black text-white">{lead.name}</h1>
            {lead.is_dead && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-950 text-red-400 border border-red-800">DEAD LEAD</span>}
            {/* Client status only matters once they're a client (Closed) */}
            {isOwn && lead.disposition === 'Closed' && (
              <select value={lead.client_status || 'Active'} onChange={e => setClientStatus(e.target.value)}
                className={clsx('text-xs font-bold rounded-full px-3 py-1 border focus:outline-none cursor-pointer',
                  lead.client_status === 'Lapsed' ? 'bg-red-900 text-red-300 border-red-700' :
                  lead.client_status === 'Pending' ? 'bg-yellow-900 text-yellow-300 border-yellow-700' :
                  'bg-green-900 text-green-300 border-green-700')}>
                {CLIENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-400">{lead.phone || 'No phone'}</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full uppercase tracking-wider">{lead.source}</span>
          </div>

          {/* Book / Close / Dead */}
          {isOwn && (
            <div className="flex gap-3 mt-3 flex-wrap">
              {cleanPhone && (
                <a href={`tel:${cleanPhone}`}
                  className="flex items-center gap-2 gold-gradient text-black font-black px-5 py-2.5 rounded-xl hover:opacity-90 transition">
                  <Phone size={16} /> Call {lead.name.split(' ')[0]}
                </a>
              )}
              <button onClick={() => openApptModal('Booked')}
                className="flex items-center gap-2 bg-gray-900 border border-gray-700 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition">
                <Calendar size={16} /> Book appointment
              </button>
              <button onClick={() => {
                sessionStorage.setItem('prefillPolicy', JSON.stringify({
                  client_name: lead.name,
                  insured_dob: form.dob || lead.dob || '',
                  insured_address: [lead.address, lead.city, lead.state, lead.zip].filter(Boolean).join(', '),
                }))
                router.push('/policies?new=1')
              }}
                className="flex items-center gap-2 bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-blue-500 transition">
                <Zap size={16} /> Close Sale
              </button>
              <button onClick={toggleDead}
                className={clsx('flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl transition border',
                  lead.is_dead ? 'bg-green-900/30 border-green-700 text-green-400 hover:bg-green-900/50' : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-red-400')}>
                {lead.is_dead ? <><Heart size={16} /> Reactivate</> : <><HeartCrack size={16} /> Mark Dead</>}
              </button>
              <button onClick={deleteLead}
                className="flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl transition border bg-red-950/40 border-red-800 text-red-400 hover:bg-red-900/50">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}

          {/* How did the call go */}
          {isOwn && (
            <div className="card-gold mt-5 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-1">
                <p className="text-lg font-black gold-text">How did the call go?</p>
                <span className="text-xs text-gray-500">Current: {lead.disposition}</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Tap an outcome — auto-tallies to your Dial Tracker.</p>
              <div className="flex flex-wrap gap-2">
                {DISPOSITIONS.filter(d => !d.appt).map(d => (
                  <button key={d.label}
                    onClick={() => d.books ? openApptModal(d.label) : setDisposition(d.label)}
                    disabled={settingDisp === d.label}
                    className={clsx(
                      'px-4 py-2 rounded-xl text-sm font-bold border transition bg-black',
                      d.btn,
                      lead.disposition === d.label && 'ring-2 ring-yellow-500',
                      settingDisp === d.label && 'opacity-50'
                    )}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-600 mt-4">
            DIALS <span className="text-gray-400 font-bold">{lead.dial_count || 0}</span>
            <span className="mx-2">·</span>
            CREATED <span className="text-gray-400 font-bold">{new Date(lead.created_at).toLocaleDateString()}</span>
          </p>
        </div>

        {/* TAB BAR */}
        <div className="flex items-center gap-1 mb-6 border-b" style={{ borderColor: 'var(--divider)' }}>
          {([
            { id: 'overview', label: 'Overview' },
            { id: 'script', label: 'Closing Script' },
            { id: 'fif', label: 'FIF Form' },
          ] as { id: TabId; label: string }[]).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={clsx('px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition',
                activeTab === t.id ? 'border-yellow-500 text-yellow-400' : 'border-transparent text-gray-500 hover:text-gray-300')}>
              {t.label}
            </button>
          ))}
          {(activeTab === 'script' || activeTab === 'fif') && (
            <span className="ml-auto text-xs text-green-500 font-medium flex items-center gap-1 pb-2">
              <CheckCircle size={11} /> Auto-saves to lead
            </span>
          )}
        </div>

        {/* ───── SCRIPT TAB ───── */}
        {activeTab === 'script' && (
          <LeadClosingScript
            agentName={profile.name}
            initialCtx={closingCtx}
            onCtxChange={handleClosingCtxChange}
          />
        )}

        {/* ───── FIF TAB ───── */}
        {activeTab === 'fif' && (
          <LeadFIF
            leadId={id}
            initialData={fifData}
            onSave={setFifData}
          />
        )}

        {/* ───── OVERVIEW TAB ───── */}
        {activeTab === 'overview' && <>

        {/* APPOINTMENT — shows once booked, with outcome buttons */}
        {isOwn && lead.appt_date && (
          <div className="card p-5 rounded-2xl mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-yellow-500 uppercase tracking-wider">Appointment</p>
                  {lead.appt_type && (
                    <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold',
                      lead.appt_type === 'Follow-Up' ? 'bg-cyan-600 text-white' : lead.appt_type === 'Callback' ? 'bg-purple-600 text-white' : 'bg-green-600 text-white')}>
                      {lead.appt_type === 'Close' ? 'Close Appt' : lead.appt_type}
                    </span>
                  )}
                </div>
                <p className="text-white font-bold mt-1">{new Date(lead.appt_date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <a href={googleCalLink({
                  title: (lead.appt_type === 'Follow-Up' || lead.disposition === 'Sit Follow Up' || lead.disposition === 'Sit - Follow Up') ? `Follow Up - ${lead.name}`
                    : (lead.disposition === 'Wants callback' || lead.appt_type === 'Callback') ? `${lead.name} - Callback`
                    : `${lead.name} - Mortgage Protection`,
                  start: lead.appt_date,
                  guestEmail: lead.email,
                  details: [
                    lead.phone && `Phone: ${lead.phone}`,
                    lead.email && `Email: ${lead.email}`,
                    lead.address && `Address: ${[lead.address, lead.city, lead.state, lead.zip].filter(Boolean).join(', ')}`,
                    (form.notes || lead.notes) && `Notes: ${form.notes || lead.notes}`,
                  ].filter(Boolean).join('\n'),
                })} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs bg-gray-900 border border-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition">
                  <Calendar size={13} /> Google Calendar
                </a>
                <button onClick={openEditApptTime}
                  className="text-xs bg-gray-900 border border-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition">
                  Edit time
                </button>
                <button onClick={deleteAppt}
                  className="text-xs bg-red-950/40 border border-red-800 text-red-400 hover:bg-red-900/50 px-3 py-1.5 rounded-lg transition">
                  Delete
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">How did the appointment go?</p>
            <div className="flex flex-wrap gap-2">
              {DISPOSITIONS.filter(d => d.appt || d.both).map(d => (
                <button key={d.label} onClick={() => (d.books || d.label === 'Appt Rescheduled') ? openApptModal(d.label) : setDisposition(d.label)} disabled={settingDisp === d.label}
                  className={clsx('px-4 py-2 rounded-xl text-sm font-bold border transition bg-black', d.btn,
                    lead.disposition === d.label && 'ring-2 ring-yellow-500', settingDisp === d.label && 'opacity-50')}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CLIENT — what they signed up for (shows once a policy is logged for them) */}
        {clientPolicies.length > 0 && (
          <div className="card-gold p-6 rounded-2xl mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black gold-text uppercase tracking-wider">📋 Policy — What They Signed Up For</h2>
              <span className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-full font-bold">● CLIENT</span>
            </div>
            <div className="space-y-3">
              {clientPolicies.map(p => {
                const monthly = p.premium ? Number(p.premium) : (Number(p.apv) || 0) / 12
                const sc: Record<string, string> = { Submitted: 'bg-blue-500 text-white', Approved: 'bg-yellow-400 text-black', Issued: 'bg-green-500 text-white', Chargeback: 'bg-red-500 text-white' }
                return (
                  <button key={p.id} onClick={() => router.push('/policies')}
                    className="w-full text-left card-2 p-4 rounded-xl hover:border-yellow-500/40 transition">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-white">{p.policy_type || p.product_type || 'Policy'}</span>
                      <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', sc[p.status] || 'bg-zinc-500 text-white')}>{p.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><p className="text-xs text-gray-500 mb-0.5">Carrier</p><p className="text-sm font-medium text-white truncate">{p.carrier || '—'}</p></div>
                      <div><p className="text-xs text-gray-500 mb-0.5">Annual Premium</p><p className="text-sm font-black gold-text">${(Number(p.apv) || 0).toLocaleString()}</p></div>
                      <div><p className="text-xs text-gray-500 mb-0.5">Monthly</p><p className="text-sm font-medium text-white">${monthly.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p></div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* FROM THE LEAD FORM */}
        {formRows.length > 0 && (
          <div className="card p-6 rounded-2xl mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider">From the Lead Form</h2>
              <span className="text-xs bg-green-900 text-green-400 px-2 py-1 rounded-full font-bold">IMPORTED</span>
            </div>
            <div className="space-y-3">
              {formRows.map(row => (
                <div key={row.label} className="flex justify-between gap-4 border-b border-gray-900 pb-3 last:border-0">
                  <span className="text-gray-500 flex-shrink-0">{row.label}</span>
                  <span className="text-white font-medium text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEAD PROFILE */}
        {isOwn && (
          <div className="card p-6 rounded-2xl mb-6">
            <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-5">Lead Profile</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" />
                <p className="text-xs text-gray-600 mt-1">First word is treated as the first name everywhere else.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="lead@example.com"
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" />
                <p className="text-xs text-gray-600 mt-1">Used to send a calendar invite when you book.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Date of birth {ageFromDob(form.dob) != null && <span className="text-gray-500 font-normal">· age {ageFromDob(form.dob)}</span>}</label>
                <input type="text" inputMode="numeric" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: maskDob(e.target.value) }))}
                  placeholder="MM/DD/YYYY" maxLength={10}
                  className="block w-full max-w-[17rem] bg-black border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Height</label>
                <input value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                  placeholder={`5'10"`}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Weight (lbs)</label>
                <input value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                  placeholder="180"
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Tobacco use (last 12 months)</label>
                <Toggle value={form.tobacco_use} onChange={v => setForm(f => ({ ...f, tobacco_use: v }))} options={['Yes', 'No', 'Unknown']} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Co-borrower on mortgage</label>
                <Toggle value={form.co_borrower} onChange={v => setForm(f => ({ ...f, co_borrower: v }))} options={['Yes', 'No', 'Unknown']} />
              </div>
            </div>
          </div>
        )}

        {/* YOUR NOTES */}
        {isOwn && (
          <div className="card p-6 rounded-2xl mb-6">
            <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-5">Your Notes</h2>

            <div className="mb-5">
              <label className="block text-sm font-bold text-gray-300 mb-1">Monthly mortgage amount (USD)</label>
              <input type="number" min="0" value={form.monthly_mortgage} onChange={e => setForm(f => ({ ...f, monthly_mortgage: e.target.value }))}
                placeholder="1850"
                className="w-full md:w-1/2 bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" />
              {/* Equity / mortgage protection coverage quoter */}
              {Number(form.monthly_mortgage) > 0 && (
                <>
                  <p className="text-xs text-gray-500 mt-3 mb-2">Mortgage protection coverage <span className="text-gray-600">· monthly payment × months</span></p>
                  <div className="flex flex-wrap gap-2">
                    {[6, 9, 12, 18, 24].map(mo => (
                      <div key={mo} className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm">
                        <span className="font-bold text-white">{mo} mo</span>
                        <span className="text-gray-500"> · </span>
                        <span className="gold-text font-bold">${(Number(form.monthly_mortgage) * mo).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Notes</label>
              {/* Add new note */}
              <div className="flex gap-2 mb-3">
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && newNote.trim()) {
                      const entry = { ts: new Date().toISOString(), text: newNote.trim() }
                      setNoteEntries(prev => [entry, ...prev])
                      setNewNote('')
                    }
                  }}
                  rows={2}
                  placeholder="Add a note… (⌘Enter to save)"
                  className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 resize-none text-sm"
                />
                <button
                  type="button"
                  disabled={!newNote.trim()}
                  onClick={() => {
                    if (!newNote.trim()) return
                    const entry = { ts: new Date().toISOString(), text: newNote.trim() }
                    setNoteEntries(prev => [entry, ...prev])
                    setNewNote('')
                  }}
                  className="px-4 py-2 gold-gradient text-black font-black rounded-lg text-sm disabled:opacity-40 self-end"
                >
                  Add
                </button>
              </div>
              {/* Note history */}
              {noteEntries.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {noteEntries.map((entry, i) => {
                    const d = new Date(entry.ts)
                    const now = new Date()
                    const mins = Math.floor((now.getTime() - d.getTime()) / 60000)
                    const timeLabel = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago`
                      : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined }) + ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                    return (
                      <div key={i} className="rounded-lg border border-gray-800 bg-black px-4 py-3 group relative">
                        <p className="text-[11px] text-gray-500 mb-1">{timeLabel}</p>
                        <p className="text-sm text-gray-200 whitespace-pre-wrap">{entry.text}</p>
                        <button
                          type="button"
                          onClick={() => setNoteEntries(prev => prev.filter((_, j) => j !== i))}
                          className="absolute top-2 right-2 text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs"
                        >✕</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Autosave indicator */}
        {isOwn && (
          <div className="flex items-center justify-center gap-2 text-sm py-2 text-gray-500">
            {autoStatus === 'saving' && <><div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /> Saving…</>}
            {autoStatus === 'saved' && <><CheckCircle size={16} className="text-green-500" /> All changes saved</>}
            {autoStatus === 'idle' && <span className="text-gray-600">Changes save automatically</span>}
          </div>
        )}

        </> /* end overview tab */}

      </div>
      {/* Book Appointment Modal */}
      {showApptModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="card-gold w-full max-w-sm p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-white">{apptEdit ? 'Edit Time' : apptDisp === 'Wants callback' ? 'Schedule Callback' : (apptDisp === 'Sit Follow Up' || apptDisp === 'Sit - Follow Up') ? 'Schedule Follow-Up' : apptDisp === 'Appt Rescheduled' ? 'Reschedule' : 'Book Scheduled Call'}</h2>
              <button onClick={() => setShowApptModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            {!apptEdit && apptDisp === 'Booked' && (
              <div className="mb-4">
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Appointment for</label>
                <div className="flex gap-2">
                  {[['Close', 'Close Appointment'], ['Follow-Up', 'Follow-Up']].map(([val, lbl]) => (
                    <button key={val} type="button" onClick={() => setApptType(val)}
                      className={clsx('flex-1 px-3 py-2 rounded-lg text-sm font-bold border transition',
                        apptType === val ? 'gold-gradient text-black border-transparent' : 'bg-black border-gray-700 text-gray-400 hover:text-white')}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Date & Time <span className="text-gray-600 normal-case">(15-min slots)</span></label>
            <input type="datetime-local" step={900} value={apptDraft} onChange={e => setApptDraft(e.target.value)}
              className="block w-full max-w-[17rem] bg-black border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500 mb-4" />
            <button onClick={confirmAppt} disabled={!apptDraft}
              className="w-full gold-gradient text-black font-black py-3 rounded-xl hover:opacity-90 transition disabled:opacity-40">
              {apptEdit ? 'Save New Time' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      )}
      <ScriptWidget lead={{
        name: lead.name,
        address: [lead.address, lead.city, lead.state, lead.zip].filter(Boolean).join(', '),
        lender: lead.lender,
        dob: form.dob || lead.dob,
        age: lead.age,
        mortgage: lead.mortgage_balance,
      }} />
    </div>
  )
}
