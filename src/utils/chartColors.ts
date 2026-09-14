import type { MetricType } from "@/store/appStore"

// Hex equivalents of Tailwind accent colors — for Recharts SVG stroke/fill props
// (Tailwind v4 has no JS theme() resolver; hex values must be hardcoded)
export const CHART_HEX: Record<MetricType, string> = {
  weight: "#3b82f6", // blue-500
  sleep: "#8b5cf6", // violet-500
  steps: "#10b981", // emerald-500
  water: "#06b6d4", // cyan-500
  heartRate: "#ef4444", // red-500
  temperature: "#f97316", // orange-500
}
