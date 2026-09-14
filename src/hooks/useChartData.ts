import { useState, useEffect } from "react"
import { format, subDays, differenceInMinutes, parseISO } from "date-fns"
import { db } from "@/db/schema"
import type { MetricType } from "@/store/appStore"
import { groupByDay, aggregateMonthly, type DailyPoint } from "@/utils/aggregation"

const DAYS_BY_PERIOD: Record<"W" | "M" | "Y", number> = {
  W: 7,
  M: 30,
  Y: 365,
}

// Aggregation mode per metric: steps and water use sum, others use average
function modeForMetric(metric: MetricType): "average" | "sum" {
  return metric === "steps" || metric === "water" ? "sum" : "average"
}

/**
 * Fetch and normalize a date range from the correct Dexie table.
 * Returns { date: string; value: number }[] where value is already in display units.
 * Sleep: value is decimal hours (minutes / 60) per Pitfall 4.
 */
async function fetchNormalizedRange(
  metric: MetricType,
  start: string,
  end: string
): Promise<{ date: string; value: number }[]> {
  switch (metric) {
    case "weight": {
      const entries = await db.weights
        .where("date")
        .between(start, end, true, true)
        .toArray()
      return entries.map((e) => ({ date: e.date, value: e.value }))
    }
    case "sleep": {
      const entries = await db.sleepEntries
        .where("date")
        .between(start, end, true, true)
        .toArray()
      return entries.map((e) => {
        const mins =
          e.duration != null
            ? e.duration
            : differenceInMinutes(parseISO(e.wakeTime), parseISO(e.beddingTime))
        // Convert minutes to decimal hours (Pitfall 4)
        return { date: e.date, value: Math.abs(mins) / 60 }
      })
    }
    case "steps": {
      const entries = await db.stepEntries
        .where("date")
        .between(start, end, true, true)
        .toArray()
      return entries.map((e) => ({ date: e.date, value: e.steps }))
    }
    case "water": {
      const entries = await db.waterEntries
        .where("date")
        .between(start, end, true, true)
        .toArray()
      return entries.map((e) => ({ date: e.date, value: e.ml }))
    }
    case "heartRate": {
      const entries = await db.heartRates
        .where("date")
        .between(start, end, true, true)
        .toArray()
      return entries.map((e) => ({ date: e.date, value: e.bpm }))
    }
    case "temperature": {
      const entries = await db.temperatures
        .where("date")
        .between(start, end, true, true)
        .toArray()
      return entries.map((e) => ({ date: e.date, value: e.celsius }))
    }
  }
}

interface ChartDataResult {
  data: DailyPoint[]
  prevData: DailyPoint[]
  isLoading: boolean
}

/**
 * Hook to fetch and aggregate chart data for a given metric and period.
 * Returns current period data, previous period data (for trend arrow), and loading state.
 * Uses useEffect + async + cancelled flag pattern (same as MetricTile.tsx).
 */
export function useChartData(
  metric: MetricType,
  period: "W" | "M" | "Y"
): ChartDataResult {
  const [data, setData] = useState<DailyPoint[]>([])
  const [prevData, setPrevData] = useState<DailyPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const today = format(new Date(), "yyyy-MM-dd")
        const daysBack = DAYS_BY_PERIOD[period]

        // Current period: last N days
        const start = format(subDays(new Date(), daysBack), "yyyy-MM-dd")
        // Previous period: the N days before current (for trend arrow comparison)
        const prevStart = format(subDays(new Date(), daysBack * 2), "yyyy-MM-dd")

        const [rawCurrent, rawPrev] = await Promise.all([
          fetchNormalizedRange(metric, start, today),
          fetchNormalizedRange(metric, prevStart, start),
        ])

        if (cancelled) return

        const mode = modeForMetric(metric)

        // Group by day → optionally aggregate by month for Y period
        let currentDaily = groupByDay(rawCurrent, mode)
        let prevDaily = groupByDay(rawPrev, mode)

        if (period === "Y") {
          currentDaily = aggregateMonthly(currentDaily, mode)
          prevDaily = aggregateMonthly(prevDaily, mode)
        }

        if (!cancelled) {
          setData(currentDaily)
          setPrevData(prevDaily)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [metric, period])

  return { data, prevData, isLoading }
}
