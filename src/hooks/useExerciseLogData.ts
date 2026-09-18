import { useState, useEffect, useCallback } from "react"
import { startOfWeek, endOfWeek, subWeeks, format } from "date-fns"
import { db } from "@/db/schema"
import { todayISO } from "@/utils/dateFormat"

// T-03-08: bounded lookback — never a full-table scan.
const WEEK_LOOKBACK = 52

interface ExerciseLogDataResult {
  weekCount: number
  todayLogged: boolean
  toggleToday: () => Promise<void>
  weeklyMetHistory: { met: boolean }[]
  isLoading: boolean
}

function isoWeekBounds(reference: Date): { start: string; end: string } {
  return {
    start: format(startOfWeek(reference, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    end: format(endOfWeek(reference, { weekStartsOn: 1 }), "yyyy-MM-dd"),
  }
}

/**
 * D-01/D-07/D-17: exercise-proxy weekly session count, today's toggle
 * state, and the last 52 weeks' met-target history (for
 * calculateWeeklyStreak). Follows the useEffect+async+cancelled pattern
 * (useChartData.ts).
 */
export function useExerciseLogData(weeklyTarget: number): ExerciseLogDataResult {
  const [weekCount, setWeekCount] = useState(0)
  const [todayLogged, setTodayLogged] = useState(false)
  const [weeklyMetHistory, setWeeklyMetHistory] = useState<{ met: boolean }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(
    async (cancelledRef: { cancelled: boolean }) => {
      setIsLoading(true)
      try {
        const now = new Date()
        const { start, end } = isoWeekBounds(now)

        const [currentWeekEntries, todayEntry] = await Promise.all([
          db.exerciseLog.where("date").between(start, end, true, true).toArray(),
          db.exerciseLog.get(todayISO()),
        ])

        if (cancelledRef.cancelled) return

        const currentWeekCount = currentWeekEntries.filter((e) => e.logged).length
        setWeekCount(currentWeekCount)
        setTodayLogged(todayEntry?.logged ?? false)

        // Most-recent-week-first, bounded to WEEK_LOOKBACK weeks (T-03-08).
        const history: { met: boolean }[] = []
        for (let i = 0; i < WEEK_LOOKBACK; i++) {
          const weekRef = subWeeks(now, i)
          const bounds = isoWeekBounds(weekRef)
          const entries =
            i === 0
              ? currentWeekEntries
              : await db.exerciseLog
                  .where("date")
                  .between(bounds.start, bounds.end, true, true)
                  .toArray()
          const count = entries.filter((e) => e.logged).length
          history.push({ met: count >= weeklyTarget })
        }

        if (!cancelledRef.cancelled) {
          setWeeklyMetHistory(history)
        }
      } finally {
        if (!cancelledRef.cancelled) setIsLoading(false)
      }
    },
    [weeklyTarget]
  )

  useEffect(() => {
    const cancelledRef = { cancelled: false }
    load(cancelledRef)
    return () => {
      cancelledRef.cancelled = true
    }
  }, [load])

  const toggleToday = useCallback(async () => {
    // T-03-07: ALWAYS keys off todayISO() — never the Dashboard's
    // selectable currentDate — preventing a wrong-day write that would
    // corrupt a different day's own logged history.
    const today = todayISO()
    const existing = await db.exerciseLog.get(today)
    const nextLogged = !(existing?.logged ?? false)
    await db.exerciseLog.put({ date: today, logged: nextLogged })
    await load({ cancelled: false })
  }, [load])

  return { weekCount, todayLogged, toggleToday, weeklyMetHistory, isLoading }
}
