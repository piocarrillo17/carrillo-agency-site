'use client'
import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import {
  CLOSING_STEPS, BLANK_CTX, calcLeftover, fmt$,
  type ClosingCtx, type FieldDef,
} from '@/lib/closingScript'

const inp = 'w-full bg-black border border-gray-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500'

function Field({ def, ctx, onChange }: { def: FieldDef; ctx: ClosingCtx; onChange: (k: keyof ClosingCtx, v: string | boolean) => void }) {
  const val = ctx[def.key]
  const strVal = typeof val === 'boolean' ? '' : (val as string)

  if (def.type === 'checkbox') {
    return (
      <label className="flex items-center gap-3 cursor-pointer">
        <div onClick={() => onChange(def.key, !val)}
          className={clsx('w-5 h-5 rounded border-2 flex items-center justify-center transition flex-shrink-0',
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
        className={inp + ' capitalize'}>
        {def.options?.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }
  if (def.type === 'dollar') {
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs">$</span>
        <input type="number" min="0" value={strVal} onChange={e => onChange(def.key, e.target.value)}
          placeholder={def.placeholder}
          className="w-full bg-black border border-gray-800 rounded-lg pl-6 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500" />
      </div>
    )
  }
  if (def.type === 'textarea') {
    return (
      <textarea value={strVal} onChange={e => onChange(def.key, e.target.value)}
        placeholder={def.placeholder} rows={3}
        className={inp + ' resize-none'} />
    )
  }
  return (
    <input type="text" value={strVal} onChange={e => onChange(def.key, e.target.value)}
      placeholder={def.placeholder} className={inp} />
  )
}

interface Props {
  initialCtx?: Partial<ClosingCtx>
  agentName?: string
  onCtxChange?: (ctx: ClosingCtx) => void
}

export default function LeadClosingScript({ initialCtx, agentName, onCtxChange }: Props) {
  const [ctx, setCtx] = useState<ClosingCtx>({ ...BLANK_CTX, agentName: agentName || '', ...initialCtx })
  const [stepIdx, setStepIdx] = useState(0)

  const update = useCallback((key: keyof ClosingCtx, val: string | boolean) => {
    setCtx(c => {
      const next = { ...c, [key]: val }
      onCtxChange?.(next)
      return next
    })
  }, [onCtxChange])

  function reset() {
    if (!confirm('Clear all script answers for this lead?')) return
    const fresh = { ...BLANK_CTX, agentName: agentName || '', ...initialCtx }
    setCtx(fresh)
    setStepIdx(0)
    onCtxChange?.(fresh)
  }

  const visibleSteps = CLOSING_STEPS.filter(s => !s.onlyIf || s.onlyIf(ctx))
  const step = visibleSteps[stepIdx] ?? visibleSteps[0]
  const isFirst = stepIdx === 0
  const isLast = stepIdx === visibleSteps.length - 1
  const leftover = calcLeftover(ctx)

  return (
    <div className="space-y-4 pb-8">
      {/* Controls row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Client type */}
        <div className="inline-flex gap-1 bg-gray-900 rounded-xl p-1">
          {(['standard', 'older'] as const).map(t => (
            <button key={t} onClick={() => update('clientType', t)}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize',
                ctx.clientType === t ? 'gold-gradient text-black' : 'text-gray-400')}>
              {t === 'standard' ? 'Standard' : 'Older Client'}
            </button>
          ))}
        </div>
        <button onClick={reset}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition">
          <RotateCcw size={12} /> Reset Script
        </button>
      </div>

      {/* Financial bar */}
      {ctx.combinedIncome && (
        <div className="card-gold rounded-xl px-4 py-3 flex flex-wrap gap-4 items-center">
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Income</p>
            <p className="font-black text-white text-sm">${Number(ctx.combinedIncome).toLocaleString()}/mo</p>
          </div>
          {ctx.mortgagePayment && <>
            <span className="text-gray-700 text-sm">−</span>
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Mortgage</p>
              <p className="font-black text-white text-sm">${Number(ctx.mortgagePayment).toLocaleString()}/mo</p>
            </div>
          </>}
          {ctx.otherExpenses && <>
            <span className="text-gray-700 text-sm">−</span>
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Expenses</p>
              <p className="font-black text-white text-sm">${Number(ctx.otherExpenses).toLocaleString()}/mo</p>
            </div>
          </>}
          {leftover !== null && <>
            <span className="text-gray-700 text-sm">=</span>
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Leftover</p>
              <p className={clsx('font-black text-base', leftover >= 0 ? 'text-green-400' : 'text-red-400')}>
                {fmt$(leftover)}/mo
              </p>
            </div>
          </>}
        </div>
      )}

      {/* Progress dots */}
      <div className="flex gap-1 flex-wrap">
        {visibleSteps.map((s, i) => (
          <button key={s.id} onClick={() => setStepIdx(i)}
            className={clsx('flex-1 min-w-[20px] h-1.5 rounded-full transition',
              i === stepIdx ? 'bg-yellow-500' : i < stepIdx ? 'bg-yellow-700' : 'bg-gray-800')} />
        ))}
      </div>

      {/* Step card */}
      <div className="card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--divider)' }}>
          <span className="text-xl">{step.icon}</span>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Step {stepIdx + 1} of {visibleSteps.length}</p>
            <h3 className="font-black text-white">{step.title}</h3>
          </div>
        </div>

        {/* Fields */}
        {step.fields && step.fields.length > 0 && (
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--divider)' }}>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">Fill In</p>
            <div className="grid grid-cols-2 gap-2.5">
              {step.fields.map(f => (
                <div key={f.key} className={clsx(f.half === false || f.type === 'textarea' || f.type === 'checkbox' ? 'col-span-2' : 'col-span-1')}>
                  {f.type !== 'checkbox' && <label className="block text-xs text-gray-500 mb-1">{f.label}</label>}
                  <Field def={f} ctx={ctx} onChange={update} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Computed */}
        {step.computed && (() => {
          const results = step.computed!(ctx)
          if (!results.length) return null
          return (
            <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--divider)', background: 'var(--card-bg-2)' }}>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Live Calculation</p>
              <div className="flex flex-wrap gap-4">
                {results.map(r => (
                  <div key={r.label}>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{r.label}</p>
                    <p className={clsx('font-black text-sm', r.highlight ? 'text-green-400' : 'text-white')}>{r.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Script */}
        <div className="px-5 py-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-3">Script</p>
          <div className="rounded-xl px-4 py-3" style={{ background: 'var(--card-bg-2)', border: '1px solid rgba(212,160,23,0.25)' }}>
            <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-gray-100">
              {step.script(ctx)}
            </pre>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setStepIdx(i => Math.max(0, i - 1))} disabled={isFirst}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white font-bold text-sm disabled:opacity-30 hover:bg-gray-800 transition">
          <ChevronLeft size={14} /> Back
        </button>
        <span className="text-xs text-gray-600">{stepIdx + 1} / {visibleSteps.length}</span>
        <button onClick={() => setStepIdx(i => Math.min(visibleSteps.length - 1, i + 1))} disabled={isLast}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gold-gradient text-black font-black text-sm disabled:opacity-30 hover:opacity-90 transition">
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
