import { useState, useEffect } from "react"
import { format, subDays, differenceInMinutes, parseISO } from "date-fns"
import { db, type Target } from "@/db/schema"
import { calculateStreak, meetsTargetForDay } from "@/utils/targetCalcs"

export type StreakEligibleMetric = "weight" | "sleep" | "steps" | "water" | "heartRate"

interface StreakResult {
  streak: number
  isLoading: boolean
}

// T-03-06: hard bound on the backward walk to prevent a runaway loop on
// malformed/gapped history (RESEARCH Example 3).
const MAX_LOOKBACK_DAYS = 365

/**
 * Fetch a single day's raw value for a metric — same per-metric Dexie
 * access pattern as useChartData.ts's fetchNormalizedRange switch, but for
 * one date at a time (the streak walk-back needs day-by-day granularity).
 */
async function fetchDayValue(
  metric: StreakEligibleMetric,
  date: string
): Promise<number | undefined> {
  switch (metric) {
    case "weight": {
      const entries = await db.weights.where("date").equals(date).toArray()
      if (entries.length === 0) return undefined
      return entries.reduce((sum, e) => sum + e.value, 0) / entries.length
    }
    case "sleep": {
      const entry = await db.sleepEntries.get(date)
      if (!entry) return undefined
      const mins =
        entry.duration != null
          ? entry.duration
          : differenceInMinutes(parseISO(entry.wakeTime), parseISO(entry.beddingTime))
      return Math.abs(mins) / 60
    }
    case "steps": {
      const entry = await db.stepEntries.get(date)
      return entry?.steps
    }
    case "water": {
      const entry = await db.waterEntries.get(date)
      return entry?.ml
    }
    case "heartRate": {
      const entries = await db.heartRates.where("date").equals(date).toArray()
      if (entries.length === 0) return undefined
      return entries.reduce((sum, e) => sum + e.bpm, 0) / entries.length
    }
  }
}

/**
 * D-14–D-19: per-metric consecutive-day streak, walked backward from today.
 * Follows the useEffect+async+cancelled pattern (useChartData.ts).
 */
export function useStreakData(
  metric: StreakEligibleMetric,
  target: Target | null
): StreakResult {
  const [streak, setStreak] = useState(0)
  const [isLoading, setIsLoading] = useState(target != null)

  useEffect(() => {
    // D-05: no target set -> streak is always 0; no Dexie call performed.
    if (!target) {
      setStreak(0)
      setIsLoading(false)
      return
    }
    // Narrow once for the async closure below — function declarations
    // don't retain the `if (!target)` guard's narrowing across boundaries.
    const activeTarget: Target = target

    let cancelled = false

    async function calculate() {
      setIsLoading(true)
      try {
        const today = format(new Date(), "yyyy-MM-dd")

        // Pass 1: walk backward day by day (most-recent-first), collecting
        // raw values only, bounded to MAX_LOOKBACK_DAYS.
        const rawDays: { hasEntry: boolean; value?: number }[] = []
        let cursor = today
        for (let i = 0; i < MAX_LOOKBACK_DAYS; i++) {
          const value = await fetchDayValue(metric, cursor)
          rawDays.push({ hasEntry: value !== undefined, value })
          cursor = format(subDays(new Date(cursor), 1), "yyyy-MM-dd")
        }

        if (cancelled) return

        // Pass 2: compute metQualifies per day. For weight, previousValue
        // is the nearest EARLIER logged value — i.e. the closest later
        // index in this most-recent-first array that has an entry (not
        // necessarily yesterday, per the plan's D-15 note).
        const days = rawDays.map((day, i) => {
          if (!day.hasEntry || day.value === undefined) {
            return { hasEntry: false, metQualifies: false }
          }
          let previousValue: number | undefined
          if (metric === "weight") {
            for (let j = i + 1; j < rawDays.length; j++) {
              if (rawDays[j].hasEntry && rawDays[j].value !== undefined) {
                previousValue = rawDays[j].value
                break
              }
            }
          }
          const metQualifies = meetsTargetForDay(metric, day.value, activeTarget, previousValue)
          return { hasEntry: true, metQualifies }
        })

        if (!cancelled) {
          setStreak(calculateStreak(days))
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    calculate()
    return () => {
      cancelled = true
    }
  }, [metric, target])

  return { streak, isLoading }
}
