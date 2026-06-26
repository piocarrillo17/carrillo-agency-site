import { createClient } from '@supabase/supabase-js'

// supabase-js defaults to the browser Web Locks API to serialize auth calls.
// If a tab/PWA crashes mid-operation, that exclusive lock is never released and
// EVERY later getSession()/signInWithPassword() blocks forever — an infinite
// "Loading…". We replace it with an in-process promise-chain lock: it still
// serializes auth calls within this tab but can never deadlock across tabs.
const memLocks: Record<string, Promise<unknown>> = {}
async function inProcessLock<R>(name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
  const prev = memLocks[name] || Promise.resolve()
  let release!: () => void
  const next = new Promise<void>(r => { release = r })
  memLocks[name] = prev.then(() => next)
  try { await prev } catch { /* ignore prior errors */ }
  try { return await fn() } finally { release() }
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      lock: inProcessLock,
    },
  }
)

export type Entry = {
  id: string
  agent_id: string
  agent_name: string
  year: number
  month: number
  apps_written: number
  submitted_ap: number
  approved_ap: number
  issued_ap: number
  advance_pay: number
  mo_expenses: number
  mo_net: number
  deposits: number
  adv_owed: number
  dials: number
  hours_talked: number
  earned: number
  chargebacks: number
  policies: number
  created_at: string
}
