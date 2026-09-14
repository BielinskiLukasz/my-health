import { useState, useEffect } from "react"
import { db } from "@/db/schema"
import { groupByDay } from "@/utils/aggregation"
import { calcBmi, bmiCategory } from "@/utils/bmi"

export interface BmiPoint {
  date: string
  bmi: number
}

export interface BmiResult {
  bmiData: BmiPoint[]
  currentBmi: number | null
  category: "Underweight" | "Normal" | "Overweight" | "Obese" | null
  error: "no-height" | null
}

/**
 * Hook to compute BMI history from all weight entries and height from localStorage.
 * Height guard (T-02-08): if height is not set or <= 0, returns error: 'no-height'.
 * Queries ALL weight entries (no date range) to build full BMI history.
 */
export function useBmiData(): BmiResult {
  const [bmiData, setBmiData] = useState<BmiPoint[]>([])
  const [currentBmi, setCurrentBmi] = useState<number | null>(null)
  const [category, setCategory] = useState<"Underweight" | "Normal" | "Overweight" | "Obese" | null>(null)
  const [error, setError] = useState<"no-height" | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      // T-02-08: Guard against missing, zero, or NaN height before any division
      const heightCm = parseFloat(localStorage.getItem("myhealth-height") ?? "")
      if (!heightCm || heightCm <= 0 || isNaN(heightCm)) {
        if (!cancelled) setError("no-height")
        return
      }

      // Query ALL weight entries (no date range) for full BMI history
      const allWeights = await db.weights.orderBy("date").toArray()

      if (cancelled) return

      // Normalize to { date, value } and group by day (average per day)
      const normalized = allWeights.map((w) => ({ date: w.date, value: w.value }))
      const dailyAvg = groupByDay(normalized, "average")

      // Map each daily average to a BmiPoint
      const result: BmiPoint[] = dailyAvg.map((d) => ({
        date: d.date,
        bmi: calcBmi(d.value, heightCm),
      }))

      if (!cancelled) {
        setBmiData(result)
        // Current BMI is the most recent entry
        if (result.length > 0) {
          const latest = result[result.length - 1].bmi
          setCurrentBmi(latest)
          setCategory(bmiCategory(latest))
        }
        setError(null)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { bmiData, currentBmi, category, error }
}
