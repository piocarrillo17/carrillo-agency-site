// Achievement / badge system for The Carrillo Agency.
// Badges are earned once and stored in the `achievements` table (see migration).

export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum'

export type BadgeDef = {
  key: string
  label: string
  emoji: string
  tier: Tier
  desc: string
}

export type AgentStats = {
  issuedPolicies: number
  bestWeekAP: number
  bestMonthAP: number
  maxDailyDials: number
  maxWeeklyDials: number
}

// Visual style per tier (used by the toast + profile badge grid)
export const TIER_STYLE: Record<Tier, { ring: string; bg: string; text: string; label: string }> = {
  bronze:   { ring: 'ring-amber-700/60',  bg: 'bg-amber-900/30',  text: 'text-amber-300',  label: 'Bronze' },
  silver:   { ring: 'ring-gray-400/60',   bg: 'bg-gray-500/20',   text: 'text-gray-200',   label: 'Silver' },
  gold:     { ring: 'ring-yellow-500/70', bg: 'bg-yellow-500/15', text: 'text-yellow-300', label: 'Gold' },
  platinum: { ring: 'ring-cyan-300/70',   bg: 'bg-cyan-400/15',   text: 'text-cyan-200',   label: 'Platinum' },
}

export const BADGES: BadgeDef[] = [
  // Sales milestones
  { key: 'first_sale',   label: 'First Sale',   emoji: '🎉', tier: 'bronze',   desc: 'Closed your first policy' },
  { key: 'policies_10',  label: '10 Policies',  emoji: '📜', tier: 'silver',   desc: 'Issued 10 policies' },
  { key: 'policies_25',  label: '25 Policies',  emoji: '🏅', tier: 'gold',     desc: 'Issued 25 policies' },
  { key: 'policies_50',  label: '50 Policies',  emoji: '🏆', tier: 'gold',     desc: 'Issued 50 policies' },
  { key: 'policies_100', label: '100 Policies', emoji: '👑', tier: 'platinum', desc: 'Issued 100 policies' },
  // Weekly AP
  { key: 'week_5k',  label: '5k Week',  emoji: '💵', tier: 'bronze',   desc: '$5,000 AP in a single week' },
  { key: 'week_10k', label: '10k Week', emoji: '💰', tier: 'silver',   desc: '$10,000 AP in a single week' },
  { key: 'week_15k', label: '15k Week', emoji: '💸', tier: 'gold',     desc: '$15,000 AP in a single week' },
  { key: 'week_20k', label: '20k Week', emoji: '🤑', tier: 'gold',     desc: '$20,000 AP in a single week' },
  { key: 'week_25k', label: '25k Week', emoji: '🚀', tier: 'platinum', desc: '$25,000 AP in a single week' },
  // Monthly AP
  { key: 'month_25k',  label: '25k Month',  emoji: '📈', tier: 'silver',   desc: '$25,000 AP in a single month' },
  { key: 'month_50k',  label: '50k Month',  emoji: '📊', tier: 'gold',     desc: '$50,000 AP in a single month' },
  { key: 'month_100k', label: '100k Month', emoji: '💎', tier: 'platinum', desc: '$100,000 AP in a single month' },
  // Activity / grind
  { key: 'grind_50_day',   label: 'The Grind',  emoji: '☎️', tier: 'bronze',   desc: '50 dials in a single day' },
  { key: 'dials_250_week', label: '250 Dials',  emoji: '📞', tier: 'silver',   desc: '250 dials in a single week' },
  { key: 'dials_500_week', label: '500 Dials',  emoji: '📞', tier: 'gold',     desc: '500 dials in a single week' },
  { key: 'dials_1000_week',label: '1k Dials',   emoji: '🔥', tier: 'platinum', desc: '1,000 dials in a single week' },
]

export const BADGE_MAP: Record<string, BadgeDef> = Object.fromEntries(BADGES.map(b => [b.key, b]))

// Given current stats, return the set of badge keys the agent qualifies for.
export function earnedBadgeKeys(s: AgentStats): string[] {
  const k: string[] = []
  if (s.issuedPolicies >= 1) k.push('first_sale')
  if (s.issuedPolicies >= 10) k.push('policies_10')
  if (s.issuedPolicies >= 25) k.push('policies_25')
  if (s.issuedPolicies >= 50) k.push('policies_50')
  if (s.issuedPolicies >= 100) k.push('policies_100')
  if (s.bestWeekAP >= 5000) k.push('week_5k')
  if (s.bestWeekAP >= 10000) k.push('week_10k')
  if (s.bestWeekAP >= 15000) k.push('week_15k')
  if (s.bestWeekAP >= 20000) k.push('week_20k')
  if (s.bestWeekAP >= 25000) k.push('week_25k')
  if (s.bestMonthAP >= 25000) k.push('month_25k')
  if (s.bestMonthAP >= 50000) k.push('month_50k')
  if (s.bestMonthAP >= 100000) k.push('month_100k')
  if (s.maxDailyDials >= 50) k.push('grind_50_day')
  if (s.maxWeeklyDials >= 250) k.push('dials_250_week')
  if (s.maxWeeklyDials >= 500) k.push('dials_500_week')
  if (s.maxWeeklyDials >= 1000) k.push('dials_1000_week')
  return k
}

// ISO week key like "2026-W23" for grouping by week
export function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
