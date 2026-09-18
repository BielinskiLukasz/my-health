import { describe, it, expect } from "vitest"
import { detectPersonalBest, isNewPersonalBest, PB_METRICS } from "./personalBest"

describe("detectPersonalBest", () => {
  it("returns null for an empty array", () => {
    expect(detectPersonalBest([], "max")).toBeNull()
  })

  it("picks the correct max across a mixed-value series", () => {
    const entries = [
      { date: "2026-01-01", value: 10 },
      { date: "2026-01-02", value: 30 },
      { date: "2026-01-03", value: 20 },
    ]
    expect(detectPersonalBest(entries, "max")).toEqual({ value: 30, date: "2026-01-02" })
  })

  it("picks the correct min across a mixed-value series", () => {
    const entries = [
      { date: "2026-01-01", value: 70 },
      { date: "2026-01-02", value: 65 },
      { date: "2026-01-03", value: 68 },
    ]
    expect(detectPersonalBest(entries, "min")).toEqual({ value: 65, date: "2026-01-02" })
  })

  it("resolves an exact-value tie by picking the earlier date deterministically", () => {
    const entries = [
      { date: "2026-01-05", value: 50 },
      { date: "2026-01-01", value: 50 },
      { date: "2026-01-03", value: 50 },
    ]
    expect(detectPersonalBest(entries, "max")).toEqual({ value: 50, date: "2026-01-01" })
  })

  it("never mutates its input array (read-only scan)", () => {
    const entries = [
      { date: "2026-01-01", value: 10 },
      { date: "2026-01-02", value: 30 },
    ]
    const snapshot = JSON.parse(JSON.stringify(entries))
    detectPersonalBest(entries, "max")
    expect(entries).toEqual(snapshot)
  })
})

describe("isNewPersonalBest", () => {
  it("returns true when cachedBest is undefined (first-ever entry)", () => {
    expect(isNewPersonalBest(70, undefined, "max")).toBe(true)
  })

  it("returns true on strict improvement for direction=max", () => {
    expect(isNewPersonalBest(31, 30, "max")).toBe(true)
  })

  it("returns false on an exact tie for direction=max (does not re-trigger badge)", () => {
    expect(isNewPersonalBest(30, 30, "max")).toBe(false)
  })

  it("returns false when todayValue is below cachedBest for direction=max", () => {
    expect(isNewPersonalBest(29, 30, "max")).toBe(false)
  })

  it("returns true on strict improvement for direction=min", () => {
    expect(isNewPersonalBest(59, 60, "min")).toBe(true)
  })

  it("returns false on an exact tie for direction=min", () => {
    expect(isNewPersonalBest(60, 60, "min")).toBe(false)
  })

  it("returns false when todayValue is above cachedBest for direction=min", () => {
    expect(isNewPersonalBest(61, 60, "min")).toBe(false)
  })
})

describe("PB_METRICS", () => {
  it("contains exactly 6 entries", () => {
    expect(PB_METRICS).toHaveLength(6)
  })

  it("includes weight twice — once for max, once for min (D-21)", () => {
    const weightEntries = PB_METRICS.filter((m) => m.metric === "weight")
    expect(weightEntries).toHaveLength(2)
    expect(weightEntries.map((m) => m.direction).sort()).toEqual(["max", "min"])
  })

  it("includes sleep/max, steps/max, water/max, heartRate/min", () => {
    expect(PB_METRICS).toEqual(
      expect.arrayContaining([
        { metric: "sleep", direction: "max" },
        { metric: "steps", direction: "max" },
        { metric: "water", direction: "max" },
        { metric: "heartRate", direction: "min" },
      ])
    )
  })

  it("never contains a temperature entry (D-21 exclusion)", () => {
    expect(PB_METRICS.some((m) => (m.metric as string) === "temperature")).toBe(false)
  })
})
