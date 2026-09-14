import { Button } from "@/components/ui/button"

interface PeriodSelectorProps {
  selected: "W" | "M" | "Y"
  onSelect: (p: "W" | "M" | "Y") => void
}

const PERIODS = ["W", "M", "Y"] as const

export default function PeriodSelector({ selected, onSelect }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1">
      {PERIODS.map((p) => (
        <Button
          key={p}
          variant={selected === p ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(p)}
        >
          {p}
        </Button>
      ))}
    </div>
  )
}
