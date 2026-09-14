import MetricTile from "./MetricTile"
import { METRIC_CONFIG } from "@/utils/constants"
import { formatDisplayDate } from "@/utils/dateFormat"
import { useAppStore } from "@/store/appStore"
import ActivityHeatmap from "@/components/Charts/ActivityHeatmap"

export default function Dashboard() {
  const currentDate = useAppStore((s) => s.currentDate)

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold mb-4">
        {formatDisplayDate(currentDate)}
      </h1>
      {/* Per D-12: 2-column grid, Heart Rate spans col-span-2 */}
      {/* Per D-13: date in header */}
      {/* Per D-14: no "log missing metrics" banner */}
      <div className="grid grid-cols-2 gap-2">
        {(["weight", "sleep", "steps", "water"] as const).map((m) => (
          <MetricTile key={m} metric={m} {...METRIC_CONFIG[m]} />
        ))}
        <div className="col-span-2">
          <MetricTile metric="heartRate" {...METRIC_CONFIG.heartRate} />
        </div>
        <div className="col-span-2">
          <MetricTile metric="temperature" {...METRIC_CONFIG.temperature} />
        </div>
      </div>
      {/* Activity heatmap below metric tile grid (D-12) */}
      <div className="mt-6">
        <ActivityHeatmap />
      </div>
    </div>
  )
}
