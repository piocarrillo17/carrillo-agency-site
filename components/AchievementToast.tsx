'use client'
import { useEffect, useState } from 'react'
import { BadgeDef, TIER_STYLE } from '@/lib/badges'

// Xbox-style achievement unlock: slides in from the right, shine sweep + chime,
// plays each queued badge in sequence, then calls onDone.
export default function AchievementToast({ badges, onDone }: { badges: BadgeDef[]; onDone?: () => void }) {
  const [idx, setIdx] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (idx >= badges.length) { onDone?.(); return }
    setShow(false)
    const enter = setTimeout(() => { setShow(true); playChime() }, 60)
    const exit = setTimeout(() => setShow(false), 4200)
    const next = setTimeout(() => setIdx(i => i + 1), 4900)
    return () => { clearTimeout(enter); clearTimeout(exit); clearTimeout(next) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, badges.length])

  if (idx >= badges.length) return null
  const b = badges[idx]
  const t = TIER_STYLE[b.tier]

  return (
    <div className="fixed top-6 right-6 z-[100] pointer-events-none">
      <div
        className={`relative overflow-hidden flex items-center gap-4 pl-4 pr-6 py-3 rounded-2xl bg-black/90 backdrop-blur border ${t.ring} ring-2 shadow-2xl transition-all duration-500 ease-out
          ${show ? 'translate-x-0 opacity-100' : 'translate-x-[130%] opacity-0'}`}
        style={{ minWidth: 300 }}
      >
        {/* shine sweep */}
        {show && <span className="achv-shine" />}
        {/* badge medallion */}
        <div className={`achv-pop flex items-center justify-center w-14 h-14 rounded-full ${t.bg} ring-2 ${t.ring} text-3xl`}>
          {b.emoji}
        </div>
        <div className="relative">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Achievement Unlocked</p>
          <p className="text-lg font-black text-white leading-tight">{b.label}</p>
          <p className={`text-xs ${t.text}`}>{t.label} · {b.desc}</p>
        </div>
      </div>
    </div>
  )
}

// Short rising chime via the Web Audio API (no asset file needed)
function playChime() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const notes = [523.25, 659.25, 783.99, 1046.5] // C E G C
    notes.forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'triangle'
      o.frequency.value = f
      const start = ctx.currentTime + i * 0.11
      g.gain.setValueAtTime(0, start)
      g.gain.linearRampToValueAtTime(0.18, start + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.45)
      o.start(start)
      o.stop(start + 0.45)
    })
    setTimeout(() => { try { ctx.close() } catch {} }, 1200)
  } catch {}
}
