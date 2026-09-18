import { useState, useEffect, useCallback, useRef } from "react"
import { differenceInMinutes, parseISO } from "date-fns"
import { db } from "@/db/schema"
import type { MetricType } from "@/store/appStore"
import { todayISO } from "@/utils/dateFormat"
import { detectPersonalBest, isNewPersonalBest, PB_METRICS } from "@/utils/personalBest"

type PbEligibleMetric = "weight" | "sleep" | "steps" | "water" | "heartRate"

interface PersonalBestResult {
  isTodayPersonalBest: (value: number) => boolean
  isLoading: boolean
}

/**
 * Read-only fetch of ALL historical entries for a metric, normalized to
 * {date, value}[] — same per-metric Dexie access pattern as
 * useChartData.ts's fetchNormalizedRange switch, but unbounded (full
 * history) for the D-22 retroactive scan. Never writes to these tables.
 */
async function fetchAllEntries(
  metric: PbEligibleMetric
): Promise<{ date: string; value: number }[]> {
  switch (metric) {
    case "weight": {
      const entries = await db.weights.toArray()
      return entries.map((e) => ({ date: e.date, value: e.value }))
    }
    case "sleep": {
      const entries = await db.sleepEntries.toArray()
      return entries.map((e) => {
        const mins =
          e.duration != null
            ? e.duration
            : differenceInMinutes(parseISO(e.wakeTime), parseISO(e.beddingTime))
        return { date: e.date, value: Math.abs(mins) / 60 }
      })
    }
    case "steps": {
      const entries = await db.stepEntries.toArray()
      return entries.map((e) => ({ date: e.date, value: e.steps }))
    }
    case "water": {
      const entries = await db.waterEntries.toArray()
      return entries.map((e) => ({ date: e.date, value: e.ml }))
    }
    case "heartRate": {
      const entries = await db.heartRates.toArray()
      return entries.map((e) => ({ date: e.date, value: e.bpm }))
    }
  }
}

function isPbEligible(metric: MetricType): metric is PbEligibleMetric {
  return metric !== "temperature"
}

/**
 * D-20–D-22: detect and cache personal bests for a metric, target-independent.
 * On mount, checks db.personalBests for a cached best per direction; if
 * absent, runs a one-time retroactive scan over the metric's own table
 * (read-only — T-03-05) and caches the result. Temperature is excluded
 * (D-21) and returns a no-op immediately.
 */
export function usePersonalBestData(metric: MetricType): PersonalBestResult {
  const eligible = isPbEligible(metric)
  const [cachedBests, setCachedBests] = useState<{ direction: "max" | "min"; value: number }[]>([])
  const [isLoading, setIsLoading] = useState(eligible)

  useEffect(() => {
    if (!eligible) return
    // Narrow once for the effect body — `eligible` already excludes
    // "temperature", so this cast reflects a runtime-proven invariant.
    const pbMetric = metric as PbEligibleMetric

    let cancelled = false
    const directions = PB_METRICS.filter((m) => m.metric === pbMetric).map((m) => m.direction)

    async function load() {
      setIsLoading(true)
      try {
        const results: { direction: "max" | "min"; value: number }[] = []
        for (const direction of directions) {
          const cached = await db.personalBests
            .where("metric")
            .equals(pbMetric)
            .and((row) => row.direction === direction)
            .first()

          if (cached) {
            results.push({ direction, value: cached.value })
            continue
          }

          // D-22: retroactive scan, once per metric — read-only over the
          // metric's own table (T-03-05); only ever writes to personalBests.
          const entries = await fetchAllEntries(pbMetric)
          const best = detectPersonalBest(entries, direction)
          if (best) {
            await db.personalBests.put({
              metric: pbMetric,
              direction,
              value: best.value,
              date: best.date,
            })
            results.push({ direction, value: best.value })
          }
        }
        if (!cancelled) setCachedBests(results)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [metric, eligible])

  // Guards the forward-detection cache bump below against duplicate Dexie
  // writes across re-renders within the same session (React may invoke
  // isTodayPersonalBest many times per render with the same value).
  const bumpedRef = useRef<Set<string>>(new Set())

  const isTodayPersonalBest = useCallback(
    (value: number) => {
      if (!eligible) return false
      const pbMetric = metric as PbEligibleMetric
      let matched = false

      for (const cb of cachedBests) {
        if (!isNewPersonalBest(value, cb.value, cb.direction)) continue
        matched = true

        // D-22 "continues detecting new PBs going forward": once a
        // genuine new PB is found, bump the cache so a later call with the
        // SAME value ties (and correctly stops re-triggering the badge)
        // rather than staying stale and re-matching forever.
        const key = `${pbMetric}:${cb.direction}:${value}`
        if (!bumpedRef.current.has(key)) {
          bumpedRef.current.add(key)
          const date = todayISO()
          void db.personalBests.put({ metric: pbMetric, direction: cb.direction, value, date })
          setCachedBests((prev) =>
            prev.map((p) => (p.direction === cb.direction ? { ...p, value } : p))
          )
        }
      }

      return matched
    },
    [eligible, cachedBests, metric]
  )

  if (!eligible) {
    return { isTodayPersonalBest: () => false, isLoading: false }
  }

  return { isTodayPersonalBest, isLoading }
}
