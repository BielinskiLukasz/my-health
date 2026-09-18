/**
 * Pure pace-projection and on-track status math for Phase 3 targets.
 * No side effects, no Dexie access — mirrors bmi.ts's pure-function style.
 */
import { differenceInDays, parseISO } from "date-fns"

export type OnTrackStatus = "green" | "yellow" | "red" | "grey"

// UI-SPEC "On-Track Status Colors" table — per-metric absolute tolerance
// for the projected-vs-target gap.
export const TOLERANCES: Record<
  "weight" | "sleep" | "steps" | "water" | "heartRate",
  number
> = {
  weight: 0.5,
  sleep: 0.5,
  steps: 500,
  water: 200,
  heartRate: 3,
}

// Sleep is a range target ("around X hours") — D-04/D-12. This is the
// fixed acceptable half-width around the target value, not a user-editable
// range picker (Claude's discretion per D-04's Anti-Pattern note).
const SLEEP_RANGE_HALF_WIDTH = 1.0

/**
 * Fit a simple least-squares line over day-index x-values (0..n-1).
 * Returns null when fewer than 2 points exist or the data has zero
 * variance in x (constant denominator guard — Pitfall 6).
 */
export function fitLinearTrend(
  data: { date: string; value: number }[]
): { slope: number; intercept: number } | null {
  if (data.length < 2) return null

  const n = data.length
  const xValues = Array.from({ length: n }, (_, i) => i)
  const yValues = data.map((d) => d.value)

  const xMean = xValues.reduce((a, b) => a + b, 0) / n
  const yMean = yValues.reduce((a, b) => a + b, 0) / n

  const numerator = xValues.reduce(
    (sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean),
    0
  )
  const denominator = xValues.reduce((sum, x) => sum + (x - xMean) ** 2, 0)

  if (denominator === 0) return null

  const slope = numerator / denominator
  const intercept = yMean - slope * xMean

  // Zero-slope (identical-value) data has no discernible trend to project —
  // degrade to null rather than a flat-line extrapolation (Pitfall 6).
  if (slope === 0) return null

  return { slope, intercept }
}

/**
 * Extrapolate a fitted trend to the day-offset of targetDate relative to
 * startDate (day 0 of the trend's x-axis).
 */
export function projectPace(
  trend: { slope: number; intercept: number },
  startDate: string,
  targetDate: string
): number {
  const daysUntilTarget = differenceInDays(
    parseISO(targetDate),
    parseISO(startDate)
  )
  return trend.slope * daysUntilTarget + trend.intercept
}

/**
 * D-02: weight target direction is inferred by comparing target to current
 * value, not fixed to loss-only.
 */
export function inferDirection(
  currentValue: number,
  targetValue: number
): "up" | "down" {
  return targetValue < currentValue ? "down" : "up"
}

/**
 * D-10/D-11/D-12: compute the red/yellow/green/grey on-track status for a
 * projected value against a target.
 * - grey: fewer than 7 days of logged entries in the trailing window (D-11).
 * - sleep: range target — gap is distance outside [value-1, value+1] (D-12).
 * - heartRate: ceiling target — gap = max(0, projected - value) (D-03).
 * - weight: direction picks ceiling ("down") vs floor ("up") semantics (D-02).
 * - steps/water: floor targets — gap = max(0, value - projected).
 */
export function getOnTrackStatus(
  projectedValue: number,
  target: { value: number; direction?: "up" | "down" },
  metric: "weight" | "sleep" | "steps" | "water" | "heartRate",
  dataPointCount: number
): OnTrackStatus {
  if (dataPointCount < 7) return "grey"

  const tolerance = TOLERANCES[metric]
  let gap: number

  if (metric === "sleep") {
    const lower = target.value - SLEEP_RANGE_HALF_WIDTH
    const upper = target.value + SLEEP_RANGE_HALF_WIDTH
    if (projectedValue >= lower && projectedValue <= upper) {
      gap = 0
    } else {
      gap = Math.min(
        Math.abs(projectedValue - lower),
        Math.abs(projectedValue - upper)
      )
    }
  } else if (metric === "heartRate") {
    gap = Math.max(0, projectedValue - target.value)
  } else if (metric === "weight") {
    gap =
      target.direction === "down"
        ? Math.max(0, projectedValue - target.value)
        : Math.max(0, target.value - projectedValue)
  } else {
    // steps, water — floor targets
    gap = Math.max(0, target.value - projectedValue)
  }

  if (gap <= tolerance) return "green"
  if (gap <= tolerance * 2) return "yellow"
  return "red"
}
