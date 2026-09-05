import { useNavigate, useParams } from "react-router-dom"
import { METRIC_CONFIG } from "@/utils/constants"
import { useAppStore } from "@/store/appStore"
import WeightForm from "./WeightForm"
import SleepForm from "./SleepForm"
import StepsForm from "./StepsForm"
import WaterForm from "./WaterForm"
import HeartRateForm from "./HeartRateForm"

export default function LogScreen() {
  const { metric } = useParams<{ metric?: string }>()
  const navigate = useNavigate()
  const setSelectedMetric = useAppStore((s) => s.setSelectedMetric)

  // Route to the correct form component based on the metric param
  if (metric) {
    if (metric === "weight") return <WeightForm />
    if (metric === "sleep") return <SleepForm />
    if (metric === "steps") return <StepsForm />
    if (metric === "water") return <WaterForm />
    if (metric === "heartRate") return <HeartRateForm />
    return (
      <div className="px-4 pt-6">
        <p className="text-gray-400">Unknown metric: {metric}</p>
      </div>
    )
  }

  const metrics = [
    "weight",
    "sleep",
    "steps",
    "water",
    "heartRate",
  ] as const

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold mb-4">Log</h1>
      <div className="flex flex-col gap-2">
        {metrics.map((m) => (
          <button
            key={m}
            onClick={() => {
              setSelectedMetric(m)
              navigate("/log/" + m)
            }}
            className="flex items-center gap-3 rounded-xl bg-zinc-900 p-4 text-left hover:bg-zinc-800 transition-colors"
          >
            <span
              className={
                METRIC_CONFIG[m].accentColor +
                " text-sm font-medium uppercase tracking-widest"
              }
            >
              {METRIC_CONFIG[m].label}
            </span>
            <span className="text-gray-400 text-sm ml-auto">
              {METRIC_CONFIG[m].unit}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
