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
import { formatDisplayDate, todayISO } from "@/utils/dateFormat"
import DatePicker from "./DatePicker"

export default function WaterForm() {
  const navigate = useNavigate()
  const currentDate = useAppStore((s) => s.currentDate)
  const setCurrentDate = useAppStore((s) => s.setCurrentDate)

  const [value, setValue] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load existing entry for the selected date
  useEffect(() => {
    async function load() {
      try {
        const entry = await db.waterEntries.get(currentDate)
        if (entry) {
          setValue(String(entry.ml))
          setIsEditing(true)
        } else if (currentDate === todayISO()) {
          // No entry for today — prefill with the most recently logged value (G-02-3)
          const last = await db.waterEntries.orderBy("date").reverse().first()
          setValue(last ? String(last.ml) : "")
          setIsEditing(false)
        } else {
          // No entry for this historic date — leave empty, don't borrow an unrelated most-recent value
          setValue("")
          setIsEditing(false)
        }
      } catch {
        toast.error("Failed to load water entry.")
      }
    }
    load()
  }, [currentDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value) return

    setIsLoading(true)
    try {
      // put() upserts — date is primary key, one entry per day (D-16)
      await db.waterEntries.put({ date: currentDate, ml: parseInt(value, 10) })
      toast.success("Saved")
      navigate("/log")
    } catch {
      toast.error("Failed to save water intake. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await db.waterEntries.delete(currentDate)
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
        Water for {formatDisplayDate(currentDate)}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Date picker — blocks future dates per D-09 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Date</label>
          <DatePicker value={currentDate} onChange={setCurrentDate} />
        </div>

        {/* Water input — D-08: native number input, step 50 ml */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Water (ml)</label>
          <input
            type="number"
            step="50"
            min="0"
            max="10000"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 2000"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder:text-gray-600"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-white text-black font-semibold py-3 text-sm disabled:opacity-50 transition-opacity"
        >
          {isEditing ? "Update Water" : "Log Water"}
        </button>

        {/* Delete button — only shown when editing an existing entry (D-05) */}
        {isEditing && (
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
                <DialogTitle>Delete water entry?</DialogTitle>
                <DialogDescription>
                  Delete this water entry? This cannot be undone.
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
