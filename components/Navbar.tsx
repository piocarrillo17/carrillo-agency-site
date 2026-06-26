'use client'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LayoutDashboard, Trophy, PlusCircle, LogOut, FileText, Users, Sun, Moon } from 'lucide-react'
import clsx from 'clsx'
import { useTheme } from '@/components/ThemeProvider'

export default function Navbar({ agentName }: { agentName: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const { resolved, setMode } = useTheme()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/leads', label: 'Leads', icon: Users },
    { href: '/policies', label: 'Policies', icon: FileText },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/entry', label: 'Log Numbers', icon: PlusCircle },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 app-bg">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <a href="/dashboard">
            <img src={resolved === 'light' ? '/logo-light.png' : '/logo.png'} alt="The Carrillo Agency" className="h-24 w-auto" />
          </a>
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition',
                  pathname === href
                    ? 'bg-yellow-500/10 text-yellow-500'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon size={16} />
                {label}
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}
            className="text-gray-400 hover:text-yellow-500 transition"
            title={resolved === 'dark' ? 'Switch to light' : 'Switch to dark'}
          >
            {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <span className="text-sm text-gray-400 hidden sm:block">{agentName}</span>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm"
          >
            <LogOut size={16} />
            <span className="hidden sm:block">Sign Out</span>
          </button>
        </div>
      </div>
      {/* Mobile nav */}
      <div className="md:hidden flex border-t border-gray-800">
        {links.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className={clsx(
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition',
              pathname === href ? 'text-yellow-500' : 'text-gray-500'
            )}
          >
            <Icon size={18} />
            {label}
          </a>
        ))}
      </div>
    </nav>
  )
}
