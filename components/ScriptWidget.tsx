'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { BookOpen, X, ChevronLeft, ChevronRight, Check, GripHorizontal, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { SCRIPT_STEPS, OBJECTIONS, personalize, type ScriptCtx } from '@/lib/appointmentScript'

const DEFAULT_NOTES = `Personal notes / cheat sheet…

— B.E.S.T. —
B - Build rapport
E - Establish need
S - Solution / present options
T - Tie down the sale`

const DESKTOP_W = 420
const DESKTOP_H = 540

export default function ScriptWidget({ lead }: { lead?: ScriptCtx } = {}) {
  const [open, setOpen]           = useState(false)
  const [mode, setMode]           = useState<'guided' | 'notes'>('guided')
  const [step, setStep]           = useState(0)
  const [objIdx, setObjIdx]       = useState<number | null>(null)
  const [branchIdx, setBranchIdx] = useState<number | null>(null)
  const [agentId, setAgentId]     = useState<string | null>(null)
  const [agentName, setAgentName] = useState('')
  const [notes, setNotes]         = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [saved, setSaved]         = useState(false)
  const [isMobile, setIsMobile]   = useState(false)
  const loadedRef = useRef(false)

  // Desktop drag / resize
  const [pos, setPos]   = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ w: DESKTOP_W, h: DESKTOP_H })
  const dragging    = useRef(false)
  const resizing    = useRef(false)
  const dragStart   = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const resizeStart = useRef({ mx: 0, my: 0, w: 0, h: 0 })
  const posInited   = useRef(false)

  // Detect mobile on mount + resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Desktop: place bottom-right on first open
  const initPos = useCallback(() => {
    if (!posInited.current) {
      posInited.current = true
      setPos({ x: window.innerWidth - DESKTOP_W - 20, y: window.innerHeight - DESKTOP_H - 20 })
    }
  }, [])

  // Mouse drag
  const onDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
  }
  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    resizing.current = true
    resizeStart.current = { mx: e.clientX, my: e.clientY, w: size.w, h: size.h }
  }
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current) {
        setPos({ x: dragStart.current.px + e.clientX - dragStart.current.mx, y: dragStart.current.py + e.clientY - dragStart.current.my })
      }
      if (resizing.current) {
        setSize({ w: Math.max(320, resizeStart.current.w + e.clientX - resizeStart.current.mx), h: Math.max(300, resizeStart.current.h + e.clientY - resizeStart.current.my) })
      }
    }
    const onUp = () => { dragging.current = false; resizing.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  // Load agent data
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      setAgentId(session.user.id)
      const { data } = await supabase.from('profiles').select('name,phone_script').eq('id', session.user.id).single()
      setAgentName(data?.name?.split(' ')[0] || '')
      setNotes(data?.phone_script || DEFAULT_NOTES)
      setTimeout(() => { loadedRef.current = true }, 200)
    })
  }, [])

  // Autosave notes
  useEffect(() => {
    if (!loadedRef.current || !agentId) return
    const t = setTimeout(async () => {
      await supabase.from('profiles').update({ phone_script: notes }).eq('id', agentId)
      setSaved(true); setTimeout(() => setSaved(false), 1500)
    }, 800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes])

  const ctx: ScriptCtx = { ...(lead || {}), agent: agentName }
  const cur = SCRIPT_STEPS[step]
  const activeObj    = objIdx != null ? OBJECTIONS[objIdx] : null
  const activeBranch = activeObj && branchIdx != null ? activeObj.branches?.[branchIdx] : null

  function pickObjection(i: number) { setObjIdx(i); setBranchIdx(null) }
  function closeObjection() { setObjIdx(null); setBranchIdx(null) }
  function close() { setOpen(false) }

  // ─── Shared inner content ───────────────────────────────────────────
  const Header = (
    <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--divider)' }}>
      <div className="flex items-center gap-2">
        {!isMobile && <GripHorizontal size={14} className="text-gray-500" />}
        <div className="inline-flex gap-1 p-1 rounded-lg" style={{ background: 'var(--card-bg-2)' }}>
          {(['guided', 'notes'] as const).map(m => (
            <button key={m}
              onMouseDown={e => e.stopPropagation()}
              onClick={() => setMode(m)}
              className="px-3 py-1.5 rounded-md text-xs font-bold transition"
              style={mode === m ? { background: 'var(--card-bg)', color: 'var(--fg)' } : { color: 'var(--fg-muted)' }}>
              {m === 'guided' ? 'Guided Script' : 'My Notes'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {mode === 'notes' && saved && (
          <span className="text-xs text-green-500 flex items-center gap-1"><Check size={12} /> saved</span>
        )}
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={close}
          className="p-1 rounded-full hover:opacity-70 transition"
          style={{ color: 'var(--fg-muted)' }}>
          {isMobile ? <ChevronDown size={22} /> : <X size={18} />}
        </button>
      </div>
    </div>
  )

  const GuidedContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Step nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--divider)' }}>
        <button onClick={() => { setStep(s => Math.max(0, s - 1)); closeObjection() }} disabled={step === 0}
          className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-30 transition"
          style={{ background: 'var(--card-bg-2)', color: 'var(--fg-muted)' }}>
          <ChevronLeft size={20} />
        </button>
        <div className="text-center flex-1 px-2">
          <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--fg-subtle)' }}>
            Step {step + 1} / {SCRIPT_STEPS.length}
          </p>
          <p className="text-sm font-black gold-text leading-tight mt-0.5">{cur.title}</p>
          {/* Progress dots */}
          <div className="flex justify-center gap-1 mt-2">
            {SCRIPT_STEPS.map((_, i) => (
              <button key={i} onClick={() => { setStep(i); closeObjection() }}
                className={clsx('rounded-full transition-all', i === step ? 'w-4 h-1.5 bg-yellow-500' : 'w-1.5 h-1.5')}
                style={{ background: i < step ? 'rgba(212,160,23,0.5)' : i === step ? undefined : 'var(--card-border)' }} />
            ))}
          </div>
        </div>
        <button onClick={() => { setStep(s => Math.min(SCRIPT_STEPS.length - 1, s + 1)); closeObjection() }} disabled={step === SCRIPT_STEPS.length - 1}
          className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-30 transition"
          style={{ background: 'var(--card-bg-2)', color: 'var(--fg-muted)' }}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Script body */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--fg)' }}>
          {personalize(cur.body, ctx)}
        </p>

        {/* Objections */}
        <div className="pt-3 border-t" style={{ borderColor: 'var(--divider)' }}>
          {!activeObj ? (
            <>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2.5" style={{ color: 'var(--fg-muted)' }}>
                Objection? Tap it
              </p>
              <div className="flex flex-wrap gap-2">
                {OBJECTIONS.map((o, i) => (
                  <button key={i} onClick={() => pickObjection(i)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold border transition active:scale-95"
                    style={{ borderColor: 'rgba(212,160,23,0.45)', color: 'var(--fg)', background: 'var(--card-bg-2)' }}>
                    "{o.label}"
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-xl p-3.5 space-y-3" style={{ background: 'var(--card-bg-2)', border: '1px solid rgba(212,160,23,0.35)' }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-black gold-text">"{activeObj.label}"</p>
                <button onClick={closeObjection} className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--fg-muted)' }}>
                  <ChevronLeft size={12} /> Back
                </button>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--fg)' }}>{personalize(activeObj.response, ctx)}</p>
              {activeObj.branches && activeObj.branches.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-2 font-bold" style={{ color: 'var(--fg-subtle)' }}>If they say…</p>
                  <div className="flex flex-wrap gap-2">
                    {activeObj.branches.map((b, j) => (
                      <button key={j} onClick={() => setBranchIdx(j)}
                        className="px-2.5 py-1 rounded-full text-xs font-bold border transition"
                        style={branchIdx === j
                          ? { background: 'var(--card-bg)', color: 'var(--fg)', borderColor: 'rgba(212,160,23,0.5)' }
                          : { color: 'var(--fg-muted)', borderColor: 'var(--card-border)' }}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                  {activeBranch && (
                    <p className="text-sm leading-relaxed mt-3 pt-3 border-t" style={{ color: 'var(--fg)', borderColor: 'var(--divider)' }}>
                      {personalize(activeBranch.response, ctx)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const NotesContent = (
    <div className="p-4 overflow-y-auto flex-1">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>Your personal notes</p>
        <button onClick={() => setEditingNotes(e => !e)} className="text-xs font-bold gold-text">
          {editingNotes ? 'Done' : 'Edit'}
        </button>
      </div>
      {editingNotes ? (
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={12}
          className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none font-mono"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--fg)' }} />
      ) : (
        <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed" style={{ color: 'var(--fg)' }}>{notes}</pre>
      )}
    </div>
  )

  // ─── Trigger button ──────────────────────────────────────────────────
  const TriggerBtn = !open && (
    <button
      onClick={() => { setOpen(true); if (!isMobile) initPos() }}
      className="fixed bottom-6 right-5 z-40 gold-gradient text-black font-bold px-5 py-3 rounded-full shadow-lg hover:opacity-90 transition flex items-center gap-2 text-sm">
      <BookOpen size={16} /> Script
    </button>
  )

  // ─── MOBILE: full-width bottom sheet ────────────────────────────────
  if (isMobile) {
    return (
      <>
        {TriggerBtn}
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={close} />
            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderBottom: 'none',
                maxHeight: '80vh',
                // pull handle at top
              }}>
              {/* Pull indicator */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-600" />
              </div>
              {Header}
              <div className="flex-1 overflow-hidden flex flex-col">
                {mode === 'guided' ? GuidedContent : NotesContent}
              </div>
              {/* Safe area spacer */}
              <div className="h-safe-bottom flex-shrink-0" style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
            </div>
          </>
        )}
      </>
    )
  }

  // ─── DESKTOP: floating draggable panel ──────────────────────────────
  return (
    <>
      {TriggerBtn}
      {open && (
        <div className="fixed z-40 card-gold rounded-2xl shadow-2xl flex flex-col select-none overflow-hidden"
          style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}>
          {/* Drag header */}
          <div onMouseDown={onDragMouseDown} className="cursor-grab active:cursor-grabbing flex-shrink-0">
            {Header}
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            {mode === 'guided' ? GuidedContent : NotesContent}
          </div>
          {/* Resize handle */}
          <div onMouseDown={onResizeMouseDown}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end pb-1.5 pr-1.5"
            style={{ color: 'var(--fg-subtle)' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 3L3 9M9 6L6 9M9 9" />
            </svg>
          </div>
        </div>
      )}
    </>
  )
}
