'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import ScriptWidget from '@/components/ScriptWidget'
import { Upload, Search, Plus, Phone, X } from 'lucide-react'
import clsx from 'clsx'
import { DISP_BADGE, DISPOSITIONS, LEAD_TYPES, LEAD_TYPE_GROUPS, leadTypeColor, LEAD_GRADES, gradeBadge, isBonusGrade } from '@/lib/constants'
import { useToast } from '@/components/Toast'
import { usePresence } from '@/lib/usePresence'

type Lead = {
  id: string
  agent_id: string
  name: string
  phone: string
  email: string
  source: string
  lead_type?: string
  lead_grade?: string
  disposition: string
  dial_count: number
  is_dead: boolean
  created_at: string
  updated_at: string
  notes: string
}

type Profile = { id: string; name: string }

const DISPOSITION_COLORS = DISP_BADGE
const SOURCES = ['Digital Lead', 'Call In', 'Mail In', 'Referral', 'Rewrite', 'Other']
// Older imports were labeled "Bought Lead" — show them as "Call In"
const srcLabel = (s: string) => s === 'Bought Lead' ? 'Call In' : (s || '—')

// Robust CSV parser (handles quoted fields, commas, escaped quotes, CRLF)
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
const fmtPhone = (raw: string) => {
  const d = (raw || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '')
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : (raw || '').trim()
}
const fmtMoney = (raw: string) => {
  const n = Number(String(raw || '').replace(/[$,]/g, ''))
  return n > 0 ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : ''
}
const yn = (raw: string) => {
  const v = (raw || '').trim().toLowerCase()
  if (['y', 'yes', 'true', '1'].includes(v)) return 'Yes'
  if (['n', 'no', 'false', '0'].includes(v)) return 'No'
  return ''
}

export default function LeadsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [clientNames, setClientNames] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [filterDisp, setFilterDisp] = useState('All')
  const [filterType, setFilterType] = useState('All')
  const [filterGrade, setFilterGrade] = useState('All')
  const [customType, setCustomType] = useState('')
  const [pickGrade, setPickGrade] = useState('A')
  const [lifeFilter, setLifeFilter] = useState<'Active' | 'Dead' | 'All'>('Active')
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'custom'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za' | 'state'>('newest')
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<{ pct: number; label: string } | null>(null)
  const [pendingFile, setPendingFile] = useState<{ file: File; kind: 'pdf' | 'csv' } | null>(null)
  const [addForm, setAddForm] = useState({ name: '', phone: '', email: '', source: LEAD_TYPES[0], grade: 'A' })
  const fileRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let settled = false
    // Gentle safety net: if auth genuinely never resolves, fall back to login —
    // but long enough that a slow (free-tier) query isn't kicked out mid-load.
    const t = setTimeout(() => { if (!settled) router.replace('/login') }, 15000)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { settled = true; clearTimeout(t); router.replace('/login'); return }
      const fallbackName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Agent'
      let { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!p) {
        await supabase.from('profiles').insert({ id: session.user.id, name: fallbackName, email: session.user.email, role: 'agent' })
        const { data: p2 } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        p = p2
      }
      settled = true; clearTimeout(t)
      // Render even if the profile row is slow/missing — never sit on the skeleton.
      setProfile(p || { id: session.user.id, name: fallbackName } as any)
      loadLeads(session.user.id)
    }).catch(() => { settled = true; clearTimeout(t); router.replace('/login') })
    return () => clearTimeout(t)
  }, [router])

  // Jump back to page 1 whenever the filters, sort, or page size change
  useEffect(() => { setPage(1) }, [search, filterDisp, filterType, filterGrade, lifeFilter, dateRange, customFrom, customTo, sortBy, pageSize])

  async function loadLeads(agentId: string) {
    const [{ data }, { data: pols }] = await Promise.all([
      supabase.from('leads').select('*').eq('agent_id', agentId).order('created_at', { ascending: false }),
      supabase.from('policy_log').select('client_name').eq('agent_id', agentId),
    ])
    setLeads(data || [])
    setClientNames(new Set((pols || []).map(p => (p.client_name || '').trim().toLowerCase()).filter(Boolean)))
  }

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    const ph = (addForm.phone || '').replace(/\D/g, '')
    if (ph && leads.some(l => (l.phone || '').replace(/\D/g, '') === ph)) {
      toast('A lead with that phone number already exists.', 'error')
      return
    }
    const { data } = await supabase.from('leads').insert({
      agent_id: profile.id, agent_name: profile.name,
      name: addForm.name, phone: addForm.phone, email: addForm.email, source: addForm.source, lead_type: addForm.source, lead_grade: addForm.grade
    }).select().single()
    if (data) {
      setLeads(l => [data, ...l])
      setShowAdd(false)
      setAddForm({ name: '', phone: '', email: '', source: LEAD_TYPES[0], grade: 'A' })
      router.push(`/leads/${data.id}`)
    }
  }

  // Insert leads in chunks, updating the progress bar as it goes.
  async function insertLeadsChunked(rows: any[], basePct: number): Promise<any[]> {
    const out: any[] = []
    for (let i = 0; i < rows.length; i += 50) {
      const chunk = rows.slice(i, i + 50)
      const { data, error } = await supabase.from('leads').insert(chunk).select()
      if (error) { toast(`Saved ${out.length} — then hit an error: ${error.message}`, 'error'); break }
      if (data) out.push(...data)
      setProgress({ pct: basePct + Math.round(((i + chunk.length) / rows.length) * (100 - basePct)), label: `Saving ${out.length}/${rows.length}…` })
    }
    return out
  }

  async function importPDF(file: File, source: string, grade: string) {
    if (!file || !profile) return
    setUploading(true)
    setProgress({ pct: 8, label: 'Reading PDF…' })
    try {
      // Extract the text in the BROWSER so big PDFs aren't blocked by the upload
      // size limit, then send just the text to the parser.
      let pages: string[] = []
      try {
        const { extractText, getDocumentProxy } = await import('unpdf')
        const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()))
        const r = await extractText(pdf, { mergePages: false })
        pages = (Array.isArray(r.text) ? r.text : [r.text]).map(p => String(p || ''))
      } catch { pages = [] }

      setProgress({ pct: 40, label: 'Finding leads…' })
      let json: any
      if (pages.length) {
        const res = await fetch('/api/parse-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pages }) })
        json = await res.json()
      } else if (file.size > 4 * 1024 * 1024) {
        toast('This PDF is too large to read here. Upload the CSV export of these leads instead.', 'error'); return
      } else {
        const fd = new FormData(); fd.append('file', file)
        const res = await fetch('/api/parse-pdf', { method: 'POST', body: fd })
        json = await res.json()
      }
      if (json.error) { toast('Could not read PDF: ' + json.error, 'error'); return }

      const rows = (json.leads as any[])
        .filter(l => l.name !== 'Unknown' || l.phone)
        .map(l => ({
          agent_id: profile.id, agent_name: profile.name,
          name: l.name, phone: l.phone, email: l.email, source, lead_type: source, lead_grade: grade,
          address: l.address, city: l.city, state: l.state, zip: l.zip,
          dob: l.dob, age: l.age, gender: l.gender, tobacco_use: l.tobacco_use,
          co_borrower: l.co_borrower, mortgage_balance: l.mortgage_balance, lender: l.lender,
        }))
      if (rows.length === 0) { toast('No leads found in that PDF. Try a CSV instead.', 'error'); return }

      const { fresh, toUpdate } = dedupeUpsert(rows)

      let updatedCount = 0
      for (const { id, data } of toUpdate) {
        const { error } = await supabase.from('leads').update(data).eq('id', id)
        if (!error) updatedCount++
      }

      setProgress({ pct: 60, label: `Saving 0/${fresh.length}…` })
      const inserted = await insertLeadsChunked(fresh, 60)

      if (inserted.length) setLeads(l => [...inserted, ...l])

      if (updatedCount > 0) {
        const updatedIds = toUpdate.map(u => u.id)
        const { data: refreshed } = await supabase.from('leads').select('*').in('id', updatedIds)
        if (refreshed) setLeads(l => l.map(lead => refreshed.find(r => r.id === lead.id) || lead))
      }

      if (inserted.length || updatedCount) {
        const parts = []
        if (inserted.length) parts.push(`${inserted.length} added`)
        if (updatedCount) parts.push(`${updatedCount} updated`)
        toast(`PDF imported — ${parts.join(', ')}`, 'success')
      } else {
        toast(`No changes — all ${rows.length} leads already match what's on file.`, 'error')
      }
    } catch {
      toast('Error reading PDF. Try a CSV instead.', 'error')
    } finally {
      setUploading(false); setProgress(null)
      if (pdfRef.current) pdfRef.current.value = ''
    }
  }

  async function importCSV(file: File, source: string, grade: string) {
    if (!file || !profile) return
    setUploading(true)
    setProgress({ pct: 10, label: 'Reading CSV…' })
    try {
      const grid = parseCsv(await file.text())
      if (grid.length < 2) { toast('CSV has no data rows', 'error'); return }
      const head = grid[0].map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''))
      const col = (...names: string[]) => { for (const n of names) { const i = head.indexOf(n); if (i >= 0) return i } return -1 }
      const fuzzy = (...frags: string[]) => head.findIndex(h => frags.some(f => h.includes(f)))
      const ci = {
        first: col('first name', 'first'),
        last: col('last name', 'last'),
        full: col('name', 'full name', 'client name', 'contact'),
        cell: col('cell phone', 'mobile', 'cell'),
        phone: col('phone', 'home phone', 'work phone', 'primary phone'),
        email: col('email address', 'email'),
        street: col('street1', 'address', 'property address', 'street address', 'street'),
        city: col('city'),
        state: col('state'),
        zip: col('zip', 'postal code', 'zip code'),
        age: col('age_years', 'age'),
        dob: col('birth date', 'dob', 'date of birth'),
        // Prefer descriptive column names over generic answer1/2/3 placeholders
        gender: col('gender', 'sex', 'answer1'),
        tobacco: col('smoker?', 'smoker', 'tobacco', 'answer2'),
        cob: col('co-borroweronmortgage', 'co-borrower', 'answer3'),
        lender: col('lender', 'lender name'),
        loan: col('loan amount', 'mortgage amount', 'mortgage debt', 'amount'),
      }
      const g = (r: string[], i: number) => i >= 0 ? (r[i] || '').trim() : ''
      const hasName = ci.first >= 0 || ci.full >= 0 || ci.last >= 0
      const anyPhone = ci.cell >= 0 || ci.phone >= 0 || fuzzy('phone') >= 0
      if (!hasName && !anyPhone) { toast('CSV needs a Name or Phone column', 'error'); return }

      setProgress({ pct: 25, label: 'Mapping rows…' })
      const rows = grid.slice(1).map(r => {
        const name = ci.first >= 0
          ? `${g(r, ci.first)} ${g(r, ci.last)}`.trim()
          : (g(r, ci.full) || g(r, ci.last))
        const phone = fmtPhone(g(r, ci.cell) || g(r, ci.phone))
        return {
          agent_id: profile.id, agent_name: profile.name,
          name: name || 'Unknown', phone, email: g(r, ci.email), source, lead_type: source, lead_grade: grade,
          address: g(r, ci.street), city: g(r, ci.city), state: g(r, ci.state), zip: g(r, ci.zip),
          dob: g(r, ci.dob), age: Number(g(r, ci.age)) || null,
          gender: g(r, ci.gender), tobacco_use: yn(g(r, ci.tobacco)), co_borrower: yn(g(r, ci.cob)),
          lender: g(r, ci.lender), mortgage_balance: fmtMoney(g(r, ci.loan)),
        }
      }).filter(r => (r.name && r.name !== 'Unknown') || r.phone)

      if (rows.length === 0) { toast('No valid rows found in that CSV', 'error'); return }
      const { fresh, toUpdate } = dedupeUpsert(rows)

      // Update existing leads with fresh data from the CSV
      let updatedCount = 0
      for (const { id, data } of toUpdate) {
        const { error } = await supabase.from('leads').update(data).eq('id', id)
        if (!error) updatedCount++
      }

      setProgress({ pct: 40, label: `Saving 0/${fresh.length}…` })
      const inserted = await insertLeadsChunked(fresh, 40)

      if (inserted.length) setLeads(l => [...inserted, ...l])

      // Refresh updated leads in state
      if (updatedCount > 0) {
        const updatedIds = toUpdate.map(u => u.id)
        const { data: refreshed } = await supabase.from('leads').select('*').in('id', updatedIds)
        if (refreshed) setLeads(l => l.map(lead => refreshed.find(r => r.id === lead.id) || lead))
      }

      if (inserted.length || updatedCount) {
        const parts = []
        if (inserted.length) parts.push(`${inserted.length} added`)
        if (updatedCount) parts.push(`${updatedCount} updated`)
        toast(`CSV imported — ${parts.join(', ')}`, 'success')
      } else {
        toast(`No changes — all ${rows.length} leads already match what's on file.`, 'error')
      }
    } catch (err: any) {
      toast('Could not read CSV: ' + (err?.message || 'unknown error'), 'error')
    } finally {
      setUploading(false); setProgress(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // Picking a file just stashes it — we ask for the lead type first, then import
  const onPickFile = (kind: 'pdf' | 'csv') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setPendingFile({ file: f, kind })
    e.target.value = ''
  }
  function chooseSource(source: string) {
    const pf = pendingFile
    setPendingFile(null); setCustomType('')
    if (!pf) return
    if (pf.kind === 'pdf') importPDF(pf.file, source, pickGrade)
    else importCSV(pf.file, source, pickGrade)
  }

  // Drop any rows that already exist (same phone, or same name when no phone) — and de-dupe within the batch
  const normPhone = (p: string) => (p || '').replace(/\D/g, '')
  function dedupe(rows: any[]) {
    const existPhone = new Set(leads.map(l => normPhone(l.phone)).filter(Boolean))
    const existName = new Set(leads.map(l => (l.name || '').trim().toLowerCase()).filter(n => n && n !== 'unknown'))
    const seen = new Set<string>()
    const fresh = rows.filter(r => {
      const ph = normPhone(r.phone)
      const nm = (r.name || '').trim().toLowerCase()
      const key = ph || nm
      if (!key) return true
      if (ph && existPhone.has(ph)) return false
      if (!ph && nm && existName.has(nm)) return false
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    return { fresh, skipped: rows.length - fresh.length }
  }

  // Like dedupe but returns existing leads that should be updated alongside fresh inserts
  function dedupeUpsert(rows: any[]) {
    const phoneToLead = new Map(leads.filter(l => normPhone(l.phone)).map(l => [normPhone(l.phone), l]))
    const nameToLead = new Map(leads.filter(l => l.name && l.name.toLowerCase() !== 'unknown').map(l => [(l.name || '').trim().toLowerCase(), l]))
    const seen = new Set<string>()
    const fresh: any[] = []
    const toUpdate: { id: string; data: any }[] = []
    for (const r of rows) {
      const ph = normPhone(r.phone)
      const nm = (r.name || '').trim().toLowerCase()
      const key = ph || nm
      if (!key) { fresh.push(r); continue }
      if (seen.has(key)) continue
      seen.add(key)
      const existing = (ph && phoneToLead.get(ph)) || (!ph && nm && nameToLead.get(nm))
      if (existing) {
        // Update only fields that have values in the CSV — don't overwrite notes/disposition/etc.
        const { agent_id, agent_name, source, lead_type, lead_grade, ...rest } = r
        const patch: any = {}
        for (const [k, v] of Object.entries(rest)) {
          if (v !== null && v !== undefined && v !== '') patch[k] = v
        }
        if (Object.keys(patch).length) toUpdate.push({ id: existing.id, data: patch })
      } else {
        fresh.push(r)
      }
    }
    return { fresh, toUpdate }
  }

  const inRange = (created: string) => {
    if (dateRange === 'all') return true
    const d = new Date(created)
    const now = new Date()
    if (dateRange === 'week') { const w = new Date(); w.setDate(w.getDate() - 7); return d >= w }
    if (dateRange === 'month') { const m = new Date(); m.setMonth(m.getMonth() - 1); return d >= m }
    if (dateRange === 'custom') {
      if (customFrom && d < new Date(customFrom)) return false
      if (customTo && d > new Date(customTo + 'T23:59:59')) return false
      return true
    }
    return true
  }

  const typeOf = (l: Lead) => (l.lead_type || l.source || '').trim()
  const gradeOf = (l: Lead) => (l.lead_grade || '').trim().toUpperCase()
  // Distinct lead types present, for the Type filter dropdown
  const typesPresent = Array.from(new Set(leads.map(typeOf).filter(Boolean))).sort()
  const matchesGrade = (l: Lead) => {
    if (filterGrade === 'All') return true
    if (filterGrade === 'New') return gradeOf(l) === 'A'
    if (filterGrade === 'Bonus') return isBonusGrade(gradeOf(l))
    return gradeOf(l) === filterGrade
  }
  const filtered = leads.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = l.name.toLowerCase().includes(q) || l.phone.includes(search) || (l.email || '').toLowerCase().includes(q)
    const matchDisp = filterDisp === 'All' || l.disposition === filterDisp
    const matchType = filterType === 'All' || typeOf(l) === filterType
    const matchLife = lifeFilter === 'Active' ? !l.is_dead : lifeFilter === 'Dead' ? l.is_dead : true
    return matchSearch && matchDisp && matchType && matchesGrade(l) && matchLife && inRange(l.created_at)
  })

  // Sort, then paginate
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'az') return (a.name || '').localeCompare(b.name || '')
    if (sortBy === 'za') return (b.name || '').localeCompare(a.name || '')
    if (sortBy === 'state') return ((a as any).state || '').localeCompare((b as any).state || '')
    const da = new Date(a.created_at).getTime(), db = new Date(b.created_at).getTime()
    return sortBy === 'oldest' ? da - db : db - da
  })
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const curPage = Math.min(page, totalPages)
  const paged = sorted.slice((curPage - 1) * pageSize, curPage * pageSize)
  const showingFrom = sorted.length === 0 ? 0 : (curPage - 1) * pageSize + 1
  const showingTo = Math.min(curPage * pageSize, sorted.length)

  const counts = {
    total: leads.length,
    active: leads.filter(l => !l.is_dead).length,
    dead: leads.filter(l => l.is_dead).length,
    booked: leads.filter(l => ['Booked','Appt Showed','Appt No Show','Sit Follow Up','Sit No Sale','Closed'].includes(l.disposition)).length,
  }

  usePresence(profile?.id)

  if (!profile) return <Loading />

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={profile.name} />

      {/* Upload progress overlay */}
      {progress && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm md:pl-60">
          <div className="card p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold" style={{ color: 'var(--fg)' }}>Importing leads</p>
              <span className="text-sm font-black gold-text">{progress.pct}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
              <div className="h-full gold-gradient rounded-full transition-all duration-200" style={{ width: `${progress.pct}%` }} />
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--fg-muted)' }}>{progress.label}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-5 gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black text-white">Leads</h1>
            <p className="text-gray-500 text-sm mt-1">{counts.active} active · {counts.dead} dead · {counts.booked} booked</p>
          </div>
          <div className="flex gap-2 items-center flex-shrink-0">
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={onPickFile('csv')} className="hidden" />
            <input ref={pdfRef} type="file" accept=".pdf" onChange={onPickFile('pdf')} className="hidden" />
            {/* Combined Upload menu */}
            <div className="relative">
              <button onClick={() => setShowUpload(v => !v)} disabled={uploading}
                className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                <Upload size={15} />{uploading ? 'Working…' : 'Upload'}
              </button>
              {showUpload && !uploading && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUpload(false)} />
                  <div className="absolute right-0 mt-1 w-36 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                    <button onClick={() => { setShowUpload(false); pdfRef.current?.click() }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5">PDF file</button>
                    <button onClick={() => { setShowUpload(false); fileRef.current?.click() }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5">CSV file</button>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 gold-gradient text-black font-bold px-3 py-2 rounded-lg text-sm transition hover:opacity-90">
              <Plus size={15} /> Add
            </button>
          </div>
        </div>

        {/* Active / Dead toggle + date range */}
        <div className="flex gap-2 mb-3 flex-wrap items-center">
          {(['Active', 'Dead', 'All'] as const).map(f => (
            <button key={f} onClick={() => setLifeFilter(f)}
              className={clsx('px-4 py-2 rounded-lg text-sm font-bold transition',
                lifeFilter === f
                  ? (f === 'Dead' ? 'bg-red-900 text-red-300' : 'gold-gradient text-black')
                  : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'
              )}>
              {f} {f === 'Active' ? `(${counts.active})` : f === 'Dead' ? `(${counts.dead})` : ''}
            </button>
          ))}
          <div className="w-px h-6 bg-gray-800 mx-1" />
          {(['all', 'week', 'month', 'custom'] as const).map(r => (
            <button key={r} onClick={() => setDateRange(r)}
              className={clsx('px-3 py-2 rounded-lg text-xs font-medium transition capitalize',
                dateRange === r ? 'bg-yellow-500/15 text-yellow-500 border border-yellow-700' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'
              )}>{r === 'all' ? 'All time' : r === 'week' ? 'This week' : r === 'month' ? 'This month' : 'Custom'}</button>
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
        </div>

        {/* Search + disposition filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, or email..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500" />
          </div>
          <select value={filterDisp} onChange={e => setFilterDisp(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-yellow-500">
            {['All', 'Not Called', ...DISPOSITIONS.map(d => d.label)].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-yellow-500">
            <option value="All">All Types</option>
            {typesPresent.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-yellow-500">
            <option value="All">All Grades</option>
            <option value="New">New (A)</option>
            <option value="Bonus">Bonus (B–H)</option>
            {LEAD_GRADES.map(gr => <option key={gr} value={gr}>Grade {gr}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-yellow-500">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">Name A–Z</option>
            <option value="za">Name Z–A</option>
            <option value="state">State A–Z</option>
          </select>
        </div>

        {/* Lead list — compact rows that read cleanly on phone & desktop */}
        <div className="card divide-y divide-gray-900 overflow-hidden">
          {paged.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-600">
              {leads.length === 0 ? 'No leads yet. Upload a PDF/CSV or add one manually.' : 'No leads match your filter.'}
            </div>
          ) : paged.map(lead => {
            const tel = (lead.phone || '').replace(/\D/g, '')
            return (
              <div key={lead.id} onClick={() => router.push(`/leads/${lead.id}`)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition cursor-pointer">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{lead.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {clientNames.has((lead.name || '').trim().toLowerCase()) && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black text-white whitespace-nowrap flex-shrink-0 bg-green-600" title="Active client — has a policy">● Client</span>
                    )}
                    {gradeOf(lead) && (
                      <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-black whitespace-nowrap flex-shrink-0', gradeBadge(gradeOf(lead)))}
                        title={isBonusGrade(gradeOf(lead)) ? 'Bonus (aged) lead' : 'New (A) lead'}>
                        {gradeOf(lead)}
                      </span>
                    )}
                    {typeOf(lead) && (
                      <span className={clsx('px-1.5 py-0.5 rounded text-[9px] font-bold text-white whitespace-nowrap flex-shrink-0', leadTypeColor(typeOf(lead)))}>
                        {srcLabel(typeOf(lead))}
                      </span>
                    )}
                    <p className="text-xs text-gray-500 truncate">{lead.phone || 'No phone'}</p>
                  </div>
                </div>
                {(lead.updated_at || lead.created_at) && (() => {
                  const lastCall = lead.updated_at || lead.created_at
                  const d = new Date(lastCall)
                  const now = new Date()
                  const mins = Math.floor((now.getTime() - d.getTime()) / 60000)
                  const label = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) })
                  return (
                    <span className="text-[11px] text-gray-500 whitespace-nowrap flex-shrink-0 hidden sm:block" title={`Last updated ${d.toLocaleString()}`}>
                      {label}
                    </span>
                  )
                })()}
                <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap flex-shrink-0', DISPOSITION_COLORS[lead.disposition] || 'bg-sky-500 text-white')}>
                  {lead.disposition}
                </span>
                {tel && (
                  <a href={`tel:${tel}`} onClick={e => e.stopPropagation()}
                    className="w-8 h-8 rounded-full gold-gradient text-black flex items-center justify-center flex-shrink-0" aria-label="Call">
                    <Phone size={14} />
                  </a>
                )}
              </div>
            )
          })}
        </div>

        {/* Pagination footer */}
        {sorted.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>
              Showing <span className="font-bold" style={{ color: 'var(--fg)' }}>{showingFrom}–{showingTo}</span> of {sorted.length}
            </p>
            <div className="flex items-center gap-2">
              <label className="text-xs" style={{ color: 'var(--fg-muted)' }}>Per page</label>
              <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
                className="bg-gray-900 border border-gray-800 rounded-lg px-2 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-yellow-500">
                {[25, 50, 75, 100, 250, 500].map(n => <option key={n} value={n}>{n}</option>)}
                <option value={100000}>All</option>
              </select>
              <button disabled={curPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg text-sm font-bold bg-gray-900 border border-gray-800 text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
              <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>Page {curPage} / {totalPages}</span>
              <button disabled={curPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg text-sm font-bold bg-gray-900 border border-gray-800 text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Lead source picker (after choosing a file to upload) */}
      {pendingFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4" onClick={() => setPendingFile(null)}>
          <div onClick={e => e.stopPropagation()} className="card-gold w-full max-w-sm p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-black text-white">What lead type?</h2>
              <button onClick={() => setPendingFile(null)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-xs text-gray-500 mb-4">Tag all leads in <span className="text-gray-300">{pendingFile.file.name}</span> with a grade + type.</p>
            {/* Grade selector — A = new, B–H = bonus */}
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Grade <span className="text-gray-600 normal-case font-medium">(A = new · B–H = bonus)</span></p>
              <div className="flex flex-wrap gap-1.5">
                {LEAD_GRADES.map(gr => (
                  <button key={gr} onClick={() => setPickGrade(gr)}
                    className={clsx('w-9 h-9 rounded-lg text-sm font-black transition border',
                      pickGrade === gr ? clsx(gradeBadge(gr), 'border-transparent') : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white')}>
                    {gr}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3 mb-4 max-h-[42vh] overflow-y-auto pr-1">
              {LEAD_TYPE_GROUPS.map(grp => (
                <div key={grp.category}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">{grp.category}</p>
                  <div className="flex flex-wrap gap-2">
                    {grp.types.map(s => (
                      <button key={s} onClick={() => chooseSource(s)}
                        className={clsx('px-3 py-1.5 rounded-full text-xs font-bold text-white hover:opacity-90 transition', leadTypeColor(s))}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={customType} onChange={e => setCustomType(e.target.value)} placeholder="Or type a custom vendor…"
                onKeyDown={e => { if (e.key === 'Enter' && customType.trim()) chooseSource(customType.trim()) }}
                className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500" />
              <button onClick={() => customType.trim() && chooseSource(customType.trim())} disabled={!customType.trim()}
                className="gold-gradient text-black font-bold px-4 rounded-xl text-sm disabled:opacity-40">Use</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="card-gold w-full max-w-md p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-white">Add Lead</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddLead} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Full Name *</label>
                <input required value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" placeholder="First Last" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</label>
                <input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" placeholder="1-800-000-0000" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Email</label>
                <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Lead Type</label>
                <select value={addForm.source} onChange={e => setAddForm(f => ({ ...f, source: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500">
                  {LEAD_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Grade</label>
                <select value={addForm.grade} onChange={e => setAddForm(f => ({ ...f, grade: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500">
                  {LEAD_GRADES.map(gr => <option key={gr} value={gr}>{gr === 'A' ? 'A (New)' : `${gr} (Bonus)`}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full gold-gradient text-black font-black py-3 rounded-xl hover:opacity-90 transition">
                Add Lead
              </button>
            </form>
          </div>
        </div>
      )}
      <ScriptWidget />
    </div>
  )
}
