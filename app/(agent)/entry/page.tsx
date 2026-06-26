'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import { Save, CheckCircle } from 'lucide-react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

type FormData = {
  dials: string
  earned: string
  advance_pay: string
  mo_expenses: string
  deposits: string
  adv_owed: string
  lead_spend: string
}

const empty: FormData = {
  dials: '', earned: '',
  advance_pay: '', mo_expenses: '', deposits: '', adv_owed: '', lead_spend: ''
}

export default function EntryPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<{ id: string; name: string } | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [form, setForm] = useState<FormData>(empty)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [existingId, setExistingId] = useState<string | null>(null)

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
    })
  }, [router])

  useEffect(() => {
    if (!profile) return
    supabase.from('entries')
      .select('*').eq('agent_id', profile.id).eq('year', year).eq('month', month).single()
      .then(({ data }) => {
        if (data) {
          setExistingId(data.id)
          setForm({
            dials: String(data.dials || ''),

            earned: String(data.earned || ''),
            advance_pay: String(data.advance_pay || ''),
            mo_expenses: String(data.mo_expenses || ''),
            deposits: String(data.deposits || ''),
            adv_owed: String(data.adv_owed || ''),
            lead_spend: String(data.lead_spend || ''),
          })
        } else {
          setExistingId(null)
          setForm(empty)
        }
      })
  }, [profile, year, month])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    const payload = {
      agent_id: profile.id,
      agent_name: profile.name,
      year, month,
      dials: Number(form.dials) || 0,

      earned: Number(form.earned) || 0,
      advance_pay: Number(form.advance_pay) || 0,
      mo_expenses: Number(form.mo_expenses) || 0,
      mo_net: (Number(form.advance_pay) || 0) - (Number(form.mo_expenses) || 0),
      deposits: Number(form.deposits) || 0,
      adv_owed: Number(form.adv_owed) || 0,
      lead_spend: Number(form.lead_spend) || 0,
      // keep old fields at 0 — now auto-calculated from policy_log
      apps_written: 0, submitted_ap: 0, approved_ap: 0, issued_ap: 0,
      chargebacks: 0, policies: 0,
    }
    if (existingId) {
      await supabase.from('entries').update(payload).eq('id', existingId)
    } else {
      await supabase.from('entries').insert(payload)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const field = (key: keyof FormData, label: string, prefix?: string, hint?: string) => (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-700 mb-1">{hint}</p>}
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{prefix}</span>}
        <input type="number" min="0" step="any" value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full bg-black border border-gray-800 rounded-lg py-3 text-white focus:outline-none focus:border-yellow-500 transition"
          style={{ paddingLeft: prefix ? '1.75rem' : '1rem', paddingRight: '1rem' }}
          placeholder="0" />
      </div>
    </div>
  )

  if (!profile) return (
    <Loading />
  )

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={profile.name} />
      <div className="max-w-2xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Log Monthly Numbers</h1>
          <p className="text-gray-500 mt-1">
            AP figures are auto-calculated from your <a href="/policies" className="text-yellow-500 hover:underline">Policy Log</a>
          </p>
        </div>

        {/* Month/Year selector */}
        <div className="card p-5 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Month</label>
              <select value={month} onChange={e => setMonth(Number(e.target.value))}
                className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500">
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Year</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))}
                className="w-full bg-black border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500">
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          {existingId && <p className="text-xs text-yellow-600 mt-3">Editing existing entry for {MONTHS[month-1]} {year}</p>}
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* Income */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-1">Income</h3>
            <p className="text-xs text-gray-600 mb-4">Apps Written, Submitted/Issued AP, and Chargebacks are pulled automatically from your Policy Log.</p>
            <div className="grid grid-cols-2 gap-4">
              {field('earned', 'Earned (Commission)', '$', '')}
              {field('advance_pay', 'Advance Pay', '$')}
            </div>
          </div>

          {/* Expenses & Deposits */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-1">Expenses & Deposits</h3>
            <p className="text-xs text-gray-600 mb-4">Mo. Net and Take Home are auto-calculated.</p>
            <div className="grid grid-cols-2 gap-4">
              {field('mo_expenses', 'Monthly Expenses', '$')}
              {field('lead_spend', 'Lead Spend', '$')}
              {field('deposits', 'Deposits', '$')}
              {field('adv_owed', 'Advance Owed', '$')}
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full gold-gradient text-black font-black py-4 rounded-xl text-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {saved ? <><CheckCircle size={20} /> Saved!</> : saving ? 'Saving...' : <><Save size={20} /> Save Numbers</>}
          </button>
        </form>
      </div>
    </div>
  )
}
