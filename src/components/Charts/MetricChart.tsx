import { useNavigate } from "react-router-dom"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { CHART_HEX } from "@/utils/chartColors"

// Stub: hardcoded dummy data for smoke test (Task 1)
// Real data wired in Task 3
const DUMMY_DATA = [
  { date: "2026-09-08", value: 73.5 },
  { date: "2026-09-09", value: 73.2 },
  { date: "2026-09-10", value: 73.8 },
  { date: "2026-09-11", value: 73.1 },
  { date: "2026-09-12", value: 72.9 },
]

export default function MetricChart() {
  const navigate = useNavigate()

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-xl font-semibold text-white">Weight Chart</h1>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={DUMMY_DATA}
          margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={CHART_HEX["weight"]}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
