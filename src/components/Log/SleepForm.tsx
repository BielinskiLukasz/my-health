import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { differenceInHours, differenceInMinutes } from "date-fns"
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

export default function SleepForm() {
  const navigate = useNavigate()
  const currentDate = useAppStore((s) => s.currentDate)
  const setCurrentDate = useAppStore((s) => s.setCurrentDate)

  const [beddingTime, setBeddingTime] = useState("")
  const [wakeTime, setWakeTime] = useState("")
  const [duration, setDuration] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load existing entry for the selected date
  useEffect(() => {
    async function load() {
      try {
        const entry = await db.sleepEntries.get(currentDate)
        if (entry) {
          // Extract HH:MM from ISO timestamp (e.g. "2024-01-01T23:00:00" → "23:00")
          const bedParts = entry.beddingTime.split("T")
          const wakeParts = entry.wakeTime.split("T")
          setBeddingTime(bedParts[1]?.slice(0, 5) ?? "")
          setWakeTime(wakeParts[1]?.slice(0, 5) ?? "")
          setIsEditing(true)
        } else if (currentDate === todayISO()) {
          // No entry for today — prefill with the most recently logged value (G-02-3)
          const last = await db.sleepEntries.orderBy("date").reverse().first()
          if (last) {
            const bedParts = last.beddingTime.split("T")
            const wakeParts = last.wakeTime.split("T")
            setBeddingTime(bedParts[1]?.slice(0, 5) ?? "")
            setWakeTime(wakeParts[1]?.slice(0, 5) ?? "")
          } else {
            setBeddingTime("")
            setWakeTime("")
          }
          setIsEditing(false)
          setDuration(null)
        } else {
          // No entry for this historic date — leave empty, don't borrow an unrelated most-recent value
          setBeddingTime("")
          setWakeTime("")
          setIsEditing(false)
          setDuration(null)
        }
      } catch {
        toast.error("Failed to load sleep entry.")
      }
    }
    load()
  }, [currentDate])

  // Duration calculation effect — runs whenever bedtime, wake time, or date changes
  // Per D-06 and D-17: overnight detection via hour comparison (wakeHour < bedHour → next day)
  useEffect(() => {
    if (!beddingTime || !wakeTime) {
      setDuration(null)
      return
    }
    try {
      const bedISO = currentDate + "T" + beddingTime + ":00"
      const wakeHour = parseInt(wakeTime.split(":")[0], 10)
      const bedHour = parseInt(beddingTime.split(":")[0], 10)

      // Overnight detection: if wake hour is earlier than bed hour, wake is the next calendar day
      let wakeDate = currentDate
      if (wakeHour < bedHour) {
        const nextDay = new Date(currentDate)
        nextDay.setDate(nextDay.getDate() + 1)
        wakeDate = nextDay.toISOString().slice(0, 10)
      }
      const wakeISO = wakeDate + "T" + wakeTime + ":00"

      const bedDateTime = new Date(bedISO)
      const wakeDateTime = new Date(wakeISO)
      const totalMins = differenceInMinutes(wakeDateTime, bedDateTime)

      if (totalMins <= 0) {
        setDuration(null)
        return
      }

      const hours = differenceInHours(wakeDateTime, bedDateTime)
      const mins = totalMins % 60
      setDuration(`${hours}h ${mins}m`)
    } catch {
      // Per T-02-04: wrap in try/catch — on failure show "--"
      setDuration(null)
    }
  }, [beddingTime, wakeTime, currentDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!beddingTime || !wakeTime) return

    setIsLoading(true)
    try {
      // Build bedtime ISO
      const beddingTimeISO = currentDate + "T" + beddingTime + ":00"

      // Overnight detection for wakeTime ISO — same logic as duration calculation
      const wakeHour = parseInt(wakeTime.split(":")[0], 10)
      const bedHour = parseInt(beddingTime.split(":")[0], 10)
      let wakeDate = currentDate
      if (wakeHour < bedHour) {
        const nextDay = new Date(currentDate)
        nextDay.setDate(nextDay.getDate() + 1)
        wakeDate = nextDay.toISOString().slice(0, 10)
      }
      const wakeTimeISO = wakeDate + "T" + wakeTime + ":00"

      // put() upserts — date is the primary key, one entry per day (D-16)
      await db.sleepEntries.put({
        date: currentDate,
        beddingTime: beddingTimeISO,
        wakeTime: wakeTimeISO,
      })
      toast.success("Saved")
      navigate("/log")
    } catch {
      toast.error("Failed to save sleep entry. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await db.sleepEntries.delete(currentDate)
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
        Sleep for {formatDisplayDate(currentDate)}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Date picker — blocks future dates per D-09 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Date</label>
          <DatePicker value={currentDate} onChange={setCurrentDate} />
        </div>

        {/* Bedtime input — D-06: use input[type="time"] */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Bedtime</label>
          <input
            type="time"
            required
            value={beddingTime}
            onChange={(e) => setBeddingTime(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
          />
        </div>

        {/* Wake time input */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Wake Time</label>
          <input
            type="time"
            required
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white"
          />
        </div>

        {/* Duration display — readonly, auto-calculated */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Duration</label>
          <div className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-gray-400">
            {duration ?? "--"}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-white text-black font-semibold py-3 text-sm disabled:opacity-50 transition-opacity"
        >
          {isEditing ? "Update Sleep" : "Log Sleep"}
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
                <DialogTitle>Delete sleep entry?</DialogTitle>
                <DialogDescription>
                  Delete this sleep entry? This cannot be undone.
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
