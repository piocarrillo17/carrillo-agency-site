import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Updates profiles.last_seen for the current user every INTERVAL_MS.
// Call this hook once in any page that should count as "active."
const INTERVAL_MS = 60_000 // every 60 seconds

export function usePresence(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return

    async function ping() {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId!)
    }

    ping() // ping immediately on mount
    const t = setInterval(ping, INTERVAL_MS)
    return () => clearInterval(t)
  }, [userId])
}

// Returns a human-readable label for a last_seen timestamp
export function presenceLabel(lastSeen: string | null): { label: string; online: boolean } {
  if (!lastSeen) return { label: 'Never', online: false }
  const mins = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60000)
  if (mins < 2)  return { label: 'Online now', online: true }
  if (mins < 5)  return { label: `${mins}m ago`, online: true }
  if (mins < 60) return { label: `${mins}m ago`, online: false }
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return { label: `${hrs}h ago`, online: false }
  const days = Math.floor(hrs / 24)
  return { label: `${days}d ago`, online: false }
}
