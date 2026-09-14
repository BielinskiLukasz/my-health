import { ArrowUp, ArrowDown, Minus } from "lucide-react"
import { METRIC_CONFIG } from "@/utils/constants"
import type { MetricType } from "@/store/appStore"
import type { DailyPoint } from "@/utils/aggregation"

interface ChartHeaderProps {
  metric: MetricType
  data: DailyPoint[]
  prevData: DailyPoint[]
  period: "W" | "M" | "Y"
}

function computeStats(data: DailyPoint[]): { avg: number; min: number; max: number } | null {
  if (data.length === 0) return null
  const values = data.map((d) => d.value)
  const avg = values.reduce((s, v) => s + v, 0) / values.length
  const min = Math.min(...values)
  const max = Math.max(...values)
  return { avg, min, max }
}

function TrendIcon({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return <Minus className="size-4 text-zinc-400" />
  const delta = (current - previous) / previous
  if (delta > 0.01) return <ArrowUp className="size-4 text-emerald-500" />
  if (delta < -0.01) return <ArrowDown className="size-4 text-red-500" />
  return <Minus className="size-4 text-zinc-400" />
}

export default function ChartHeader({ metric, data, prevData, period: _period }: ChartHeaderProps) {
  const config = METRIC_CONFIG[metric]
  const stats = computeStats(data)
  const prevStats = computeStats(prevData)

  return (
    <div className="mb-3">
      <span className={`text-xs uppercase tracking-widest ${config.accentColor}`}>
        {config.label}
      </span>

      {stats ? (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-white text-sm font-semibold">
            Avg {stats.avg.toFixed(1)}
          </span>
          <span className="text-zinc-400 text-sm">
            ({stats.min.toFixed(1)} – {stats.max.toFixed(1)})
          </span>
          {prevStats && (
            <TrendIcon current={stats.avg} previous={prevStats.avg} />
          )}
        </div>
      ) : (
        <p className="text-zinc-400 text-sm mt-1">No data for this period</p>
      )}
    </div>
  )
}
