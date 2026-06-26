'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import {
  CLOSING_STEPS, BLANK_CTX, calcLeftover, fmt$,
  type ClosingCtx, type FieldDef,
} from '@/lib/closingScript'

const STORAGE_KEY = 'closing_script_ctx'

function DollarInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
      <input
        type="number" min="0" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black border border-gray-700 rounded-lg pl-7 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
      />
    </div>
  )
}

function Field({ def, ctx, onChange }: { def: FieldDef; ctx: ClosingCtx; onChange: (k: keyof ClosingCtx, v: string | boolean) => void }) {
  const val = ctx[def.key]
  const strVal = typeof val === 'boolean' ? '' : (val as string)
  const base = 'w-full bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500'

  if (def.type === 'checkbox') {
    return (
      <label className="flex items-center gap-3 cursor-pointer">
        <div onClick={() => onChange(def.key, !val)}
          className={clsx('w-5 h-5 rounded border-2 flex items-center justify-center transition',
            val ? 'border-yellow-500 bg-yellow-500' : 'border-gray-600')}>
          {val && <span className="text-black text-xs font-black">✓</span>}
        </div>
        <span className="text-sm text-gray-300">{def.label}</span>
      </label>
    )
  }
  if (def.type === 'select') {
    return (
      <select value={strVal} onChange={e => onChange(def.key, e.target.value)}
        className={base + ' capitalize'}>
        {def.options?.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  if (def.type === 'dollar') {
    return <DollarInput value={strVal} onChange={v => onChange(def.key, v)} placeholder={def.placeholder} />
  }
  if (def.type === 'textarea') {
    return (
      <textarea value={strVal} onChange={e => onChange(def.key, e.target.value)}
        placeholder={def.placeholder} rows={3}
        className={base + ' resize-none'} />
    )
  }
  return (
    <input type="text" value={strVal} onChange={e => onChange(def.key, e.target.value)}
      placeholder={def.placeholder} className={base} />
  )
}

export default function ClosingScriptPage() {
  const [ctx, setCtx] = useState<ClosingCtx>({ ...BLANK_CTX })
  const [stepIdx, setStepIdx] = useState(0)
  const [agentName, setAgentName] = useState('')

  // Load agent name + saved ctx
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase.from('profiles').select('name').eq('id', session.user.id).single()
      const name = data?.name || ''
      setAgentName(name)
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          setCtx({ ...BLANK_CTX, ...parsed, agentName: parsed.agentName || name })
        } else {
          setCtx(c => ({ ...c, agentName: name }))
        }
      } catch {
        setCtx(c => ({ ...c, agentName: name }))
      }
    })
  }, [])

  function update(key: keyof ClosingCtx, val: string | boolean) {
    setCtx(c => {
      const next = { ...c, [key]: val }
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function reset() {
    if (!confirm('Start a new call? This will clear all current answers.')) return
    const fresh = { ...BLANK_CTX, agentName }
    setCtx(fresh)
    setStepIdx(0)
    try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
  }

  // Filter steps based on clientType
  const visibleSteps = CLOSING_STEPS.filter(s => !s.onlyIf || s.onlyIf(ctx))
  const step = visibleSteps[stepIdx] ?? visibleSteps[0]
  const isFirst = stepIdx === 0
  const isLast = stepIdx === visibleSteps.length - 1
  const leftover = calcLeftover(ctx)

  return (
    <div className="min-h-screen app-bg md:pl-60 pt-14 md:pt-0">
      <Sidebar agentName={agentName} />
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-black text-white">Closing Script</h1>
            <p className="text-gray-500 mt-1">Mortgage Protection · Aged Leads</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Client type toggle */}
            <div className="inline-flex gap-1 bg-gray-900 rounded-xl p-1">
              {(['standard', 'older'] as const).map(t => (
                <button key={t} onClick={() => update('clientType', t)}
                  className={clsx('px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize',
                    ctx.clientType === t ? 'gold-gradient text-black' : 'text-gray-400')}>
                  {t === 'standard' ? 'Standard' : 'Older Client'}
                </button>
              ))}
            </div>
            <button onClick={reset} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition">
              <RotateCcw size={13} /> New Call
            </button>
          </div>
        </div>

        {/* Live financial summary bar — shows once income is entered */}
        {ctx.combinedIncome && (
          <div className="card-gold rounded-xl px-5 py-3 mb-5 flex flex-wrap gap-4 items-center">
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Income</p>
              <p className="font-black text-white text-sm">${Number(ctx.combinedIncome).toLocaleString()}/mo</p>
            </div>
            {ctx.mortgagePayment && <>
              <span className="text-gray-700">−</span>
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Mortgage</p>
                <p className="font-black text-white text-sm">${Number(ctx.mortgagePayment).toLocaleString()}/mo</p>
              </div>
            </>}
            {ctx.otherExpenses && <>
              <span className="text-gray-700">−</span>
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Expenses</p>
                <p className="font-black text-white text-sm">${Number(ctx.otherExpenses).toLocaleString()}/mo</p>
              </div>
            </>}
            {leftover !== null && <>
              <span className="text-gray-700">=</span>
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Leftover</p>
                <p className={clsx('font-black text-lg', leftover >= 0 ? 'text-green-400' : 'text-red-400')}>{fmt$(leftover)}/mo</p>
              </div>
            </>}
          </div>
        )}

        {/* Step progress */}
        <div className="flex gap-1 mb-5 flex-wrap">
          {visibleSteps.map((s, i) => (
            <button key={s.id} onClick={() => setStepIdx(i)}
              className={clsx('flex-1 min-w-[28px] h-1.5 rounded-full transition',
                i === stepIdx ? 'bg-yellow-500' : i < stepIdx ? 'bg-yellow-700' : 'bg-gray-800')} />
          ))}
        </div>

        {/* Step card */}
        <div className="card rounded-2xl overflow-hidden mb-4">
          {/* Step header */}
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--divider)' }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{step.icon}</span>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Step {stepIdx + 1} of {visibleSteps.length}</p>
                <h2 className="text-lg font-black text-white">{step.title}</h2>
              </div>
            </div>
          </div>

          {/* Input fields */}
          {step.fields && step.fields.length > 0 && (
            <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--divider)' }}>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-4">Fill In</p>
              <div className="grid grid-cols-2 gap-3">
                {step.fields.map(f => (
                  <div key={f.key} className={clsx(f.half === false || f.type === 'textarea' || f.type === 'checkbox' ? 'col-span-2' : 'col-span-1')}>
                    {f.type !== 'checkbox' && <label className="block text-xs text-gray-400 mb-1">{f.label}</label>}
                    <Field def={f} ctx={ctx} onChange={update} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Computed results */}
          {step.computed && (() => {
            const results = step.computed!(ctx)
            if (!results.length) return null
            return (
              <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--divider)', background: 'var(--card-bg-2)' }}>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-3">Live Calculation</p>
                <div className="flex flex-wrap gap-4">
                  {results.map(r => (
                    <div key={r.label}>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{r.label}</p>
                      <p className={clsx('font-black text-base', r.highlight ? 'text-green-400' : 'text-white')}>{r.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Script text */}
          <div className="px-6 py-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-4">Script</p>
            <div className="rounded-xl px-5 py-4" style={{ background: 'var(--card-bg-2)', border: '1px solid rgba(212,160,23,0.25)' }}>
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-gray-100">
                {step.script(ctx)}
              </pre>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => setStepIdx(i => Math.max(0, i - 1))} disabled={isFirst}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm disabled:opacity-30 hover:bg-gray-800 transition">
            <ChevronLeft size={16} /> Back
          </button>
          <span className="text-xs text-gray-600">{stepIdx + 1} / {visibleSteps.length}</span>
          <button onClick={() => setStepIdx(i => Math.min(visibleSteps.length - 1, i + 1))} disabled={isLast}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient text-black font-black text-sm disabled:opacity-30 hover:opacity-90 transition">
            Next <ChevronRight size={16} />
          </button>
        </div>

      </div>
    </div>
  )
}
