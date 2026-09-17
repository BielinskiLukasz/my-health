import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { format } from "date-fns"
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Line,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { ChevronLeft, Plus } from "lucide-react"
import type { MetricType } from "@/store/appStore"
import { METRIC_CONFIG } from "@/utils/constants"
import { CHART_HEX } from "@/utils/chartColors"
import { getYAxisDomain } from "@/utils/chartDomain"
import { formatAxisTick } from "@/utils/axisTick"
import { useChartData } from "@/hooks/useChartData"
import PeriodSelector from "./PeriodSelector"
import ChartHeader from "./ChartHeader"
import CustomTooltip from "./CustomTooltip"
import BmiSection from "./BmiSection"

// D-05: auto-choose chart type by metric (line for continuous, bar for discrete)
const METRIC_CHART_TYPE: Record<MetricType, "line" | "bar"> = {
  weight: "line",
  sleep: "line",
  steps: "bar",
  water: "bar",
  heartRate: "line",
  temperature: "line",
}

const VALID_METRICS: MetricType[] = [
  "weight",
  "sleep",
  "steps",
  "water",
  "heartRate",
  "temperature",
]

// T-02-01: validate metric against allowlist before use
function isValidMetric(m: string): m is MetricType {
  return VALID_METRICS.includes(m as MetricType)
}

export default function MetricChart() {
  const { metric: metricParam } = useParams<{ metric: string }>()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<"W" | "M" | "Y">("W")

  // T-02-01: guard against invalid metric in URL param
  if (!metricParam || !isValidMetric(metricParam)) {
    navigate(-1)
    return null
  }

  const metric = metricParam as MetricType
  const { data, prevData, isLoading } = useChartData(metric, period)

  // D-06 (narrowed): bar chart is forced only for discrete/count metrics
  // (steps, water) via METRIC_CHART_TYPE, independent of period — continuous
  // metrics render as a line chart in every period, including yearly.
  const chartType = METRIC_CHART_TYPE[metric]

  const config = METRIC_CONFIG[metric]
  const accentHex = CHART_HEX[metric]
  const yAxisDomain = getYAxisDomain(metric)

  // X-axis tick formatter: yearly shows month name, weekly/monthly shows "MMM d"
  const xTickFormatter = (value: string) => {
    if (period === "Y") {
      // Monthly data key is "YYYY-MM" — append "-01" to parse as a date
      return format(new Date(value + "-01T00:00:00"), "MMM")
    }
    return format(new Date(value + "T00:00:00"), "MMM d")
  }

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header row: back button + metric name */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-xl font-semibold text-white">{config.label}</h1>
      </div>

      {/* Summary stat header (avg/min/max + trend arrow) */}
      <ChartHeader metric={metric} data={data} prevData={prevData} period={period} />

      {/* Period switcher W | M | Y */}
      <div className="mb-4">
        <PeriodSelector selected={period} onSelect={setPeriod} />
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[220px] text-zinc-400 text-sm">
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[220px] text-zinc-400 text-sm">
          No data for this period
        </div>
      ) : (
        // Pitfall 7: ResponsiveContainer always uses fixed pixel height, never "100%"
        <ResponsiveContainer width="100%" height={220}>
          {chartType === "line" ? (
            <LineChart
              data={data}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tickFormatter={xTickFormatter}
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={yAxisDomain}
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={yAxisDomain ? formatAxisTick : undefined}
              />
              <Tooltip content={<CustomTooltip unit={config.unit} />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={accentHex}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tickFormatter={xTickFormatter}
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={yAxisDomain}
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={yAxisDomain ? formatAxisTick : undefined}
              />
              <Tooltip content={<CustomTooltip unit={config.unit} />} />
              <Bar dataKey="value" fill={accentHex} radius={[2, 2, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}

      {/* D-09: BMI section appears only below the weight chart — not dual Y-axis */}
      {metric === 'weight' && <BmiSection />}

      {/* D-02: FAB navigates to log form for this metric */}
      <button
        onClick={() => navigate("/log/" + metric)}
        className="fixed bottom-24 right-6 z-40 flex items-center justify-center rounded-full bg-white text-black p-4 shadow-lg hover:bg-gray-100 transition-colors"
        aria-label={`Log ${config.label}`}
      >
        <Plus className="size-5" />
      </button>
    </div>
  )
}
