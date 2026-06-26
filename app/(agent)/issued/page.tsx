'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import clsx from 'clsx'

type Profile = { id: string; name: string }
type Policy = {
  id: string; client_name: string; carrier: string; apv: number
  comp_percent: number; advance_rate: number; commission_paid: number
  commission_status: string; date_written: string; status: string
}

const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function IssuedPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Paid'>('All')

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
      const { data } = await supabase.from('policy_log').select('*').eq('agent_id', session.user.id).eq('status', 'Issued').order('date_written', { ascending: false })
      setPolicies(data || [])
    })
  }, [router])

  const projComm = (p: Policy) => p.apv * ((p.comp_percent ?? 100) / 100) * ((p.advance_rate ?? 75) / 100)

  async function togglePaid(p: Policy) {
    const newStatus = p.commission_status === 'Paid' ? 'Pending' : 'Paid'
    const paidAmt = newStatus === 'Paid' ? (p.commission_paid || projComm(p)) : p.commission_paid
    await supabase.from('policy_log').update({ commission_status: newStatus, commission_paid: paidAmt }).eq('id', p.id)
    setPolicies(list => list.map(x => x.id === p.id ? { ...x, commission_status: newStatus, commission_paid: paidAmt } : x))
  }

  if (!profile) return <Loading />

  const filtered = policies.filter(p => filter === 'All' || p.commission_status === filter)
  const paidTotal = policies.filter(p => p.commission_status === 'Paid').reduce((s, p) => s + (p.commission_paid || projComm(p)), 0)
  const pendingTotal = policies.filter(p => p.commission_status !== 'Paid').reduce((s, p) => s + projComm(p), 0)

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={profile.name} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-white">Issue Paid</h1>
          <p className="text-gray-500 mt-1">Track which issued policies have actually paid out</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-500/10 border border-green-700/40 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Paid Out</p>
            <p className="text-3xl font-black text-green-400">{fmt(paidTotal)}</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-700/40 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Awaiting Payment</p>
            <p className="text-3xl font-black text-yellow-400">{fmt(pendingTotal)}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {(['All', 'Pending', 'Paid'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition', filter === f ? 'gold-gradient text-black' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white')}>{f}</button>
          ))}
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {['Client', 'Carrier', 'APV', 'Projected Comm', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-600">No issued policies yet. Mark policies "Issued" on the Clients & Sales page.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-900 hover:bg-white/5 transition">
                  <td className="px-4 py-3 font-medium text-white">{p.client_name}</td>
                  <td className="px-4 py-3 text-gray-400">{p.carrier || '—'}</td>
                  <td className="px-4 py-3 text-gray-300">{fmt(p.apv)}</td>
                  <td className="px-4 py-3 text-yellow-400 font-bold">{fmt(p.commission_paid || projComm(p))}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('px-2.5 py-1 rounded-full text-xs font-bold', p.commission_status === 'Paid' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300')}>
                      {p.commission_status === 'Paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePaid(p)}
                      className={clsx('px-3 py-1.5 rounded-lg text-xs font-bold transition', p.commission_status === 'Paid' ? 'bg-gray-800 text-gray-400 hover:text-white' : 'gold-gradient text-black hover:opacity-90')}>
                      {p.commission_status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
