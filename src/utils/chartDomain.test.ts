import { describe, it, expect } from "vitest"
import { getYAxisDomain } from "./chartDomain"

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
