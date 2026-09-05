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

export default function HeartRateForm() {
  const navigate = useNavigate()
  const currentDate = useAppStore((s) => s.currentDate)
  const setCurrentDate = useAppStore((s) => s.setCurrentDate)

  const [value, setValue] = useState("")
  // HeartRate allows multiple entries per day (D-16 — auto-increment id PK)
  // We edit/delete the most recent entry for the selected date
  const [editingId, setEditingId] = useState<number | undefined>(undefined)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load most recent heart rate entry for the selected date
  useEffect(() => {
    async function load() {
      try {
        const entries = await db.heartRates
          .where("date")
          .equals(currentDate)
          .toArray()
        if (entries.length > 0) {
          // Pre-fill with the most recent entry (highest timestamp)
          const mostRecent = entries.reduce((latest, e) =>
            e.timestamp > latest.timestamp ? e : latest
          )
          setValue(String(mostRecent.bpm))
          setEditingId(mostRecent.id)
        } else {
          setValue("")
          setEditingId(undefined)
        }
      } catch {
        toast.error("Failed to load heart rate entry.")
      }
    }
    load()
  }, [currentDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value) return

    setIsLoading(true)
    try {
      const bpm = parseInt(value, 10)
      if (editingId !== undefined) {
        // Update existing entry (keep as the most recent for this date)
        await db.heartRates.update(editingId, {
          bpm,
          timestamp: new Date().toISOString(),
        })
      } else {
        // Add new entry — heart rate allows multiple per day (D-16)
        await db.heartRates.add({
          date: currentDate,
          bpm,
          timestamp: new Date().toISOString(),
        })
      }
      toast.success("Saved")
      navigate("/log")
    } catch {
      toast.error("Failed to save heart rate. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (editingId === undefined) return
    try {
      await db.heartRates.delete(editingId)
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
        Heart Rate for {formatDisplayDate(currentDate)}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Date picker — blocks future dates per D-09 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Date</label>
          <DatePicker value={currentDate} onChange={setCurrentDate} />
        </div>

        {/* Heart rate input — D-08: native number input */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Heart Rate (bpm)</label>
          <input
            type="number"
            step="1"
            min="20"
            max="300"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 72"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder:text-gray-600"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-white text-black font-semibold py-3 text-sm disabled:opacity-50 transition-opacity"
        >
          {editingId !== undefined ? "Update Heart Rate" : "Log Heart Rate"}
        </button>

        {/* Delete button — only shown when editing an existing entry (D-05) */}
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
                <DialogTitle>Delete heart rate entry?</DialogTitle>
                <DialogDescription>
                  Delete this heart rate entry? This cannot be undone.
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
