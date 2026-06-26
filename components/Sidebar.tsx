'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'
import {
  Home, Phone, FileText, BookOpen, Trophy, DollarSign, Users,
  BarChart3, Zap, Star, AlertTriangle, LogOut, Sun, Moon,
  Calendar, KanbanSquare, MessageSquare, Settings, Target, Menu, X,
  ChevronRight, GraduationCap,
} from 'lucide-react'
import clsx from 'clsx'
import NotificationBell from '@/components/NotificationBell'

const SECTIONS = [
  {
    title: 'Workspace',
    items: [
      { href: '/dashboard',    label: 'Dashboard',    icon: Home },
      { href: '/dials',        label: 'Dial Tracker', icon: Phone },
      { href: '/script',       label: 'Phone Script',   icon: BookOpen },
      { href: '/closing',      label: 'Closing Script', icon: FileText },
      { href: '/calendar',     label: 'Calendar',     icon: Calendar },
      { href: '/action-items', label: 'Action Items', icon: MessageSquare },
    ],
  },
  {
    title: 'Pipeline',
    items: [
      { href: '/leads',    label: 'Leads',      icon: Users },
      { href: '/pipeline', label: 'Pipeline',   icon: KanbanSquare },
      { href: '/policies', label: 'Policy Log', icon: FileText },
    ],
  },
  {
    title: 'Performance',
    items: [
      { href: '/hustle',      label: 'Hustle Score', icon: Zap },
      { href: '/goals',       label: 'Goals',        icon: Target },
      { href: '/analytics',   label: 'Analytics',    icon: BarChart3 },
      { href: '/coaching',    label: 'Coaching',     icon: GraduationCap },
      { href: '/leaderboard', label: 'Leaderboard',  icon: Trophy },
    ],
  },
  {
    title: 'Finance',
    items: [
      { href: '/deposits', label: 'Deposits & P&L', icon: DollarSign },
      { href: '/debt',     label: 'Debt',           icon: AlertTriangle },
      { href: '/issued',   label: 'Issue Tracker',  icon: Star },
    ],
  },
]

export default function Sidebar({ agentName }: { agentName: string }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { resolved, setMode } = useTheme()
  const [avatar, setAvatar] = useState('')
  const [userId, setUserId] = useState('')
  const [open, setOpen]     = useState(false)
  const close = () => setOpen(false)

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      setUserId(session.user.id)
      supabase.from('profiles').select('avatar_url').eq('id', session.user.id).single()
        .then(({ data }) => setAvatar(data?.avatar_url || ''))
    })
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = agentName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="mobile-topbar md:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 border-b border-slate-800 bg-[#0F172A]">
        <button onClick={() => setOpen(true)} className="text-slate-400 hover:text-white p-1 -ml-1 transition" aria-label="Open menu">
          <Menu size={24} />
        </button>
        <img
          src="/logo.png"
          alt="The Carrillo Agency"
          className="h-8 w-auto"
        />
      </div>

      {/* ── Backdrop ── */}
      {open && (
        <div onClick={close} className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity" />
      )}

      {/* ── Sidebar panel ── */}
      <aside className={clsx(
        'sidebar-bg fixed left-0 top-0 bottom-0 w-60 z-50 flex flex-col',
        'border-r border-slate-800/60',
        'transition-transform duration-300 ease-in-out',
        'md:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}>

        {/* Close (mobile) */}
        <button
          onClick={close}
          className="md:hidden absolute top-4 right-4 text-slate-500 hover:text-slate-200 transition z-10"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="px-5 pt-5 pb-4">
          <a href="/dashboard" className="block">
            <img
              src="/logo.png"
              alt="The Carrillo Agency"
              className="h-14 w-auto mx-auto drop-shadow-lg"
            />
          </a>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-slate-800/70" />

        {/* Agent chip + bell */}
        <div className="flex items-center gap-2 mx-3 my-3">
        <a
          href="/settings"
          className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition group"
        >
          {avatar
            ? <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-yellow-500/30" />
            : (
              <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-black font-black text-xs flex-shrink-0">
                {initials}
              </div>
            )
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{agentName}</p>
            <p className="text-[10px] text-slate-500">View profile</p>
          </div>
          <Settings size={13} className="text-slate-600 group-hover:text-yellow-500 transition flex-shrink-0" />
        </a>
        {userId && <NotificationBell userId={userId} />}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-1 space-y-5 overflow-y-auto">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.18em] px-3 mb-1.5">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href
                  return (
                    <a
                      key={href}
                      href={href}
                      className={clsx(
                        'sidebar-item',
                        active && 'active',
                      )}
                    >
                      <Icon size={15} className="flex-shrink-0" />
                      <span className="flex-1">{label}</span>
                      {active && <ChevronRight size={12} className="text-yellow-500/60 flex-shrink-0" />}
                    </a>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom bar */}
        <div className="px-3 pb-4 pt-3 border-t border-slate-800/60 space-y-0.5">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.18em] px-3 mb-1.5">Admin</p>

          <a href="/admin" className={clsx('sidebar-item', pathname === '/admin' && 'active')}>
            <Users size={15} /> Team
          </a>
          <a href="/settings" className={clsx('sidebar-item', pathname === '/settings' && 'active')}>
            <Settings size={15} /> Settings
          </a>
          <button
            onClick={signOut}
            className="sidebar-item w-full text-left hover:text-red-400"
          >
            <LogOut size={15} /> Sign Out
          </button>

          {/* Theme toggle */}
          <div className="flex items-center gap-1 bg-slate-900/80 rounded-full p-1 mt-2 border border-slate-800/60">
            <button
              onClick={() => setMode('light')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[11px] font-semibold transition',
                resolved === 'light' ? 'bg-yellow-500 text-black' : 'text-slate-500 hover:text-slate-300',
              )}
            >
              <Sun size={12} /> Light
            </button>
            <button
              onClick={() => setMode('dark')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-[11px] font-semibold transition',
                resolved === 'dark' ? 'bg-slate-700 text-yellow-400 ring-1 ring-slate-600' : 'text-slate-500 hover:text-slate-300',
              )}
            >
              <Moon size={12} /> Dark
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
