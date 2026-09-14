import { ResponsiveContainer, LineChart, Line } from "recharts"
import { useChartData } from "@/hooks/useChartData"
import type { MetricType } from "@/store/appStore"

interface SparklineProps {
  metric: MetricType
  accentHex: string
}

/**
 * 14-day mini sparkline for Dashboard metric tiles (D-14, D-15).
 * Uses period='M' (30 days) and slices the last 14 entries.
 * Purely visual: no axes, no tooltip, no grid — just a trend line.
 * Fixed height={40} per RESEARCH.md Pitfall 7 (height="100%" resolves to 0).
 */
export default function Sparkline({ metric, accentHex }: SparklineProps) {
  const { data: allData, isLoading } = useChartData(metric, "M")
  const data = allData.slice(-14)

  // Loading placeholder — same height as the chart for layout stability
  if (isLoading) {
    return <div className="h-[40px]" />
  }

  // D-15: No data in last 14 days → show helper message instead of empty chart
  if (data.length === 0) {
    return (
      <div className="h-[40px] flex items-center">
        <span className="text-xs text-gray-400">Start logging to see trends</span>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={accentHex}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
