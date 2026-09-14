// Security: all values are React JSX — no XSS vectors (T-02-09)
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts"
import { format } from "date-fns"
import { useBmiData } from "@/hooks/useBmiData"
import CustomTooltip from "./CustomTooltip"

// BMI category color hints (D-09)
const CATEGORY_COLOR: Record<string, string> = {
  Underweight: "text-blue-400",
  Normal: "text-emerald-400",
  Overweight: "text-yellow-400",
  Obese: "text-red-400",
}

// Format BMI X-axis tick as "MMM" (month abbreviation)
function xTickFormatter(dateStr: string): string {
  try {
    return format(new Date(dateStr + "T00:00:00"), "MMM")
  } catch {
    return ""
  }
}

export default function BmiSection() {
  const { bmiData, currentBmi, category, error } = useBmiData()

  // No-height state: height not set or invalid (T-02-08)
  if (error === "no-height") {
    return (
      <div className="mt-6 px-0 py-4 rounded-xl bg-zinc-900 text-center">
        <span className="text-sm text-gray-400">Set height in Settings to see BMI</span>
      </div>
    )
  }

  // No-data state: height is set but no weight entries exist
  if (bmiData.length === 0) {
    return (
      <div className="mt-6 px-0 py-4 rounded-xl bg-zinc-900 text-center">
        <span className="text-sm text-gray-400">Log weight to calculate BMI</span>
      </div>
    )
  }

  const categoryColor = category ? (CATEGORY_COLOR[category] ?? "text-gray-400") : "text-gray-400"

  return (
    <div className="mt-8 p-4 rounded-xl bg-zinc-900">
      {/* Section heading: "BMI" label in weight accent color blue-500 */}
      <span className="text-xs uppercase tracking-widest mb-2 text-blue-500 block">BMI</span>

      {/* Current BMI value + category label */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-semibold text-white leading-none">
          {currentBmi?.toFixed(1)}
        </span>
        <span className={`text-sm ${categoryColor}`}>{category}</span>
      </div>

      {/* BMI mini trend chart — dataKey="bmi" (not "value") */}
      {/* Pitfall 7: fixed pixel height, never "100%" */}
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={bmiData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={xTickFormatter}
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip unit="BMI" />} />

          {/* BMI category threshold reference lines */}
          <ReferenceLine
            y={18.5}
            stroke="#71717a"
            strokeDasharray="3 3"
            label={{ value: "18.5", fill: "#71717a", fontSize: 10 }}
          />
          <ReferenceLine
            y={25}
            stroke="#71717a"
            strokeDasharray="3 3"
            label={{ value: "25", fill: "#71717a", fontSize: 10 }}
          />
          <ReferenceLine
            y={30}
            stroke="#71717a"
            strokeDasharray="3 3"
            label={{ value: "30", fill: "#71717a", fontSize: 10 }}
          />

          <Line
            type="monotone"
            dataKey="bmi"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
