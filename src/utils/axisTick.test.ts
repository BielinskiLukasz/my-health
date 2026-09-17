import { describe, it, expect } from "vitest"
import { formatAxisTick } from "./axisTick"

describe("formatAxisTick", () => {
  it("formats a recurring-decimal float to 1 decimal place (bug report shape)", () => {
    expect(formatAxisTick(25.413580246913575)).toBe("25.4")
  })

  it("formats a calcBmi()-style weight/height^2 recurring decimal", () => {
    expect(formatAxisTick(22.857142857142858)).toBe("22.9")
  })

  it("formats a whole-number domain boundary with exactly 1 decimal", () => {
    expect(formatAxisTick(25)).toBe("25.0")
  })
})
