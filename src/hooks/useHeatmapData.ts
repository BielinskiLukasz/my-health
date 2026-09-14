import { useEffect, useState } from 'react'
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns'
import { db } from '@/db/schema'

export interface HeatmapCell {
  date: string
  count: number
  // Security (T-02-04): metric strings come from hardcoded allowlist, never from raw Dexie field values
  metrics: string[]
}

export function useHeatmapData(): { cellData: HeatmapCell[]; isLoading: boolean } {
  const [cellData, setCellData] = useState<HeatmapCell[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const today = format(new Date(), 'yyyy-MM-dd')
      const start = format(subDays(new Date(), 364), 'yyyy-MM-dd')

      // Query all 6 tables simultaneously (T-02-05: acceptable latency for local IndexedDB)
      const [weights, sleeps, steps, waters, heartRates, temperatures] = await Promise.all([
        db.weights.where('date').between(start, today, true, true).toArray(),
        db.sleepEntries.where('date').between(start, today, true, true).toArray(),
        db.stepEntries.where('date').between(start, today, true, true).toArray(),
        db.waterEntries.where('date').between(start, today, true, true).toArray(),
        db.heartRates.where('date').between(start, today, true, true).toArray(),
        db.temperatures.where('date').between(start, today, true, true).toArray(),
      ])

      // Build Map<date, Set<metric>> — deduplicates multiple entries per day per metric
      const metricsMap = new Map<string, Set<string>>()
      const addMetric = (date: string, metric: string) => {
        if (!metricsMap.has(date)) metricsMap.set(date, new Set())
        metricsMap.get(date)!.add(metric)
      }

      // Hardcoded metric name strings — T-02-04 mitigation: never uses raw Dexie field values
      for (const e of weights) addMetric(e.date, 'weight')
      for (const e of sleeps) addMetric(e.date, 'sleep')
      for (const e of steps) addMetric(e.date, 'steps')
      for (const e of waters) addMetric(e.date, 'water')
      for (const e of heartRates) addMetric(e.date, 'heartRate')
      for (const e of temperatures) addMetric(e.date, 'temperature')

      // Generate all 365 dates — T00:00:00 appended to avoid UTC/local timezone shift (Pitfall 3)
      const allDates = eachDayOfInterval({
        start: parseISO(start + 'T00:00:00'),
        end: parseISO(today + 'T00:00:00'),
      })

      const cells: HeatmapCell[] = allDates.map((d) => {
        const dateStr = format(d, 'yyyy-MM-dd')
        const metricsSet = metricsMap.get(dateStr)
        const metricsArr = metricsSet ? Array.from(metricsSet) : []
        return {
          date: dateStr,
          count: metricsArr.length,
          metrics: metricsArr,
        }
      })

      if (!cancelled) {
        setCellData(cells)
        setIsLoading(false)
      }
    }

    load().catch(() => {
      if (!cancelled) setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { cellData, isLoading }
}
