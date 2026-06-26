// Local calendar date as YYYY-MM-DD — based on the user's own clock, NOT UTC.
// Using toISOString() was bucketing evening activity onto the wrong day.
export function localDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
