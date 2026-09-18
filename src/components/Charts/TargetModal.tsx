import { useEffect, useState } from "react"
import { toast } from "sonner"
import { format, addDays } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { useTargetData } from "@/hooks/useTargetData"
import { METRIC_CONFIG } from "@/utils/constants"
import type { MetricType } from "@/store/appStore"

interface TargetModalProps {
  metric: MetricType
}

// RESEARCH's Input Validation for Targets table (weight/heartRate max);
// step per metric per <action>; sleep/steps/water max are Claude's
// discretion — sane physiological/logging ceilings, not from the table.
const STEP: Record<MetricType, string> = {
  weight: "0.1",
  sleep: "0.1",
  steps: "1",
  water: "50",
  heartRate: "1",
  temperature: "0.1",
}

const MAX_VALUE: Record<MetricType, number> = {
  weight: 500,
  sleep: 24,
  steps: 100000,
  water: 10000,
  heartRate: 300,
  temperature: 50,
}

export default function TargetModal({ metric }: TargetModalProps) {
  const { target, saveTarget, deleteTarget } = useTargetData(metric)
  const config = METRIC_CONFIG[metric]

  const [open, setOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [value, setValue] = useState("")
  const [targetDate, setTargetDate] = useState("")

  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd")

  // Prefill form when opening (or when the saved target changes)
  useEffect(() => {
    if (open) {
      setValue(target ? target.value.toString() : "")
      setTargetDate(target?.targetDate ?? "")
    }
  }, [open, target])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numValue = parseFloat(value)
    if (!value || isNaN(numValue) || numValue <= 0) {
      toast.error("Enter a target value.")
      return
    }
    if (!targetDate || targetDate <= format(new Date(), "yyyy-MM-dd")) {
      toast.error("Target date must be in the future.")
      return
    }

    try {
      await saveTarget({ value: numValue, targetDate })
      toast.success("Target saved")
      setOpen(false)
    } catch {
      toast.error("Failed to save target. Please try again.")
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTarget()
      toast.success("Target deleted")
      setDeleteDialogOpen(false)
      setOpen(false)
    } catch {
      toast.error("Failed to delete. Try again.")
      setDeleteDialogOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
        >
          {target ? "Edit Target" : "Set Target"}
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{target ? "Edit" : "Set"} {config.label} Target</DialogTitle>
          <DialogDescription>
            {metric === "heartRate"
              ? "Lower is better — aim for resting HR under..."
              : `Set a target ${config.label.toLowerCase()} value and date.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">Goal value ({config.unit})</label>
            <input
              type="number"
              step={STEP[metric]}
              min="0"
              max={MAX_VALUE[metric]}
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">Target by</label>
            <input
              type="date"
              min={tomorrow}
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-white text-black font-semibold py-3 text-sm transition-opacity"
          >
            Save Target
          </button>

          {target && (
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="w-full rounded-xl border border-red-500 text-red-500 font-semibold py-3 text-sm hover:bg-red-500/10 transition-colors"
                >
                  Delete Target
                </button>
              </DialogTrigger>
              <DialogContent showCloseButton={false}>
                <DialogHeader>
                  <DialogTitle>Delete {config.label.toLowerCase()} target?</DialogTitle>
                  <DialogDescription>
                    Delete this {config.label.toLowerCase()} target? Your streak will reset.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <button
                      type="button"
                      className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </DialogClose>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
