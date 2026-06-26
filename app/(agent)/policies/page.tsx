'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import { PlusCircle, X, Pencil, Trash2, ChevronDown, Upload, Eye, ShieldCheck, UserPlus, Phone, Mail } from 'lucide-react'
import { localDate } from '@/lib/date'
import clsx from 'clsx'
import { CARRIERS, CHARGEBACK_REASONS, commissionableAP, appFeeFor } from '@/lib/constants'
import { CARRIER_PRODUCTS, CARRIER_PRODUCT_RATES } from '@/lib/carrierProducts'
import { useToast } from '@/components/Toast'

type Beneficiary = { name: string; relationship: string; percent: string; phone: string; dob: string; type: 'Primary' | 'Contingent' }

type Policy = {
  id: string
  agent_id: string
  agent_name: string
  client_name: string
  policy_type: string
  carrier: string
  apv: number
  face_amount: number
  date_written: string
  status: 'Submitted' | 'Approved' | 'Issued' | 'Chargeback'
  notes: string
  year: number
  month: number
  comp_percent: number
  advance_rate: number
  commission_paid: number
  commission_status: string
  product_type: string
  owner_name: string
  insured_dob: string
  insured_address: string
  death_benefit: number
  premium: number
  beneficiaries: Beneficiary[]
  client_status: string
  flag_reason: string
  policy_start_date: string
  chargeback_remaining: number
  client_phone: string
  client_email: string
  is_split?: boolean
  split_percent?: number
  split_with_name?: string
  split_with_id?: string
  gross_ap?: number
}

type Profile = { id: string; name: string; role: string; manager_id: string | null }

const STATUS_COLORS: Record<string, string> = {
  Submitted: 'bg-blue-500 text-white',
  Approved: 'bg-yellow-400 text-black',
  Issued: 'bg-green-500 text-white',
  Chargeback: 'bg-red-500 text-white',
}

// Client health status — separate from the policy's submission status
const CLIENT_STATUSES = ['Active', 'Pending', 'Flagged', 'Lapsed', 'Cancelled']
const CLIENT_COLORS: Record<string, string> = {
  Active:    'bg-green-500 text-white',
  Pending:   'bg-yellow-400 text-black',
  Flagged:   'bg-orange-500 text-white',
  Lapsed:    'bg-red-500 text-white',
  Cancelled: 'bg-zinc-600 text-white',
}
// left-border accent on each row
const CLIENT_BORDER: Record<string, string> = {
  Active: 'border-l-green-500', Pending: 'border-l-yellow-500', Flagged: 'border-l-orange-500',
  Lapsed: 'border-l-red-500', Cancelled: 'border-l-gray-500',
}
const FLAG_REASONS = ['Potential lapse', 'Potential cancellation', 'Potential chargeback', 'Missed payment', 'Other']

const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const ADVANCE_OPTIONS = [
  { label: '75% (9-mo advance)', value: 75 },
  { label: '50% (6-mo advance)', value: 50 },
  { label: '100% (full advance)', value: 100 },
  { label: '25% (3-mo advance)', value: 25 },
  { label: 'As earned (no advance)', value: 0 },
]

const emptyForm = {
  client_name: '', policy_type: '', carrier: '',
  apv: '', face_amount: '', date_written: localDate(),
  status: 'Submitted' as Policy['status'], notes: '',
  comp_percent: '100', advance_rate: '75', commission_paid: '', commission_status: 'Pending',
  chargeback_reason: '',
  product_type: '', owner_name: '', insured_dob: '', insured_address: '',
  death_benefit: '', premium: '',
  client_status: 'Active', flag_reason: '', policy_start_date: '', chargeback_remaining: '',
  client_phone: '', client_email: '',
  is_split: false, split_percent: '60', split_with_id: '', split_with_name: '',
}

const PRODUCT_TYPES = ['Whole Life', 'Term Life', 'IUL', 'Final Expense', 'GUL', 'Mortgage Protection', 'Annuity', 'Other']

export default function PoliciesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Policy | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterAgent, setFilterAgent] = useState('Mine')
  const [agents, setAgents] = useState<Profile[]>([])
  const [isManager, setIsManager] = useState(false)
  const [benes, setBenes] = useState<Beneficiary[]>([])
  const [detail, setDetail] = useState<Policy | null>(null)
  const [tab, setTab] = useState<'clients' | 'sales'>('clients')
  const [myLevel, setMyLevel] = useState(80)
  const [leadContacts, setLeadContacts] = useState<Record<string, { id: string; phone: string; email: string }>>({})
  const [parsing, setParsing] = useState(false)
  const [parsePct, setParsePct] = useState(0)
  const [importing, setImporting] = useState(false)
  const appRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)

  function addBene(type: 'Primary' | 'Contingent') {
    setBenes(b => [...b, { name: '', relationship: '', percent: '', phone: '', dob: '', type }])
  }
  function updateBene(i: number, patch: Partial<Beneficiary>) {
    setBenes(b => b.map((x, j) => j === i ? { ...x, ...patch } : x))
  }
  function removeBene(i: number) {
    setBenes(b => b.filter((_, j) => j !== i))
  }

  async function handleAppUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true)
    setParsePct(8)
    // Single request — ramp a simulated bar toward 90% while it reads, finish at 100%.
    const ramp = setInterval(() => setParsePct(p => (p < 85 ? p + Math.max(1, Math.round((85 - p) / 8)) : p)), 250)
    try {
      // Extract the PDF text in the BROWSER so large applications aren't blocked by
      // the serverless upload size limit, then send just the text to the parser.
      let text = ''
      try {
        const { extractText, getDocumentProxy } = await import('unpdf')
        const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()))
        const er = await extractText(pdf, { mergePages: true })
        text = Array.isArray(er.text) ? er.text.join('\n') : er.text
      } catch { text = '' }
      let res: Response
      if (text && text.replace(/\s/g, '').length >= 40) {
        res = await fetch('/api/parse-application', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      } else if (file.size > 4 * 1024 * 1024) {
        clearInterval(ramp); setTimeout(() => { setParsing(false); setParsePct(0) }, 200)
        toast('This PDF is too large or image-only to read here — please enter the details manually.', 'error')
        if (appRef.current) appRef.current.value = ''
        return
      } else {
        const fd = new FormData(); fd.append('file', file)
        res = await fetch('/api/parse-application', { method: 'POST', body: fd })
      }
      const j = await res.json()
      clearInterval(ramp); setParsePct(100)
      if (j.error) { toast('Could not read application: ' + j.error, 'error') }
      else {
        const prem = j.premium ? Number(j.premium) : 0
        setForm(f => ({
          ...f,
          client_name: j.insured_name || f.client_name,
          owner_name: j.owner_name || f.owner_name,
          insured_dob: j.dob || f.insured_dob,
          insured_address: j.address || f.insured_address,
          client_phone: j.phone || f.client_phone,
          client_email: j.email || f.client_email,
          face_amount: j.death_benefit ? String(j.death_benefit) : f.face_amount,
          premium: prem ? String(prem) : f.premium,
          apv: prem ? (prem * 12).toFixed(2) : f.apv,        // auto-calc annual from monthly
          carrier: j.carrier || f.carrier,
          policy_type: j.product_type || f.policy_type,
        }))
        if (j.beneficiaries?.length) setBenes(j.beneficiaries)
        toast('Application read — review the pre-filled fields before saving', 'success')
      }
    } catch { clearInterval(ramp); toast('Error reading application PDF', 'error') }
    setTimeout(() => { setParsing(false); setParsePct(0) }, 300)
    if (appRef.current) appRef.current.value = ''
  }

  // ---- Bulk CSV import of past policies ----
  function parseCsv(text: string): string[][] {
    const rows: string[][] = []
    let row: string[] = [], field = '', inQ = false
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    for (let i = 0; i < text.length; i++) {
      const c = text[i]
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false }
        else field += c
      } else if (c === '"') inQ = true
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else field += c
    }
    if (field.length || row.length) { row.push(field); rows.push(row) }
    return rows.filter(r => r.some(c => c.trim() !== ''))
  }

  // Normalize a date in YYYY-MM-DD or MM/DD/YYYY (or M/D/YY) to YYYY-MM-DD
  function normDate(s: string): string | null {
    s = (s || '').trim()
    if (!s) return null
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
    if (m) { let y = m[3]; if (y.length === 2) y = '20' + y; return `${y}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` }
    return null
  }

  function downloadTemplate() {
    const headers = ['client name', 'carrier', 'product', 'face amount', 'annual premium', 'status', 'date written', 'comp %', 'advance %', 'commission paid', 'commission status', 'client status']
    const sample = ['John Smith', 'Mutual of Omaha', 'Term Life', '250000', '1200', 'Issued', '03/14/2024', '100', '75', '', 'Paid', 'Active']
    const csv = headers.join(',') + '\n' + sample.join(',') + '\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'policy-import-template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setImporting(true)
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length < 2) { toast('CSV has no data rows', 'error'); return }
      const head = rows[0].map(h => h.trim().toLowerCase())
      const col = (...names: string[]) => { for (const n of names) { const i = head.indexOf(n); if (i >= 0) return i } return -1 }
      const ci = {
        name: col('client name', 'client', 'name', 'insured'),
        carrier: col('carrier', 'company'),
        product: col('product', 'product type', 'policy type', 'plan'),
        face: col('face amount', 'face', 'death benefit', 'coverage'),
        apv: col('annual premium', 'ap', 'apv', 'annual', 'annualized premium'),
        monthly: col('monthly premium', 'monthly', 'premium', 'modal premium'),
        status: col('status', 'policy status'),
        date: col('date written', 'submit date', 'date', 'submitted', 'date submitted', 'app date'),
        comp: col('comp %', 'comp percent', 'comp', 'commission %', 'comp rate'),
        adv: col('advance %', 'advance rate', 'advance'),
        paid: col('commission paid', 'paid', 'commission'),
        commStatus: col('commission status', 'comm status'),
        clientStatus: col('client status'),
      }
      if (ci.name < 0) { toast('CSV needs at least a "client name" column', 'error'); return }
      const get = (r: string[], i: number) => i >= 0 ? (r[i] || '').trim() : ''
      const num = (v: string) => Number(String(v).replace(/[$,]/g, '')) || 0
      const STATUSES = ['Submitted', 'Approved', 'Issued', 'Chargeback']
      const payloads: any[] = []
      const errors: string[] = []
      rows.slice(1).forEach((r, idx) => {
        const name = get(r, ci.name)
        if (!name) return
        const d = normDate(get(r, ci.date))
        const dY = d ? Number(d.slice(0, 4)) : new Date().getFullYear()
        const dM = d ? Number(d.slice(5, 7)) : (new Date().getMonth() + 1)
        const monthly = num(get(r, ci.monthly))
        let apv = num(get(r, ci.apv))
        if (!apv && monthly) apv = monthly * 12
        let status = get(r, ci.status)
        status = STATUSES.find(s => s.toLowerCase() === status.toLowerCase()) || 'Issued'
        const face = num(get(r, ci.face))
        if (!d) errors.push(`Row ${idx + 2} (${name}): no valid date, used today`)
        payloads.push({
          agent_id: profile.id, agent_name: profile.name,
          client_name: name,
          carrier: get(r, ci.carrier),
          policy_type: get(r, ci.product), product_type: get(r, ci.product),
          apv, face_amount: face, death_benefit: face,
          premium: monthly,
          date_written: d || localDate(), year: dY, month: dM,
          status,
          comp_percent: ci.comp >= 0 && get(r, ci.comp) ? num(get(r, ci.comp)) : 100,
          advance_rate: ci.adv >= 0 && get(r, ci.adv) ? num(get(r, ci.adv)) : 75,
          commission_paid: num(get(r, ci.paid)),
          commission_status: get(r, ci.commStatus) || (num(get(r, ci.paid)) > 0 ? 'Paid' : 'Pending'),
          client_status: get(r, ci.clientStatus) || 'Active',
          notes: 'Imported from CSV',
        })
      })
      if (!payloads.length) { toast('No valid rows found in CSV', 'error'); return }
      if (payloads.length > 5000) { toast('That CSV has over 5,000 rows — please split it into smaller files.', 'error'); return }
      // Each request is raced against a timeout so a stalled connection can never
      // wedge the page on "Importing…" forever.
      const withTimeout = <T,>(pr: PromiseLike<T>, ms: number): Promise<T> =>
        Promise.race([pr as Promise<T>, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('Request timed out — check your connection and try again')), ms))])
      let inserted = 0
      for (let i = 0; i < payloads.length; i += 100) {
        const chunk = payloads.slice(i, i + 100)
        const { error } = await withTimeout(supabase.from('policy_log').insert(chunk), 25000) as { error: { message: string } | null }
        if (error) { toast(`Import error after ${inserted}: ${error.message}`, 'error'); break }
        inserted += chunk.length
      }
      if (inserted) {
        toast(`Imported ${inserted} ${inserted === 1 ? 'policy' : 'policies'}${errors.length ? ` (${errors.length} date warnings)` : ''}`, 'success')
        try { await withTimeout(loadPolicies(profile.id, filterAgent, agents), 15000) } catch { /* list refreshes on next load */ }
      }
    } catch (err: any) {
      toast('Could not read CSV: ' + (err?.message || 'unknown error'), 'error')
    } finally {
      setImporting(false)
      if (csvRef.current) csvRef.current.value = ''
    }
  }

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
      // Render even if the profile row couldn't load, so we never hang on Loading.
      setProfile(p || { id: session.user.id, name: fallbackName, role: 'agent', manager_id: null } as any)
      setMyLevel((p as any)?.contract_level ?? 80)

      // Check if manager (has downline agents)
      const { data: downline } = await supabase.from('profiles').select('*').eq('manager_id', session.user.id)
      if (p?.role === 'manager' || (downline && downline.length > 0)) {
        setIsManager(true)
        setAgents(downline || [])
      }

      await loadPolicies(session.user.id, p?.role === 'manager' || (downline && downline.length > 0) ? 'All' : 'Mine', downline || [])

      // Lead contacts (phone/email) keyed by name, to enrich the client detail card
      const { data: leadRows } = await supabase.from('leads').select('id,name,phone,email').eq('agent_id', session.user.id)
      const map: Record<string, { id: string; phone: string; email: string }> = {}
      ;(leadRows || []).forEach(l => { if (l.name) map[l.name.trim().toLowerCase()] = { id: l.id, phone: l.phone || '', email: l.email || '' } })
      setLeadContacts(map)
    })
  }, [router])

  // Pre-fill the Add Policy form when arriving from a lead's "Close Sale"
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (new URLSearchParams(window.location.search).get('new') !== '1') return
    const raw = sessionStorage.getItem('prefillPolicy')
    if (!raw) return
    try {
      const pre = JSON.parse(raw)
      setEditing(null)
      setForm({ ...emptyForm, ...pre })
      setBenes([])
      setShowForm(true)
    } catch {}
    sessionStorage.removeItem('prefillPolicy')
    window.history.replaceState({}, '', '/policies')
  }, [])

  async function loadPolicies(myId: string, agentFilter: string, downlineAgents: Profile[]) {
    let query = supabase.from('policy_log').select('*').order('date_written', { ascending: false })
    if (agentFilter === 'Mine') {
      query = query.eq('agent_id', myId)
    } else if (agentFilter !== 'All') {
      query = query.eq('agent_id', agentFilter)
    } else {
      // Manager sees self + downline
      const ids = [myId, ...downlineAgents.map(a => a.id)]
      query = query.in('agent_id', ids)
    }
    const { data } = await query
    setPolicies(data || [])
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    // Parse the YYYY-MM-DD string directly — NOT new Date() (which shifts to the prev day in US time zones)
    const [dyStr, dmStr] = (form.date_written || '').split('-')
    const dY = Number(dyStr) || new Date().getFullYear()
    const dM = Number(dmStr) || (new Date().getMonth() + 1)
    // App split: store each agent's CREDITED share in apv (full × take-home %), keep
    // the full app premium in gross_ap. Keeps AP, commission, and overrides accurate.
    const fullAP = Number(form.apv) || 0
    const myPct = (form as any).is_split ? Math.min(100, Math.max(1, Number(form.split_percent) || 100)) : 100
    const creditedAP = Math.round(fullAP * myPct) / 100
    const payload = {
      agent_id: profile.id,
      agent_name: profile.name,
      client_name: form.client_name,
      policy_type: form.policy_type,
      carrier: form.carrier,
      apv: creditedAP,
      gross_ap: fullAP,
      is_split: !!(form as any).is_split,
      split_percent: myPct,
      split_with_name: (form as any).is_split ? (form.split_with_name || null) : null,
      split_with_id: ((form as any).is_split && form.split_with_id) ? form.split_with_id : null,
      face_amount: Number(form.face_amount) || 0,
      date_written: form.date_written,
      status: form.status,
      notes: form.notes,
      year: dY,
      month: dM,
      comp_percent: Number(form.comp_percent) || 0,
      advance_rate: Number(form.advance_rate) || 0,
      commission_paid: Number(form.commission_paid) || 0,
      commission_status: form.commission_status,
      chargeback_reason: form.status === 'Chargeback' ? form.chargeback_reason : '',
      product_type: form.policy_type,
      owner_name: form.owner_name,
      insured_dob: form.insured_dob,
      insured_address: form.insured_address,
      death_benefit: Number(form.face_amount) || 0,   // death benefit == face amount
      premium: Number(form.premium) || 0,
      beneficiaries: benes.filter(b => b.name.trim()),
      client_status: form.client_status || 'Active',
      flag_reason: ['Flagged', 'Lapsed', 'Cancelled'].includes(form.client_status) ? form.flag_reason : '',
      policy_start_date: form.policy_start_date || null,
      chargeback_remaining: Number(form.chargeback_remaining) || 0,
      client_phone: form.client_phone,
      client_email: form.client_email,
    }
    // Once a policy is truly Approved/Issued, clear any manual pipeline placement
    // so the client auto-snaps to "Active Client" on the pipeline board.
    if (['Approved', 'Issued'].includes(form.status)) (payload as any).pipeline_stage = null
    if (editing) {
      await supabase.from('policy_log').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('policy_log').insert(payload)
    }
    // Auto-move the matching lead through the post-sale pipeline by policy status:
    //   Approved/Issued → Active Client; Submitted → Signed (unless already advanced
    //   to Pending Approval / Active Client, so manual progress isn't yanked back).
    if (form.client_name) {
      // Match the lead by FIRST + LAST name (ignore middle initials) so a policy for
      // "Rodolfo M Ramon" still moves the "Rodolfo Ramon" lead instead of leaving it.
      const parts = form.client_name.trim().split(/\s+/)
      const namePat = parts.length >= 2 ? `${parts[0]}% ${parts[parts.length - 1]}` : form.client_name.trim()
      if (['Approved', 'Issued'].includes(form.status)) {
        await supabase.from('leads').update({ pipeline_stage: 'Active Client', disposition: 'Closed' })
          .eq('agent_id', profile.id).ilike('name', namePat)
      } else if (form.status === 'Submitted') {
        await supabase.from('leads').update({ pipeline_stage: 'Signed', disposition: 'Closed' })
          .eq('agent_id', profile.id).ilike('name', namePat)
          .not('pipeline_stage', 'in', '("Pending Approval","Active Client")')
      }
    }
    setSaving(false)
    setShowForm(false)
    setEditing(null)
    setForm({ ...emptyForm })
    setBenes([])
    toast(editing ? 'Policy updated' : 'Policy added', 'success')
    await loadPolicies(profile.id, filterAgent, agents)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this policy?')) return
    await supabase.from('policy_log').delete().eq('id', id)
    setPolicies(p => p.filter(x => x.id !== id))
  }

  function openEdit(p: Policy) {
    setEditing(p)
    setForm({
      client_name: p.client_name, policy_type: p.policy_type, carrier: p.carrier,
      // Show the FULL app premium when editing a split (gross_ap), else the apv.
      apv: String(p.gross_ap ?? p.apv), face_amount: String(p.face_amount),
      is_split: !!p.is_split, split_percent: String(p.split_percent || 60),
      split_with_id: p.split_with_id || '', split_with_name: p.split_with_name || '',
      date_written: p.date_written, status: p.status, notes: p.notes,
      comp_percent: String(p.comp_percent ?? 100), advance_rate: String(p.advance_rate ?? 75),
      commission_paid: p.commission_paid ? String(p.commission_paid) : '',
      commission_status: p.commission_status || 'Pending',
      chargeback_reason: (p as any).chargeback_reason || '',
      product_type: p.product_type || '', owner_name: p.owner_name || '',
      insured_dob: p.insured_dob || '', insured_address: p.insured_address || '',
      death_benefit: p.death_benefit ? String(p.death_benefit) : '',
      premium: p.premium ? String(p.premium) : '',
      client_status: p.client_status || 'Active', flag_reason: p.flag_reason || '',
      policy_start_date: p.policy_start_date || '', chargeback_remaining: p.chargeback_remaining ? String(p.chargeback_remaining) : '',
      client_phone: p.client_phone || '', client_email: p.client_email || '',
    })
    setBenes(Array.isArray(p.beneficiaries) ? p.beneficiaries : [])
    setShowForm(true)
  }

  const filtered = policies.filter(p => filterStatus === 'All' || p.status === filterStatus)

  const totals = {
    submitted: filtered.filter(p => ['Submitted','Approved','Issued'].includes(p.status)).reduce((s, p) => s + p.apv, 0),
    issued: filtered.filter(p => ['Approved','Issued'].includes(p.status)).reduce((s, p) => s + p.apv, 0),
    chargebacks: filtered.filter(p => p.status === 'Chargeback').reduce((s, p) => s + p.apv, 0),
  }

  // Commission income tracking — commission is calculated on the premium AFTER the
  // carrier's app fee (e.g. Banner -$90), not the full AP.
  const projectedCommission = (p: Policy) => commissionableAP(p.apv, p.carrier) * ((p.comp_percent ?? 100) / 100) * ((p.advance_rate ?? 75) / 100)
  const fullCommission = (p: Policy) => commissionableAP(p.apv, p.carrier) * ((p.comp_percent ?? 100) / 100)
  const remainingTail = (p: Policy) => Math.max(0, fullCommission(p) - projectedCommission(p)) // earned after the advance
  const unpaid = (p: Policy) => p.commission_status !== 'Paid' && p.status !== 'Chargeback'
  const income = {
    paid: filtered.filter(p => p.commission_status === 'Paid').reduce((s, p) => s + (p.commission_paid || projectedCommission(p)), 0),
    pendingAdvance: filtered.filter(unpaid).reduce((s, p) => s + projectedCommission(p), 0),
    pendingRemaining: filtered.filter(unpaid).reduce((s, p) => s + remainingTail(p), 0),
    pending: filtered.filter(p => p.commission_status !== 'Paid' && p.status !== 'Chargeback').reduce((s, p) => s + projectedCommission(p), 0),
  }

  // Live commission breakdown in the modal — reflects the split take-home share
  const liveSplitPct = (form as any).is_split ? Math.min(100, Math.max(1, Number(form.split_percent) || 100)) : 100
  const liveApv = (Number(form.apv) || 0) * liveSplitPct / 100
  const liveFee = appFeeFor(form.carrier)                                       // e.g. Banner $90
  const liveCommBase = Math.max(0, liveApv - liveFee)                           // commissionable premium
  const liveFull = liveCommBase * ((Number(form.comp_percent) || 0) / 100)      // full commission
  const liveAdvance = liveFull * ((Number(form.advance_rate) || 0) / 100)      // paid upfront
  const livePending = Math.max(0, liveFull - liveAdvance)                       // tail, months 10-12
  const liveMonthly = livePending / 3                                          // each of months 10,11,12
  const liveProjected = liveAdvance

  if (!profile) return (
    <Loading />
  )

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={profile.name} />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Policy Log</h1>
            <p className="text-gray-500 mt-1">Track every client and policy</p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={handleCsvImport} className="hidden" />
            <div className="flex flex-col items-end">
              <button
                onClick={() => csvRef.current?.click()} disabled={importing}
                className="flex items-center gap-2 bg-gray-900 border border-gray-700 text-white font-bold px-4 py-3 rounded-xl hover:border-yellow-500 transition disabled:opacity-50"
              >
                <Upload size={16} /> {importing ? 'Importing…' : 'Import CSV'}
              </button>
              <button onClick={downloadTemplate} className="text-[11px] text-yellow-500 hover:underline mt-1">Download template</button>
            </div>
            <button
              onClick={() => { setEditing(null); setForm({ ...emptyForm }); setBenes([]); setShowForm(true) }}
              className="flex items-center gap-2 gold-gradient text-black font-bold px-5 py-3 rounded-xl hover:opacity-90 transition"
            >
              <PlusCircle size={18} /> Add Policy
            </button>
          </div>
        </div>

        {/* View toggle */}
        <div className="inline-flex gap-1 bg-gray-900 rounded-xl p-1 mb-5">
          {([['clients', 'Clients'], ['sales', 'Sales & Commission']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={clsx('px-4 py-2 rounded-lg text-sm font-bold transition', tab === k ? 'gold-gradient text-black' : 'text-gray-400')}>{l}</button>
          ))}
        </div>

        {/* Clients view — health summary */}
        {tab === 'clients' && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
            {CLIENT_STATUSES.map(s => (
              <div key={s} className="card p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{s}</p>
                <p className="text-2xl font-black gold-text">{policies.filter(p => (p.client_status || 'Active') === s).length}</p>
              </div>
            ))}
          </div>
        )}

        {/* Sales view — AP summary cards */}
        {tab === 'sales' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Submitted AP', value: totals.submitted, color: 'text-blue-400' },
            { label: 'Issued AP', value: totals.issued, color: 'text-green-400' },
            { label: 'Chargebacks', value: totals.chargebacks, color: 'text-red-400' },
          ].map(c => (
            <div key={c.label} className="card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{c.label}</p>
              <p className={`text-xl font-black ${c.color}`}>{fmt(c.value)}</p>
              <p className="text-xs text-gray-600 mt-1">{filtered.filter(p =>
                c.label === 'Submitted AP' ? ['Submitted','Approved','Issued'].includes(p.status) :
                c.label === 'Issued AP' ? ['Approved','Issued'].includes(p.status) : p.status === 'Chargeback'
              ).length} policies</p>
            </div>
          ))}
        </div>
        )}

        {/* Commission & Income (Sales view) */}
        {tab === 'sales' && (
        <div className="card p-5 mb-6">
          <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-4">Commission & Income</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-green-500/10 border border-green-700/40 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Paid</p>
              <p className="text-2xl font-black text-green-400">{fmt(income.paid)}</p>
              <p className="text-xs text-gray-600 mt-1">Commission received</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-700/40 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pending Advance</p>
              <p className="text-2xl font-black text-yellow-400">{fmt(income.pendingAdvance)}</p>
              <p className="text-xs text-gray-600 mt-1">Upfront, not yet paid</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-700/40 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pending Remaining</p>
              <p className="text-2xl font-black text-blue-400">{fmt(income.pendingRemaining)}</p>
              <p className="text-xs text-gray-600 mt-1">Tail earned after advance</p>
            </div>
          </div>
        </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {['All','Submitted','Issued','Chargeback'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition',
                filterStatus === s ? 'gold-gradient text-black' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'
              )}>{s}</button>
          ))}
          {isManager && (
            <select value={filterAgent} onChange={e => { setFilterAgent(e.target.value); loadPolicies(profile.id, e.target.value, agents) }}
              className="ml-auto bg-gray-900 border border-gray-800 text-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-yellow-500">
              <option value="All">All Agents</option>
              <option value="Mine">My Policies</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Date','Client','Client Status','Carrier','APV','Status',isManager ? 'Agent' : '','Actions'].filter(Boolean).map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-600">No policies yet. Click "Add Policy" to get started.</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id} className={clsx('border-b border-gray-900 border-l-4 hover:bg-white/5 transition', CLIENT_BORDER[p.client_status] || 'border-l-gray-700')}>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(p.date_written + 'T00:00:00').toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetail(p)} className="font-bold text-white hover:text-yellow-400 hover:underline text-left">{p.client_name}</button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('px-2 py-1 rounded-full text-xs font-bold', CLIENT_COLORS[p.client_status] || 'bg-zinc-600 text-white')}>{p.client_status || 'Active'}</span>
                      {p.flag_reason && <span className="block text-[10px] text-orange-400/80 mt-0.5">{p.flag_reason}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{p.carrier || '—'}</td>
                    <td className="px-4 py-3 text-yellow-400 font-bold">{fmt(p.apv)}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('px-2 py-1 rounded-full text-xs font-bold', STATUS_COLORS[p.status])}>{p.status}</span>
                    </td>
                    {isManager && <td className="px-4 py-3 text-gray-400 text-xs">{p.agent_name}</td>}
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setDetail(p)} className="text-gray-500 hover:text-blue-400 transition" title="View policy"><Eye size={15} /></button>
                        {p.agent_id === profile.id && (<>
                          <button onClick={() => openEdit(p)} className="text-gray-500 hover:text-yellow-400 transition"><Pencil size={15} /></button>
                          <button onClick={() => handleDelete(p.id)} className="text-gray-500 hover:text-red-400 transition"><Trash2 size={15} /></button>
                        </>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="card-gold w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">{editing ? 'Edit Policy' : 'Add New Policy'}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null) }} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            {/* Upload application */}
            <input ref={appRef} type="file" accept=".pdf" onChange={handleAppUpload} className="hidden" />
            <button type="button" onClick={() => appRef.current?.click()} disabled={parsing}
              className="w-full flex items-center justify-center gap-2 bg-blue-600/20 border border-blue-700 text-blue-300 font-bold py-3 rounded-xl hover:bg-blue-600/30 transition mb-2">
              <Upload size={16} /> {parsing ? `Reading application… ${parsePct}%` : 'Upload Application PDF (auto-fill)'}
            </button>
            {parsing && (
              <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: 'var(--divider)' }}>
                <div className="h-full gold-gradient rounded-full transition-all duration-200" style={{ width: `${parsePct}%` }} />
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Client / Insured Name *</label>
                  <input required value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</label>
                  <input value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" placeholder="Phone" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Email</label>
                  <input type="email" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" placeholder="Email" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Carrier</label>
                  <select value={form.carrier} onChange={e => setForm(f => ({ ...f, carrier: e.target.value, policy_type: '' }))}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500">
                    <option value="">Select carrier…</option>
                    {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Product {form.carrier && !CARRIER_PRODUCTS[form.carrier] && <span className="text-gray-600 normal-case">(generic)</span>}</label>
                  <select value={form.policy_type} onChange={e => {
                    const prod = e.target.value
                    const rate = CARRIER_PRODUCT_RATES[form.carrier]?.[prod]?.[String(myLevel)]
                    setForm(f => ({ ...f, policy_type: prod, comp_percent: rate != null ? String(rate) : f.comp_percent }))
                  }}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500">
                    <option value="">{form.carrier ? 'Select product…' : 'Select carrier first…'}</option>
                    {(CARRIER_PRODUCTS[form.carrier] || PRODUCT_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {CARRIER_PRODUCT_RATES[form.carrier]?.[form.policy_type]?.[String(myLevel)] != null && (
                    <p className="text-[11px] text-gray-600 mt-1">Comp auto-set to {CARRIER_PRODUCT_RATES[form.carrier][form.policy_type][String(myLevel)]}% (your level {myLevel})</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">APV (Annual Premium)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input type="number" min="0" step="0.01" value={form.apv} onChange={e => setForm(f => ({ ...f, apv: e.target.value }))}
                      className="w-full bg-black border border-gray-700 rounded-lg pl-7 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Face Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input type="number" min="0" step="0.01" value={form.face_amount} onChange={e => setForm(f => ({ ...f, face_amount: e.target.value }))}
                      className="w-full bg-black border border-gray-700 rounded-lg pl-7 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Date Written *</label>
                  <input required type="date" value={form.date_written} onChange={e => setForm(f => ({ ...f, date_written: e.target.value }))}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Status *</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Policy['status'] }))}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500">
                    {['Submitted','Issued','Chargeback'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                {form.status === 'Chargeback' && (
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Chargeback Reason</label>
                    <select value={form.chargeback_reason} onChange={e => setForm(f => ({ ...f, chargeback_reason: e.target.value }))}
                      className="w-full bg-black border border-red-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500">
                      <option value="">Select reason…</option>
                      {CHARGEBACK_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}
                {/* Client health */}
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Client Status</label>
                  <select value={form.client_status} onChange={e => setForm(f => ({ ...f, client_status: e.target.value }))}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500">
                    {CLIENT_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Policy Start Date</label>
                  <input type="date" value={form.policy_start_date} onChange={e => setForm(f => ({ ...f, policy_start_date: e.target.value }))}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" />
                </div>
                {['Flagged', 'Lapsed', 'Cancelled'].includes(form.client_status) && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Flag Reason</label>
                      <select value={form.flag_reason} onChange={e => setForm(f => ({ ...f, flag_reason: e.target.value }))}
                        className="w-full bg-black border border-orange-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500">
                        <option value="">Select…</option>
                        {FLAG_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Chargeback Remaining ($)</label>
                      <input type="number" value={form.chargeback_remaining} onChange={e => setForm(f => ({ ...f, chargeback_remaining: e.target.value }))}
                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" placeholder="0" />
                    </div>
                  </>
                )}
                {/* Insured & policy details */}
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Owner</label>
                  <input value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" placeholder="Policy owner" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Insured DOB</label>
                  <input value={form.insured_dob} onChange={e => setForm(f => ({ ...f, insured_dob: e.target.value }))}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" placeholder="MM/DD/YYYY" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Address</label>
                  <input value={form.insured_address} onChange={e => setForm(f => ({ ...f, insured_address: e.target.value }))}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" placeholder="Street, City, State ZIP" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Premium (mo)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input type="number" min="0" step="0.01" value={form.premium}
                      onChange={e => { const v = e.target.value; setForm(f => ({ ...f, premium: v, apv: v ? (Number(v) * 12).toFixed(2) : f.apv })) }}
                      className="w-full bg-black border border-gray-700 rounded-lg pl-7 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500" placeholder="0.00" />
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">APV auto-fills (× 12)</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 resize-none" placeholder="Optional notes..." />
                </div>
              </div>

              {/* Beneficiaries */}
              <div className="border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-black gold-text">Beneficiaries</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => addBene('Primary')} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-lg hover:text-white flex items-center gap-1"><UserPlus size={12} /> Primary</button>
                    <button type="button" onClick={() => addBene('Contingent')} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-lg hover:text-white flex items-center gap-1"><UserPlus size={12} /> Contingent</button>
                  </div>
                </div>
                {benes.length === 0 && <p className="text-xs text-gray-600">No beneficiaries added.</p>}
                <div className="space-y-2">
                  {benes.map((b, i) => (
                    <div key={i} className="bg-black/40 border border-gray-800 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', b.type === 'Primary' ? 'bg-teal-900 text-teal-300' : 'bg-purple-900 text-purple-300')}>{b.type}</span>
                        <button type="button" onClick={() => removeBene(i)} className="text-gray-600 hover:text-red-400"><X size={13} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input value={b.name} onChange={e => updateBene(i, { name: e.target.value })} placeholder="Name" className="bg-black border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-yellow-500" />
                        <input value={b.relationship} onChange={e => updateBene(i, { relationship: e.target.value })} placeholder="Relationship" className="bg-black border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-yellow-500" />
                        <input value={b.percent} onChange={e => updateBene(i, { percent: e.target.value })} placeholder="%" className="bg-black border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-yellow-500" />
                        <input value={b.phone} onChange={e => updateBene(i, { phone: e.target.value })} placeholder="Phone" className="bg-black border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-yellow-500" />
                        <input value={b.dob} onChange={e => updateBene(i, { dob: e.target.value })} placeholder="DOB" className="col-span-2 bg-black border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-yellow-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* App Split */}
              <div className="bg-black/40 border border-gray-700 rounded-xl p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-black gold-text">🤝 App Split</span>
                  <span className="flex items-center gap-2 text-sm text-gray-300">
                    Was this an app split?
                    <input type="checkbox" checked={!!form.is_split}
                      onChange={e => setForm(f => ({ ...f, is_split: e.target.checked }))}
                      className="w-4 h-4 accent-yellow-500" />
                  </span>
                </label>
                {form.is_split && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Your take-home %</label>
                      <div className="relative">
                        <input type="number" min="1" max="100" value={form.split_percent}
                          onChange={e => setForm(f => ({ ...f, split_percent: e.target.value }))}
                          className="w-full bg-black border border-gray-700 rounded-lg pl-3 pr-7 py-2 text-white text-sm focus:outline-none focus:border-yellow-500" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Split with</label>
                      {agents.length > 0 && (
                        <select value={form.split_with_id || ''}
                          onChange={e => { const a = agents.find(x => x.id === e.target.value); setForm(f => ({ ...f, split_with_id: e.target.value, split_with_name: a ? a.name : (e.target.value ? f.split_with_name : f.split_with_name) })) }}
                          className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500">
                          <option value="">Outside agent (type below)</option>
                          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      )}
                      {!form.split_with_id && (
                        <input value={form.split_with_name} onChange={e => setForm(f => ({ ...f, split_with_name: e.target.value }))}
                          placeholder="Other agent's name"
                          className={clsx('w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500', agents.length > 0 && 'mt-2')} />
                      )}
                    </div>
                    <p className="col-span-2 text-xs text-gray-500">
                      Full app AP <span className="text-gray-300 font-bold">{fmt(Number(form.apv) || 0)}</span> · you’re credited{' '}
                      <span className="text-yellow-400 font-bold">{fmt((Number(form.apv) || 0) * liveSplitPct / 100)}</span> ({liveSplitPct}%). Your AP, commission &amp; overrides use your share.
                    </p>
                  </div>
                )}
              </div>

              {/* Projected Pay Calculator */}
              <div className="bg-black/40 border border-gray-700 rounded-xl p-4">
                <p className="text-sm font-black gold-text mb-3">📊 Projected Pay Calculator</p>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{form.is_split ? 'Your AP (split)' : 'Annual Premium'}</label>
                    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-yellow-400 font-bold text-sm">{fmt(liveApv)}</div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Product Comp %</label>
                    <div className="relative">
                      <input type="number" min="0" step="any" value={form.comp_percent}
                        onChange={e => setForm(f => ({ ...f, comp_percent: e.target.value }))}
                        className="w-full bg-black border border-gray-700 rounded-lg pl-3 pr-7 py-2 text-white text-sm focus:outline-none focus:border-yellow-500" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Advance</label>
                    <select value={form.advance_rate} onChange={e => setForm(f => ({ ...f, advance_rate: e.target.value }))}
                      className="w-full bg-black border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-yellow-500">
                      {ADVANCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                {/* Commission breakdown */}
                <div className="mt-3 pt-3 border-t border-gray-800 space-y-1.5">
                  {liveFee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Less {form.carrier} app fee</span>
                      <span className="font-bold text-red-400">−{fmt(liveFee)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Full Commission <span className="text-gray-600 text-xs">({liveFee > 0 ? '(AP − fee)' : 'AP'} × Comp)</span></span>
                    <span className="font-bold text-white">{fmt(liveFull)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-400">Advance (paid now) <span className="text-gray-600 text-xs">{form.advance_rate}%</span></span>
                    <span className="font-bold text-green-400">{fmt(liveAdvance)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-yellow-400">Pending tail <span className="text-gray-600 text-xs">(months 10–12)</span></span>
                    <span className="font-bold text-yellow-400">{fmt(livePending)}</span>
                  </div>
                  {livePending > 0 && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-gray-600">Monthly payout (mo 10, 11, 12)</span>
                      <span className="text-gray-300 font-medium">{fmt(liveMonthly)} / mo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Commission paid tracking */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Commission Status</label>
                  <select value={form.commission_status} onChange={e => setForm(f => ({ ...f, commission_status: e.target.value }))}
                    className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500">
                    {['Pending','Paid'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Commission Paid (actual)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input type="number" min="0" step="0.01" value={form.commission_paid}
                      onChange={e => setForm(f => ({ ...f, commission_paid: e.target.value }))}
                      placeholder={liveProjected.toFixed(2)}
                      className="w-full bg-black border border-gray-700 rounded-lg pl-7 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="w-full gold-gradient text-black font-black py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update Policy' : 'Add Policy'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Policy detail card */}
      {detail && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4" onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center"><ShieldCheck size={20} className="text-blue-400" /></div>
                <h2 className="text-xl font-black text-white">{detail.product_type || detail.policy_type || 'Policy'}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={clsx('px-2.5 py-1 rounded-full text-xs font-bold', CLIENT_COLORS[detail.client_status] || 'bg-zinc-600 text-white')}>{detail.client_status || 'Active'}</span>
                <button onClick={() => setDetail(null)} className="text-gray-500 hover:text-white"><X size={20} /></button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Client</p>
                <p className="text-lg font-bold text-white">{detail.client_name}</p>
              </div>

              {/* Contact (pulled from the matching lead record) */}
              {(() => {
                const c = leadContacts[detail.client_name.trim().toLowerCase()]
                const phone = detail.client_phone || c?.phone || ''
                const email = detail.client_email || c?.email || ''
                const tel = phone.replace(/\D/g, '')
                if (!phone && !email && !c) return null
                return (
                  <div className="flex flex-wrap gap-2">
                    {phone && <a href={`tel:${tel}`} className="flex items-center gap-1.5 text-sm bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 rounded-lg hover:text-white"><Phone size={14} className="text-green-400" />{phone}</a>}
                    {email && <a href={`mailto:${email}`} className="flex items-center gap-1.5 text-sm bg-gray-900 border border-gray-700 text-gray-200 px-3 py-2 rounded-lg hover:text-white truncate max-w-full"><Mail size={14} className="text-blue-400" />{email}</a>}
                    {c && <button onClick={() => router.push(`/leads/${c.id}`)} className="flex items-center gap-1.5 text-sm bg-gray-900 border border-gray-700 text-yellow-500 px-3 py-2 rounded-lg hover:text-yellow-400">Open lead →</button>}
                  </div>
                )
              })()}

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Insurance Company</p>
                <p className="text-lg font-bold text-white">{detail.carrier || '—'}</p>
              </div>
              {detail.owner_name && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Owner</p>
                  <p className="text-white font-medium">{detail.owner_name}</p>
                </div>
              )}

              {/* Beneficiaries */}
              {Array.isArray(detail.beneficiaries) && detail.beneficiaries.length > 0 && (
                <>
                  {['Primary', 'Contingent'].map(t => {
                    const list = detail.beneficiaries.filter(b => b.type === t)
                    if (!list.length) return null
                    return (
                      <div key={t}>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{t} Beneficiaries</p>
                        <div className="space-y-2">
                          {list.map((b, i) => (
                            <div key={i} className="card p-3">
                              <p className="font-bold text-white text-sm">{b.name} {b.relationship && <span className="text-gray-500 font-normal">({b.relationship})</span>} {b.percent && <span className="text-yellow-500">{b.percent}%</span>}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{[b.phone && `Phone: ${b.phone}`, b.dob && `DOB: ${b.dob}`].filter(Boolean).join(' · ')}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}

              {/* DB + Premium */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Face Amount</p>
                  <p className="text-2xl font-black text-white">{detail.face_amount ? `$${detail.face_amount.toLocaleString()}` : detail.death_benefit ? `$${detail.death_benefit.toLocaleString()}` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Premium</p>
                  <p className="text-2xl font-black text-white">{detail.premium ? `$${detail.premium.toFixed(2)}/mo` : '—'}</p>
                </div>
              </div>

              {/* APV + dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-500 uppercase tracking-wider">Annual Premium</p><p className="text-yellow-400 font-bold">{fmt(detail.apv)}</p></div>
                <div><p className="text-xs text-gray-500 uppercase tracking-wider">App Taken</p><p className="text-gray-300">{new Date(detail.date_written + 'T00:00:00').toLocaleDateString()}</p></div>
                {detail.policy_start_date && <div><p className="text-xs text-gray-500 uppercase tracking-wider">Policy Start</p><p className="text-gray-300">{new Date(detail.policy_start_date + 'T00:00:00').toLocaleDateString()}</p></div>}
                {detail.insured_dob && <div><p className="text-xs text-gray-500 uppercase tracking-wider">Insured DOB</p><p className="text-gray-300">{detail.insured_dob}</p></div>}
              </div>

              {/* Commission */}
              <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-gray-800">
                <div><p className="text-xs text-gray-500 uppercase tracking-wider">Commission (Advance)</p><p className="text-green-400 font-bold">{fmt(detail.apv * ((detail.comp_percent ?? 100) / 100) * ((detail.advance_rate ?? 75) / 100))}</p></div>
                <div><p className="text-xs text-gray-500 uppercase tracking-wider">Comm. Status</p><p className="text-gray-300">{detail.commission_status || 'Pending'}</p></div>
              </div>

              {detail.insured_address && <div><p className="text-xs text-gray-500 uppercase tracking-wider">Address</p><p className="text-gray-300 text-sm">{detail.insured_address}</p></div>}

              {/* Save-the-client callout */}
              {['Flagged', 'Lapsed', 'Cancelled'].includes(detail.client_status) && (
                <div className="rounded-xl bg-orange-500/10 border border-orange-700/40 p-4">
                  <p className="text-sm font-bold text-orange-300">⚠️ {detail.client_status}{detail.flag_reason ? ` · ${detail.flag_reason}` : ''}</p>
                  {detail.chargeback_remaining > 0 && <p className="text-xs text-gray-400 mt-1">Chargeback remaining: <span className="text-red-400 font-bold">{fmt(detail.chargeback_remaining)}</span></p>}
                  <p className="text-xs text-gray-500 mt-2">A save-the-client task is on your <a href="/action-items" className="text-yellow-500 hover:underline">Action Items →</a></p>
                </div>
              )}

              {detail.agent_id === profile.id && (
                <button onClick={() => { setDetail(null); openEdit(detail) }} className="w-full gold-gradient text-black font-bold py-3 rounded-xl hover:opacity-90 transition">Edit Policy / Client</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
