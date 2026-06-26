'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import { useToast } from '@/components/Toast'
import { useTheme } from '@/components/ThemeProvider'
import { Camera, Save, User, Link2, Sun, Moon, Phone, Lock } from 'lucide-react'
import clsx from 'clsx'
import { DIAL_MODES } from '@/lib/constants'

type Profile = { id: string; name: string; email: string; avatar_url: string; calendar_link: string; dial_mode?: number; contract_level?: number; role?: string; manager_id?: string | null }

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { resolved, setMode } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [calLink, setCalLink] = useState('')
  const [dialMode, setDialMode] = useState(1)
  const [contractLevel, setContractLevel] = useState(80)
  const [isManager, setIsManager] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      let { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!p) {
        const nm = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Agent'
        await supabase.from('profiles').insert({ id: session.user.id, name: nm, email: session.user.email, role: 'agent' })
        const { data: p2 } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        p = p2
      }
      setProfile(p); setName(p?.name || ''); setAvatar(p?.avatar_url || ''); setCalLink(p?.calendar_link || ''); setDialMode(p?.dial_mode || 1); setContractLevel(p?.contract_level || 80)
      // Only managers (role=manager or anyone with a downline) may change contract level
      const { data: downline } = await supabase.from('profiles').select('id').eq('manager_id', session.user.id)
      setIsManager((p as any)?.role === 'manager' || ((downline?.length || 0) > 0))
    })
  }, [router])

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        // resize to 160px square, store as compact data URL
        const size = 160
        const canvas = document.createElement('canvas')
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d')!
        const min = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size)
        setAvatar(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  async function save() {
    if (!profile) return
    setSaving(true)
    const payload: any = { name: name.trim() || profile.name, avatar_url: avatar, calendar_link: calLink, dial_mode: dialMode }
    // Only managers may change their own contract/commission level
    if (isManager) payload.contract_level = contractLevel
    const { error } = await supabase.from('profiles').update(payload).eq('id', profile.id)
    setSaving(false)
    if (error) { toast('Could not save: ' + error.message, 'error'); return }
    toast('Settings saved', 'success')
    setProfile({ ...profile, name, avatar_url: avatar, calendar_link: calLink, dial_mode: dialMode, contract_level: contractLevel })
  }

  if (!profile) return <Loading />

  const initials = (name || profile.name).split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={profile.name} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <User size={28} className="text-yellow-500" />
          <div>
            <h1 className="text-3xl font-black text-white">Settings</h1>
            <p className="text-gray-500 mt-0.5">Your profile & preferences</p>
          </div>
        </div>

        {/* Profile */}
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-5">Profile</h2>
          <div className="flex items-center gap-5 mb-5">
            <div className="relative">
              {avatar
                ? <img src={avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-gray-700" />
                : <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center text-black font-black text-2xl">{initials}</div>}
              <button onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-white hover:bg-gray-700">
                <Camera size={15} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} className="hidden" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500" />
              <p className="text-xs text-gray-600 mt-1">{profile.email}</p>
            </div>
          </div>
        </div>

        {/* Scheduling */}
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Link2 size={15} /> Scheduling Link</h2>
          <input value={calLink} onChange={e => setCalLink(e.target.value)} placeholder="https://calendly.com/your-name"
            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500" />
          <p className="text-xs text-gray-600 mt-1">Used in appointment & review messages so clients can book/reschedule.</p>
        </div>

        {/* Contract level */}
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-1">Contract / Commission Level</h2>
          <p className="text-xs text-gray-600 mb-4">Your comp level. Sets your comp % auto-fill, and your override spread over downline agents.</p>
          {isManager ? (
            <select value={contractLevel} onChange={e => setContractLevel(Number(e.target.value))}
              className="w-32 bg-black border border-gray-700 rounded-lg px-3 py-2.5 text-white font-black text-lg focus:outline-none focus:border-yellow-500">
              {[80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-32 rounded-lg px-3 py-2.5 font-black text-lg flex items-center justify-between cursor-not-allowed"
                style={{ background: 'var(--card-bg-2)', border: '1px solid var(--card-border)', color: 'var(--fg)' }}>
                {contractLevel} <Lock size={15} style={{ color: 'var(--fg-subtle)' }} />
              </div>
              <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--fg-muted)' }}>
                <span className="font-bold" style={{ color: 'var(--fg)' }}>Locked.</span> Check with your upline about how to hit your next promotion.
              </p>
            </div>
          )}
        </div>

        {/* Dialing mode */}
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-1 flex items-center gap-2"><Phone size={15} /> Dialing Style</h2>
          <p className="text-xs text-gray-600 mb-4">How many times you dial a lead before it advances a pipeline bucket.</p>
          <div className="space-y-2">
            {DIAL_MODES.map(m => (
              <button key={m.value} onClick={() => setDialMode(m.value)}
                className={clsx('w-full flex items-center justify-between text-left px-4 py-3 rounded-xl border transition',
                  dialMode === m.value ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-800 bg-gray-900 hover:border-gray-700')}>
                <div>
                  <p className={clsx('font-bold text-sm', dialMode === m.value ? 'text-yellow-400' : 'text-white')}>{m.label}</p>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                </div>
                {dialMode === m.value && <span className="text-yellow-500 font-black">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-black text-yellow-500 uppercase tracking-wider mb-4">Appearance</h2>
          <div className="flex gap-2">
            <button onClick={() => setMode('light')} className={clsx('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition', resolved === 'light' ? 'gold-gradient text-black' : 'bg-gray-900 text-gray-400 border border-gray-800')}><Sun size={15} /> Light</button>
            <button onClick={() => setMode('dark')} className={clsx('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition', resolved === 'dark' ? 'bg-black text-yellow-500 ring-1 ring-gray-700' : 'bg-gray-900 text-gray-400 border border-gray-800')}><Moon size={15} /> Dark</button>
          </div>
          <p className="text-xs text-gray-600 mt-2">Auto-switches to light during the day and dark at night unless you pick one.</p>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full flex items-center justify-center gap-2 gold-gradient text-black font-black py-3.5 rounded-xl hover:opacity-90 transition disabled:opacity-50">
          <Save size={18} /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
