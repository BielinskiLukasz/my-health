import { describe, it, expect } from "vitest"
import { calcBmi, bmiCategory } from "./bmi"

describe("calcBmi", () => {
  it("calculates BMI for 70kg / 175cm (Normal range)", () => {
    expect(calcBmi(70, 175)).toBeCloseTo(22.86, 1)
  })

  it("calculates BMI for 50kg / 160cm (Normal range)", () => {
    expect(calcBmi(50, 160)).toBeCloseTo(19.53, 1)
  })

  it("calculates BMI for 90kg / 180cm (Overweight)", () => {
    expect(calcBmi(90, 180)).toBeCloseTo(27.78, 1)
  })

  it("calculates BMI for 45kg / 165cm (Underweight boundary)", () => {
    // 45 / (1.65^2) = 45 / 2.7225 ≈ 16.53
    expect(calcBmi(45, 165)).toBeCloseTo(16.53, 1)
  })

  it("calculates BMI for 100kg / 175cm (Obese)", () => {
    // 100 / (1.75^2) = 100 / 3.0625 ≈ 32.65
    expect(calcBmi(100, 175)).toBeCloseTo(32.65, 1)
  })
})

describe("bmiCategory", () => {
  it("returns Underweight for BMI 18.4", () => {
    expect(bmiCategory(18.4)).toBe("Underweight")
  })

  it("returns Normal for BMI 18.5 (lower boundary)", () => {
    expect(bmiCategory(18.5)).toBe("Normal")
  })

  it("returns Normal for BMI 24.9 (upper boundary)", () => {
    expect(bmiCategory(24.9)).toBe("Normal")
  })

  it("returns Overweight for BMI 25.0 (lower boundary)", () => {
    expect(bmiCategory(25.0)).toBe("Overweight")
  })

  it("returns Overweight for BMI 29.9 (upper boundary)", () => {
    expect(bmiCategory(29.9)).toBe("Overweight")
  })

  it("returns Obese for BMI 30.0 (lower boundary)", () => {
    expect(bmiCategory(30.0)).toBe("Obese")
  })

  it("returns Obese for BMI 35.0", () => {
    expect(bmiCategory(35.0)).toBe("Obese")
  })

  it("returns Underweight for very low BMI (10.0)", () => {
    expect(bmiCategory(10.0)).toBe("Underweight")
  })

  it("returns Normal for mid-normal BMI (22.0)", () => {
    expect(bmiCategory(22.0)).toBe("Normal")
  })

  it("returns Overweight for mid-overweight BMI (27.5)", () => {
    expect(bmiCategory(27.5)).toBe("Overweight")
  })
})
