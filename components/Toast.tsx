'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'
type Toast = { id: number; msg: string; kind: ToastKind }
type Ctx = { toast: (msg: string, kind?: ToastKind) => void }

const ToastCtx = createContext<Ctx>({ toast: () => {} })
export const useToast = () => useContext(ToastCtx)

const ICON = { success: CheckCircle, error: AlertCircle, info: Info }
const COLOR = {
  success: 'border-green-600 text-green-400',
  error: 'border-red-600 text-red-400',
  info: 'border-yellow-600 text-yellow-400',
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((msg: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg, kind }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[90vw]">
        {toasts.map(t => {
          const Icon = ICON[t.kind]
          return (
            <div key={t.id}
              className={`card border-l-4 ${COLOR[t.kind]} px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3 animate-[slideIn_0.2s_ease-out]`}>
              <Icon size={18} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm text-white flex-1">{t.msg}</p>
              <button onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))} className="text-gray-500 hover:text-white flex-shrink-0"><X size={15} /></button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}
