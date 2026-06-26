import { createBrowserClient } from '@supabase/ssr'

// Use @supabase/ssr's browser client so the session is stored in cookies,
// which allows the middleware to read it server-side for auth protection.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
