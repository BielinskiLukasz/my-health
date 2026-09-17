import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
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
import { db } from "@/db/schema"
import { useAppStore } from "@/store/appStore"
import { formatDisplayDate } from "@/utils/dateFormat"
import DatePicker from "./DatePicker"

export default function WeightForm() {
  const navigate = useNavigate()
  const currentDate = useAppStore((s) => s.currentDate)
  const setCurrentDate = useAppStore((s) => s.setCurrentDate)

  const [value, setValue] = useState("")
  const [editingId, setEditingId] = useState<number | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Load existing entry for the selected date
  useEffect(() => {
    async function load() {
      try {
        const entries = await db.weights
          .where("date")
          .equals(currentDate)
          .sortBy("timestamp")
        if (entries.length > 0) {
          // Pre-fill with the most recent entry
          const latest = entries[entries.length - 1]
          setValue(latest.value.toString())
          setEditingId(latest.id)
        } else {
          // No entry for this date — prefill with the most recently logged value (G-02-3)
          const last = await db.weights.orderBy("date").reverse().first()
          setValue(last ? last.value.toString() : "")
          setEditingId(undefined)
        }
      } catch {
        toast.error("Failed to load weight entry.")
      }
    }
    load()
  }, [currentDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value) return

    setIsLoading(true)
    try {
      const numValue = parseFloat(value)
      if (editingId !== undefined) {
        await db.weights.update(editingId, {
          value: numValue,
          timestamp: new Date().toISOString(),
        })
      } else {
        await db.weights.add({
          date: currentDate,
          value: numValue,
          timestamp: new Date().toISOString(),
        })
      }
      toast.success("Saved")
      navigate("/log")
    } catch {
      toast.error("Failed to save Weight. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (editingId === undefined) return
    try {
      await db.weights.delete(editingId)
      toast.success("Deleted")
      setDeleteDialogOpen(false)
      navigate("/log")
    } catch {
      toast.error("Failed to delete. Try again.")
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold mb-4">
        Weight for {formatDisplayDate(currentDate)}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Date picker — blocks future dates per D-09 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Date</label>
          <DatePicker value={currentDate} onChange={setCurrentDate} />
        </div>

        {/* Weight input — D-08: native number input with step 0.1 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="999"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 73.5"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder:text-gray-600"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-white text-black font-semibold py-3 text-sm disabled:opacity-50 transition-opacity"
        >
          {editingId !== undefined ? "Update Weight" : "Log Weight"}
        </button>

        {/* Delete button — only shown when editing */}
        {editingId !== undefined && (
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="w-full rounded-xl border border-red-500 text-red-500 font-semibold py-3 text-sm hover:bg-red-500/10 transition-colors"
              >
                Delete Entry
              </button>
            </DialogTrigger>
            <DialogContent showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>Delete weight entry?</DialogTitle>
                <DialogDescription>
                  Delete this weight entry? This cannot be undone.
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
    </div>
  )
}
