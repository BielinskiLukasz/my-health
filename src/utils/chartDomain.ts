import type { MetricType } from "@/store/appStore"

// G-02-5: weight/heartRate/temperature never approach 0, so a 0-start Y-axis
// flattens real trends. steps/sleep/water are counts/durations that legitimately
// start at 0 and must keep their existing (no domain) behavior.
const MIN_MAX_SCALE_METRICS: MetricType[] = ["weight", "heartRate", "temperature"]

// Padding matches each metric's unit from METRIC_CONFIG (src/utils/constants.ts):
// weight in kg, heartRate in bpm, temperature in °C.
const Y_AXIS_PADDING: Partial<Record<MetricType, number>> = {
  weight: 1,
  heartRate: 5,
  temperature: 0.3,
}

/**
 * Returns a Recharts `domain` tuple using the `'dataMin - N'` / `'dataMax + N'`
 * string-formula syntax for metrics whose values never approach 0 (weight,
 * heartRate, temperature). Returns `undefined` for all other metrics so their
 * YAxis keeps the default 0-start behavior unchanged.
 */
export function getYAxisDomain(metric: MetricType): [string, string] | undefined {
  if (!MIN_MAX_SCALE_METRICS.includes(metric)) {
    return undefined
  }
  const padding = Y_AXIS_PADDING[metric]
  return [`dataMin - ${padding}`, `dataMax + ${padding}`]
}
