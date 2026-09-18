import { useState, useEffect, useCallback } from "react"
import { db, type Target } from "@/db/schema"
import type { MetricType } from "@/store/appStore"
import { inferDirection } from "@/utils/targetCalcs"

interface TargetDataResult {
  target: Target | null
  isLoading: boolean
  saveTarget: (t: { value: number; targetDate?: string }) => Promise<void>
  deleteTarget: () => Promise<void>
}

/**
 * Fetch/save/delete the target for a single metric.
 * Follows useChartData.ts's useEffect+async+cancelled pattern.
 */
export function useTargetData(metric: MetricType | "exercise"): TargetDataResult {
  const [target, setTarget] = useState<Target | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    const row = await db.targets.get(metric)
    return row ?? null
  }, [metric])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const row = await refetch()
        if (!cancelled) setTarget(row)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [refetch])

  const saveTarget = useCallback(
    async (t: { value: number; targetDate?: string }) => {
      let direction: "up" | "down" | undefined
      if (metric === "weight") {
        const mostRecent = await db.weights.orderBy("date").reverse().first()
        if (mostRecent) {
          direction = inferDirection(mostRecent.value, t.value)
        }
      }

      await db.targets.put({
        metric,
        value: t.value,
        targetDate: t.targetDate,
        direction,
        createdAt: new Date().toISOString(),
      })

      const row = await refetch()
      setTarget(row)
    },
    [metric, refetch]
  )

  const deleteTarget = useCallback(async () => {
    await db.targets.delete(metric)
    setTarget(null)
  }, [metric])

  return { target, isLoading, saveTarget, deleteTarget }
}
