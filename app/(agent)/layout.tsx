'use client'
import ThemeProvider from '@/components/ThemeProvider'
import ToastProvider from '@/components/Toast'

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>
      <ThemeProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </div>
  )
}
