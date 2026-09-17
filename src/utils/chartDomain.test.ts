import { describe, it, expect } from "vitest"
import { getYAxisDomain, getBmiYAxisDomain } from "./chartDomain"

describe("getYAxisDomain", () => {
  it("returns a padded dataMin/dataMax domain for weight", () => {
    expect(getYAxisDomain("weight")).toEqual(["dataMin - 1", "dataMax + 1"])
  })

  it("returns a padded dataMin/dataMax domain for heartRate", () => {
    expect(getYAxisDomain("heartRate")).toEqual(["dataMin - 5", "dataMax + 5"])
  })

  it("returns a padded dataMin/dataMax domain for temperature", () => {
    expect(getYAxisDomain("temperature")).toEqual(["dataMin - 0.3", "dataMax + 0.3"])
  })

  it("returns undefined for steps, sleep, and water (unchanged 0-start behavior)", () => {
    expect(getYAxisDomain("steps")).toBeUndefined()
    expect(getYAxisDomain("sleep")).toBeUndefined()
    expect(getYAxisDomain("water")).toBeUndefined()
  })
})

describe("getBmiYAxisDomain", () => {
  it("clamps to [18.5, 25] when data is entirely inside the healthy band", () => {
    expect(getBmiYAxisDomain([20, 22])).toEqual([18.5, 25])
  })

  it("expands the lower bound below 18.5 for Underweight data, upper bound stays at 25", () => {
    expect(getBmiYAxisDomain([15, 17])).toEqual([14, 25])
  })

  it("expands the upper bound above 25 for Overweight/Obese data, lower bound stays at 18.5", () => {
    expect(getBmiYAxisDomain([28, 32])).toEqual([18.5, 33])
  })

  it("returns the default [18.5, 25] for an empty array", () => {
    expect(getBmiYAxisDomain([])).toEqual([18.5, 25])
  })
})
