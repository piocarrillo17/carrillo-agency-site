'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type ThemeMode = 'light' | 'dark' | 'auto'
type ThemeCtx = { mode: ThemeMode; resolved: 'light' | 'dark'; setMode: (m: ThemeMode) => void }

const Ctx = createContext<ThemeCtx>({ mode: 'auto', resolved: 'dark', setMode: () => {} })
export const useTheme = () => useContext(Ctx)

// Daytime = light (7am–7pm), nighttime = dark
function autoResolve(): 'light' | 'dark' {
  const h = new Date().getHours()
  return h >= 7 && h < 19 ? 'light' : 'dark'
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('auto')
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark')

  function apply(m: ThemeMode) {
    const r = m === 'auto' ? autoResolve() : m
    setResolved(r)
    document.documentElement.setAttribute('data-theme', r)
  }

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as ThemeMode) || 'auto'
    setModeState(saved)
    apply(saved)
    // Re-check every 10 min when on auto, so it flips at sunset
    const interval = setInterval(() => {
      if ((localStorage.getItem('theme') || 'auto') === 'auto') apply('auto')
    }, 600000)
    return () => clearInterval(interval)
  }, [])

  function setMode(m: ThemeMode) {
    setModeState(m)
    localStorage.setItem('theme', m)
    apply(m)
  }

  return <Ctx.Provider value={{ mode, resolved, setMode }}>{children}</Ctx.Provider>
}
