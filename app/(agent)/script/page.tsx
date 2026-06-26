'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Loading from '@/components/Loading'
import { Edit3, Check } from 'lucide-react'

type Profile = { id: string; name: string }

const DEFAULT_SCRIPT = `Hey [NAME]? My name is _____ with The Carrillo Agency.

I'm calling about your mortgage in the amount of $_____ with _____ bank. I'm getting back to you about the postcard you received in the mail regarding your mortgage.

You called the number and followed the prompts to answer a few questions so we could contact you back regarding your mortgage protection options — do you remember that?

Ok, let me just verify some of the information you provided so we can work up several options for you...

— B.E.S.T. Phone Script —
B — Build rapport (find common ground, be human)
E — Establish need (why did they request info? who depends on them?)
S — Solution (present 2–3 options, anchor high)
T — Tie down (assume the sale, ask for the application)

OBJECTIONS
"I need to think about it" → "Totally fair. What specifically is giving you pause — the coverage amount or the monthly?"
"It's too expensive" → "Let's find a number that protects your family AND fits the budget. What were you hoping to invest monthly?"
"I need to talk to my spouse" → "Smart. Let's get them on the phone now so you both have the same info."`

export default function ScriptPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [script, setScript] = useState('')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const loadedRef = useRef(false)

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
      setScript(p?.phone_script || DEFAULT_SCRIPT)
      setTimeout(() => { loadedRef.current = true }, 200)
    })
  }, [router])

  useEffect(() => {
    if (!loadedRef.current || !profile) return
    const t = setTimeout(async () => {
      await supabase.from('profiles').update({ phone_script: script }).eq('id', profile.id)
      setSaved(true); setTimeout(() => setSaved(false), 1500)
    }, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script])

  if (!profile) return <Loading />

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={profile.name} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white">Phone Script</h1>
            <p className="text-gray-500 mt-1">Your go-to script {saved && <span className="text-green-500">· saved</span>}</p>
          </div>
          <button onClick={() => setEditing(e => !e)}
            className="flex items-center gap-2 gold-gradient text-black font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition">
            {editing ? <><Check size={16} /> Done</> : <><Edit3 size={16} /> Edit</>}
          </button>
        </div>

        <div className="card p-6">
          {editing ? (
            <textarea value={script} onChange={e => setScript(e.target.value)} rows={28}
              className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500 resize-none font-mono" />
          ) : (
            <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">{script}</pre>
          )}
        </div>
      </div>
    </div>
  )
}
