import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { db } from "@/db/schema"
import { useAppStore, type MetricType } from "@/store/appStore"
import { differenceInMinutes, parseISO } from "date-fns"
import { CHART_HEX } from "@/utils/chartColors"
import Sparkline from "@/components/Charts/Sparkline"

interface MetricTileProps {
  metric: MetricType
  label: string
  unit: string
  accentColor: string
  accentBorder: string
}

type TileVariant = "a" | "b" | "c"

interface TileData {
  variant: TileVariant
  value: string
  lastDate?: string
  error?: boolean
}

async function loadTileData(
  metric: MetricType,
  currentDate: string
): Promise<TileData> {
  try {
    switch (metric) {
      case "weight": {
        const todayEntries = await db.weights
          .where("date")
          .equals(currentDate)
          .toArray()
        if (todayEntries.length > 0) {
          const avg =
            todayEntries.reduce((sum, e) => sum + e.value, 0) /
            todayEntries.length
          return { variant: "a", value: avg.toFixed(1) }
        }
        // Last known value
        const last = await db.weights.orderBy("date").reverse().first()
        if (last) {
          return { variant: "b", value: last.value.toFixed(1), lastDate: last.date }
        }
        return { variant: "c", value: "" }
      }

      case "sleep": {
        const today = await db.sleepEntries.get(currentDate)
        if (today) {
          const mins = today.duration
            ?? differenceInMinutes(parseISO(today.wakeTime), parseISO(today.beddingTime))
          const hours = Math.floor(Math.abs(mins) / 60)
          const remaining = Math.abs(mins) % 60
          return {
            variant: "a",
            value: `${hours}h ${remaining}m`,
          }
        }
        const last = await db.sleepEntries.orderBy("date").reverse().first()
        if (last) {
          const mins = last.duration
            ?? differenceInMinutes(parseISO(last.wakeTime), parseISO(last.beddingTime))
          const hours = Math.floor(Math.abs(mins) / 60)
          const remaining = Math.abs(mins) % 60
          return {
            variant: "b",
            value: `${hours}h ${remaining}m`,
            lastDate: last.date,
          }
        }
        return { variant: "c", value: "" }
      }

      case "steps": {
        const today = await db.stepEntries.get(currentDate)
        if (today) {
          return { variant: "a", value: today.steps.toLocaleString() }
        }
        const last = await db.stepEntries.orderBy("date").reverse().first()
        if (last) {
          return {
            variant: "b",
            value: last.steps.toLocaleString(),
            lastDate: last.date,
          }
        }
        return { variant: "c", value: "" }
      }

      case "water": {
        const today = await db.waterEntries.get(currentDate)
        if (today) {
          return { variant: "a", value: today.ml.toString() }
        }
        const last = await db.waterEntries.orderBy("date").reverse().first()
        if (last) {
          return {
            variant: "b",
            value: last.ml.toString(),
            lastDate: last.date,
          }
        }
        return { variant: "c", value: "" }
      }

      case "heartRate": {
        const todayEntries = await db.heartRates
          .where("date")
          .equals(currentDate)
          .toArray()
        if (todayEntries.length > 0) {
          const avg = Math.round(
            todayEntries.reduce((sum, e) => sum + e.bpm, 0) / todayEntries.length
          )
          return { variant: "a", value: avg.toString() }
        }
        const last = await db.heartRates.orderBy("date").reverse().first()
        if (last) {
          return {
            variant: "b",
            value: last.bpm.toString(),
            lastDate: last.date,
          }
        }
        return { variant: "c", value: "" }
      }

      case "temperature": {
        const todayEntries = await db.temperatures
          .where("date")
          .equals(currentDate)
          .toArray()
        if (todayEntries.length > 0) {
          const avg =
            todayEntries.reduce((sum, e) => sum + e.celsius, 0) /
            todayEntries.length
          return { variant: "a", value: avg.toFixed(1) }
        }
        const last = await db.temperatures.orderBy("date").reverse().first()
        if (last) {
          return {
            variant: "b",
            value: last.celsius.toFixed(1),
            lastDate: last.date,
          }
        }
        return { variant: "c", value: "" }
      }
    }
  } catch {
    return { variant: "c", value: "", error: true }
  }
}

export default function MetricTile({
  metric,
  label,
  unit,
  accentColor,
  accentBorder,
}: MetricTileProps) {
  const navigate = useNavigate()
  const currentDate = useAppStore((s) => s.currentDate)
  const [tileData, setTileData] = useState<TileData>({ variant: "c", value: "" })

  useEffect(() => {
    loadTileData(metric, currentDate).then(setTileData)
  }, [metric, currentDate])

  const handleTap = () => {
    navigate("/chart/" + metric)
  }

  const { variant, value, error } = tileData

  return (
    <button
      onClick={handleTap}
      className={`relative flex flex-col rounded-2xl bg-zinc-950 p-4 text-left border-l-[3px] ${accentBorder} w-full`}
    >
      {/* Metric name — accent color per metric for visual distinction */}
      <span className={`text-xs uppercase tracking-widest mb-2 ${accentColor}`}>
        {label}
      </span>

      {error ? (
        <span className="text-sm text-gray-400">Could not load data</span>
      ) : variant === "c" ? (
        /* Variant C: no data ever */
        <span className="text-sm text-gray-400">No {label} yet</span>
      ) : variant === "a" ? (
        /* Variant A: logged today */
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-semibold text-white leading-none">
            {value}
          </span>
          <span className="text-sm text-gray-400">{unit}</span>
        </div>
      ) : (
        /* Variant B: not logged today, last value shown */
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-semibold text-white leading-none opacity-50">
              {value}
            </span>
            <span className="text-sm text-gray-400 opacity-50">{unit}</span>
          </div>
        </div>
      )}

      {/* 14-day sparkline below value display (D-14, D-15) */}
      <div className="mt-2">
        <Sparkline metric={metric} accentHex={CHART_HEX[metric]} height={60} />
      </div>
    </button>
  )
}
