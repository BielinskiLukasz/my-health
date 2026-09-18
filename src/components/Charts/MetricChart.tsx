import { useEffect, useState } from "react"
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
  ReferenceLine,
} from "recharts"
import { ChevronLeft, Plus } from "lucide-react"
import type { MetricType } from "@/store/appStore"
import { METRIC_CONFIG } from "@/utils/constants"
import { CHART_HEX } from "@/utils/chartColors"
import { getYAxisDomain } from "@/utils/chartDomain"
import { formatAxisTick } from "@/utils/axisTick"
import { formatShortDate, todayISO } from "@/utils/dateFormat"
import { useChartData } from "@/hooks/useChartData"
import { useTargetData } from "@/hooks/useTargetData"
import { usePersonalBestData } from "@/hooks/usePersonalBestData"
import { resolveTodayValueForPbCheck } from "@/utils/personalBest"
import { fitLinearTrend, projectPace, getOnTrackStatus, type OnTrackStatus } from "@/utils/targetCalcs"
import PeriodSelector from "./PeriodSelector"
import ChartHeader from "./ChartHeader"
import CustomTooltip from "./CustomTooltip"
import BmiSection from "./BmiSection"
import TargetModal from "./TargetModal"

// D-13/D-21: temperature never gets target UI (not in TARG-01's metric list)
type TargetEligibleMetric = "weight" | "sleep" | "steps" | "water" | "heartRate"

function isTargetEligible(m: MetricType): m is TargetEligibleMetric {
  return m !== "temperature"
}

const STATUS_BADGE_CLASS: Record<OnTrackStatus, string> = {
  green: "bg-emerald-500 text-white",
  yellow: "bg-amber-500 text-white",
  red: "bg-red-500 text-white",
  grey: "bg-gray-500 text-white",
}

const STATUS_BADGE_LABEL: Record<OnTrackStatus, string> = {
  green: "On track",
  yellow: "Off track",
  red: "Far off",
  grey: "Not enough data yet",
}

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

  // T-02-01/CR-02: validate metric against the allowlist, but never early-
  // return before all hooks below have been called — a safe fallback metric
  // ("weight") is used only to keep hook calls stable; it is never reflected
  // in the returned JSX because the component returns `null` whenever
  // `metricParamValid` is false (see the post-hook return at the bottom).
  const metricParamValid = !!metricParam && isValidMetric(metricParam)
  const metric: MetricType = metricParamValid ? (metricParam as MetricType) : "weight"

  const { data, prevData, isLoading } = useChartData(metric, period)

  // D-13: target reference line + status badge (never rendered for temperature)
  const { target } = useTargetData(metric)
  // On-track status is always computed from the "W" period specifically,
  // independent of whichever period the user has selected (D-11).
  const { data: weekData } = useChartData(metric, "W")

  let onTrackStatus: OnTrackStatus | null = null
  if (target && isTargetEligible(metric)) {
    const trend = fitLinearTrend(weekData)
    const startDate = weekData[0]?.date ?? format(new Date(), "yyyy-MM-dd")
    // Pitfall 6 guard: fall back to the latest known value rather than
    // crash when no trend can be fit or no target date is set.
    const projected =
      trend && target.targetDate
        ? projectPace(trend, startDate, target.targetDate)
        : weekData.at(-1)?.value ?? target.value
    onTrackStatus = getOnTrackStatus(projected, target, metric, weekData.length)
  }

  // D-20/D-21/CR-01/WR-02: PB badge — target-independent, never shown for
  // temperature. Resolves today's own value first — a missing-today-entry
  // case is never represented as a numeric sentinel, and only today's own
  // entry (never a scan of the whole displayed period) can trigger the badge.
  const latestTodayValue = resolveTodayValueForPbCheck(data, todayISO())
  const { isPersonalBest } = usePersonalBestData(metric, latestTodayValue)

  // CR-02: all hooks above are now called unconditionally on every render.
  // The invalid-metric redirect is expressed only as a post-hook effect.
  useEffect(() => {
    if (!metricParamValid) navigate(-1)
  }, [metricParamValid, navigate])

  if (!metricParamValid) return null

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

      {/* D-20/D-21: PB badge — target-independent; never shown for temperature */}
      {isPersonalBest && (
        <span className="mb-4 inline-block self-start rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
          🏆 Personal best!
        </span>
      )}

      {/* D-06/D-13: target CTA, summary label, and on-track status badge — never for temperature */}
      {isTargetEligible(metric) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <TargetModal metric={metric} />
          {target && (
            <span className="text-sm text-zinc-400">
              Target: {target.value} {config.unit}
              {target.targetDate && ` by ${formatShortDate(target.targetDate)}`}
            </span>
          )}
          {onTrackStatus && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[onTrackStatus]}`}
            >
              {STATUS_BADGE_LABEL[onTrackStatus]}
            </span>
          )}
        </div>
      )}

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
              {target && (
                <ReferenceLine
                  y={target.value}
                  stroke={accentHex}
                  strokeDasharray="5,5"
                  strokeWidth={2}
                  label={{
                    value: `${target.value} ${config.unit}`,
                    fill: accentHex,
                    fontSize: 12,
                    position: "right",
                  }}
                />
              )}
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
              {target && (
                <ReferenceLine
                  y={target.value}
                  stroke={accentHex}
                  strokeDasharray="5,5"
                  strokeWidth={2}
                  label={{
                    value: `${target.value} ${config.unit}`,
                    fill: accentHex,
                    fontSize: 12,
                    position: "right",
                  }}
                />
              )}
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
