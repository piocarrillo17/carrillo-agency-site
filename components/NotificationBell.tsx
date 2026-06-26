'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, X, Phone, Calendar, Clock } from 'lucide-react'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'

type Alert = {
  id: string
  leadId: string
  name: string
  type: 'upcoming_appt' | 'overdue_callback'
  detail: string
  time: Date
}

function timeLabel(d: Date) {
  const mins = Math.round((d.getTime() - Date.now()) / 60000)
  if (mins > 0) return `in ${mins}m`
  if (mins === 0) return 'now'
  const ago = Math.abs(mins)
  if (ago < 60) return `${ago}m overdue`
  return `${Math.floor(ago / 60)}h overdue`
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = localStorage.getItem('dismissed_alerts')
      if (!raw) return new Set()
      const { ids, ts } = JSON.parse(raw)
      // Clear dismissed list after 24 hours so future appointments show again
      if (Date.now() - ts > 24 * 60 * 60 * 1000) return new Set()
      return new Set(ids as string[])
    } catch { return new Set() }
  })
  const panelRef = useRef<HTMLDivElement>(null)
  const dismissedRef = useRef(dismissed)
  const router = useRouter()

  useEffect(() => { dismissedRef.current = dismissed }, [dismissed])

  async function fetchAlerts() {
    const dismissed = dismissedRef.current
    const now = new Date()
    const in15 = new Date(now.getTime() + 15 * 60_000)

    const [{ data: appts }, { data: callbacks }] = await Promise.all([
      // Appointments within the next 15 minutes OR up to 30 min past
      supabase.from('leads')
        .select('id,name,appt_date,appt_type,disposition')
        .eq('agent_id', userId)
        .eq('is_dead', false)
        .gte('appt_date', new Date(now.getTime() - 30 * 60_000).toISOString())
        .lte('appt_date', in15.toISOString())
        .not('appt_date', 'is', null),
      // Overdue "Wants callback" leads
      supabase.from('leads')
        .select('id,name,appt_date,disposition')
        .eq('agent_id', userId)
        .eq('disposition', 'Wants callback')
        .eq('is_dead', false)
        .lt('appt_date', now.toISOString())
        .not('appt_date', 'is', null),
    ])

    const next: Alert[] = []

    for (const a of appts || []) {
      const key = `appt-${a.id}`
      next.push({
        id: key,
        leadId: a.id,
        name: a.name,
        type: 'upcoming_appt',
        detail: a.appt_type || a.disposition || 'Appointment',
        time: new Date(a.appt_date),
      })
    }

    for (const c of callbacks || []) {
      const key = `cb-${c.id}`
      next.push({
        id: key,
        leadId: c.id,
        name: c.name,
        type: 'overdue_callback',
        detail: 'Wants callback',
        time: new Date(c.appt_date),
      })
    }

    setAlerts(next.filter(a => !dismissed.has(a.id)).sort((a, b) => a.time.getTime() - b.time.getTime()))
  }

  useEffect(() => {
    if (!userId) return
    fetchAlerts()
    const t = setInterval(fetchAlerts, 60_000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Close panel when clicking outside
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function persistDismissed(ids: Set<string>) {
    try { localStorage.setItem('dismissed_alerts', JSON.stringify({ ids: [...ids], ts: Date.now() })) } catch {}
  }

  function dismiss(id: string) {
    setDismissed(prev => {
      const next = new Set([...prev, id])
      persistDismissed(next)
      return next
    })
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const visible = alerts.filter(a => !dismissed.has(a.id))
  const count = visible.length

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'relative w-8 h-8 rounded-full flex items-center justify-center transition',
          count > 0 ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
        )}
        aria-label={`${count} notifications`}
      >
        <Bell size={16} className={count > 0 ? 'animate-[wiggle_0.5s_ease-in-out]' : ''} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-10 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--divider)' }}>
            <span className="text-sm font-black" style={{ color: 'var(--fg)' }}>
              Notifications {count > 0 && <span className="text-red-400">({count})</span>}
            </span>
            {count > 0 && (
              <button onClick={() => { const ids = new Set(alerts.map(a => a.id)); persistDismissed(ids); setDismissed(ids); setAlerts([]) }}
                className="text-xs text-gray-500 hover:text-gray-300 transition">
                Clear all
              </button>
            )}
          </div>

          {/* Alert list */}
          {visible.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell size={24} className="mx-auto mb-2 text-gray-700" />
              <p className="text-sm text-gray-500">All clear — nothing pending.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y" style={{ borderColor: 'var(--divider)' }}>
              {visible.map(alert => (
                <div key={alert.id} className="flex items-start gap-3 px-4 py-3 hover:bg-black/20 transition group">
                  {/* Icon */}
                  <div className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                    alert.type === 'upcoming_appt' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                  )}>
                    {alert.type === 'upcoming_appt' ? <Calendar size={14} /> : <Phone size={14} />}
                  </div>

                  {/* Content — click to open lead */}
                  <button className="flex-1 text-left min-w-0" onClick={() => { router.push(`/leads/${alert.leadId}`); setOpen(false) }}>
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--fg)' }}>{alert.name}</p>
                    <p className="text-xs text-gray-400 truncate">{alert.detail}</p>
                    <p className={clsx('text-xs font-bold mt-0.5 flex items-center gap-1',
                      alert.type === 'overdue_callback' ? 'text-red-400' : 'text-yellow-400')}>
                      <Clock size={10} />
                      {timeLabel(alert.time)}
                    </p>
                  </button>

                  {/* Dismiss */}
                  <button onClick={() => dismiss(alert.id)}
                    className="text-gray-700 hover:text-gray-400 transition opacity-0 group-hover:opacity-100 flex-shrink-0 mt-1">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
