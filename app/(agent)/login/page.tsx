'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Lock, Mail, User, Hash, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router   = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [invite,   setInvite]   = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const INVITE_CODE = (process.env.NEXT_PUBLIC_INVITE_CODE || 'CARRILLO2026').trim().toUpperCase()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isSignUp) {
      if (invite.trim().toUpperCase() !== INVITE_CODE) {
        setError('Invalid invite code. Ask your manager for the agency code.')
        setLoading(false); return
      }
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }
      if (data.user) {
        await supabase.from('profiles').insert({ id: data.user.id, name, email, role: 'agent' })
      }
    } else {
      const timeout = new Promise<{ error: { message: string } }>(res =>
        setTimeout(() => res({ error: { message: 'Sign-in timed out. Please try again.' } }), 12000))
      const { error: signInError } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        timeout,
      ]) as { error: { message: string } | null }
      if (signInError) { setError(signInError.message); setLoading(false); return }
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#080E1C' }}>

      {/* ── Left panel (decorative, hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #060A16 0%, #0F172A 50%, #0B1220 100%)' }}>
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.06) 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-md text-center">
          <img src="/logo.png" alt="The Carrillo Agency" className="h-32 w-auto mx-auto mb-10 drop-shadow-2xl" />
          <h1 className="text-4xl font-black text-white mb-4 leading-tight">
            Built for <span className="gold-text">closers</span>.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Track every dial, policy, and dollar. The Carrillo Agency performance platform gives your team the edge.
          </p>

          {/* Stats row */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { value: '10', label: 'Agents' },
              { value: '24/7', label: 'Visibility' },
              { value: '∞', label: 'Hustle' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-slate-800 p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-2xl font-black gold-text">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12" style={{ background: '#060A16' }}>
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <img src="/logo.png" alt="The Carrillo Agency" className="h-20 w-auto mx-auto" />
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-black text-white mb-1">
            {isSignUp ? 'Join the agency' : 'Welcome back'}
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            {isSignUp ? 'Create your agent account' : 'Sign in to your dashboard'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <InputField icon={User} label="Full Name" type="text" value={name}
                  onChange={e => setName(e.target.value)} placeholder="Your name" required />
                <InputField icon={Hash} label="Agency Invite Code" type="text" value={invite}
                  onChange={e => setInvite(e.target.value)} placeholder="Ask your manager" required />
              </>
            )}
            <InputField icon={Mail} label="Email" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="you@carrilloagency.com" required />
            <InputField icon={Lock} label="Password" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm text-red-300 border border-red-500/20"
                style={{ background: 'rgba(239,68,68,0.08)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 gold-gradient text-black font-bold py-3.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50 mt-2"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Please wait…</>
                : <>{isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={16} /></>
              }
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => { setIsSignUp(!isSignUp); setError('') }}
              className="text-yellow-500 hover:text-yellow-400 font-semibold transition">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function InputField({ icon: Icon, label, ...props }: {
  icon: any; label: string; type: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          {...props}
          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white border border-slate-700 focus:outline-none focus:border-yellow-500/60 focus:ring-2 focus:ring-yellow-500/10 transition"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />
      </div>
    </div>
  )
}
