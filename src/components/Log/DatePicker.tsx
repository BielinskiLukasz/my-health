import { todayISO } from "@/utils/dateFormat"

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <input
      type="date"
      value={value}
      max={todayISO()}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
    />
  )
}
