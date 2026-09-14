// Security: no dangerouslySetInnerHTML — React JSX escapes all values by default (T-02-02)
// Explicit interface avoids recharts TooltipProps version compatibility issues (recharts v3)

interface TooltipPayloadEntry {
  value?: number
  name?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
  unit: string
}

export default function CustomTooltip({ active, payload, label, unit }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg text-sm">
      <p className="text-zinc-400 text-xs mb-1">{label}</p>
      <p className="text-white font-semibold">
        {payload[0].value?.toFixed(1)} {unit}
      </p>
    </div>
  )
}
