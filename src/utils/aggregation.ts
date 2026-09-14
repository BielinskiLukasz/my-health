import { format } from "date-fns"

export interface DailyPoint {
  date: string
  value: number
}

/**
 * Groups entries by date and computes either average or sum per day.
 * Input entries must have { date: string (YYYY-MM-DD); value: number }.
 * Returns sorted ascending by date string.
 */
export function groupByDay(
  entries: { date: string; value: number }[],
  mode: "average" | "sum"
): DailyPoint[] {
  if (entries.length === 0) return []

  const byDate = new Map<string, number[]>()
  for (const e of entries) {
    const arr = byDate.get(e.date) ?? []
    arr.push(e.value)
    byDate.set(e.date, arr)
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date,
      value:
        mode === "sum"
          ? vals.reduce((s, v) => s + v, 0)
          : vals.reduce((s, v) => s + v, 0) / vals.length,
    }))
}

/**
 * Groups daily points into monthly buckets and computes average or sum.
 * Input: DailyPoint[] with YYYY-MM-DD dates.
 * Output: DailyPoint[] with YYYY-MM dates, sorted ascending.
 * Uses 'T00:00:00' suffix to prevent timezone shift (Pitfall 3 from RESEARCH.md).
 */
export function aggregateMonthly(
  daily: DailyPoint[],
  mode: "average" | "sum"
): DailyPoint[] {
  if (daily.length === 0) return []

  const byMonth = new Map<string, number[]>()
  for (const d of daily) {
    // Append T00:00:00 to force local midnight, preventing UTC-offset timezone shift
    const monthKey = format(new Date(d.date + "T00:00:00"), "yyyy-MM")
    const arr = byMonth.get(monthKey) ?? []
    arr.push(d.value)
    byMonth.set(monthKey, arr)
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, vals]) => ({
      date: month,
      value:
        mode === "sum"
          ? vals.reduce((s, v) => s + v, 0)
          : vals.reduce((s, v) => s + v, 0) / vals.length,
    }))
}
