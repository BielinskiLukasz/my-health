/**
 * Pure BMI math utilities — no dependencies, no input validation.
 * Input validation (height guard) lives in useBmiData (T-02-08).
 */

/**
 * Calculate Body Mass Index from weight and height.
 * Formula: kg / m^2
 * No zero guard here — the caller (useBmiData) is responsible for input validation.
 */
export function calcBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return weightKg / (heightM * heightM)
}

/**
 * Return the BMI category using standard WHO thresholds.
 * Thresholds from CONTEXT.md Specific Ideas:
 *   Underweight < 18.5
 *   Normal      18.5 – 24.9
 *   Overweight  25 – 29.9
 *   Obese       ≥ 30
 */
export function bmiCategory(bmi: number): "Underweight" | "Normal" | "Overweight" | "Obese" {
  if (bmi < 18.5) return "Underweight"
  if (bmi < 25) return "Normal"
  if (bmi < 30) return "Overweight"
  return "Obese"
}
