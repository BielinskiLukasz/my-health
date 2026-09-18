import { useState } from "react"
import { useTargetData } from "@/hooks/useTargetData"
import { useExerciseLogData } from "@/hooks/useExerciseLogData"
import {
  getExerciseWeeklyStatus,
  calculateWeeklyStreak,
} from "@/utils/targetCalcs"

// UI-SPEC: pink #EC4899 — not in METRIC_CONFIG/Tailwind's default palette,
// so applied via inline style rather than a Tailwind class.
const EXERCISE_ACCENT_HEX = "#EC4899"

type ExerciseStatus = "green" | "yellow" | "red"

const STATUS_BADGE_CLASS: Record<ExerciseStatus, string> = {
  green: "bg-emerald-500 text-white",
  yellow: "bg-amber-500 text-white",
  red: "bg-red-500 text-white",
}

const STATUS_BADGE_LABEL: Record<ExerciseStatus, string> = {
  green: "On track",
  yellow: "Off track",
  red: "Far off",
}

// D-01/D-07: Claude's discretion — sensible starting weekly cadence before
// any target row exists.
const DEFAULT_WEEKLY_TARGET = 3
const MIN_WEEKLY_TARGET = 1
const MAX_WEEKLY_TARGET = 14

export default function ExerciseProxyTile() {
  const { target, saveTarget } = useTargetData("exercise")
  const weeklyTarget = target?.value ?? DEFAULT_WEEKLY_TARGET
  const { weekCount, todayLogged, toggleToday, weeklyMetHistory } =
    useExerciseLogData(weeklyTarget)

  const [isEditingTarget, setIsEditingTarget] = useState(false)
  const [draftTarget, setDraftTarget] = useState(String(weeklyTarget))

  const status = getExerciseWeeklyStatus(weekCount, weeklyTarget)
  const streak = calculateWeeklyStreak(weeklyMetHistory)

  function startEditing() {
    setDraftTarget(String(weeklyTarget))
    setIsEditingTarget(true)
  }

  async function commitEdit() {
    // T-03-09: same numeric-range validation as TargetModal before the
    // Dexie write (D-08: this never resets the streak — it's a value edit).
    const parsed = Number.parseInt(draftTarget, 10)
    if (
      Number.isInteger(parsed) &&
      parsed >= MIN_WEEKLY_TARGET &&
      parsed <= MAX_WEEKLY_TARGET
    ) {
      await saveTarget({ value: parsed })
    }
    setIsEditingTarget(false)
  }

  return (
    <div
      className="relative flex flex-col rounded-2xl bg-zinc-950 p-4 text-left border-l-[3px] w-full"
      style={{ borderColor: EXERCISE_ACCENT_HEX }}
    >
      <span
        className="text-xs uppercase tracking-widest mb-2"
        style={{ color: EXERCISE_ACCENT_HEX }}
      >
        Exercise
      </span>

      <div className="flex items-baseline gap-1 text-xl font-semibold text-white leading-none">
        <span>{weekCount}/</span>
        {isEditingTarget ? (
          <input
            type="number"
            min={MIN_WEEKLY_TARGET}
            max={MAX_WEEKLY_TARGET}
            autoFocus
            value={draftTarget}
            onChange={(e) => setDraftTarget(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit()
            }}
            className="w-14 rounded bg-zinc-800 px-1 text-white"
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="underline decoration-dotted decoration-gray-500"
          >
            {weeklyTarget}
          </button>
        )}
        <span className="text-sm font-normal text-gray-400">this week</span>
      </div>

      <button
        type="button"
        onClick={() => toggleToday()}
        className={
          todayLogged
            ? "mt-3 w-full rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-white"
            : "mt-3 w-full rounded-lg bg-zinc-800 py-2 text-sm font-semibold text-white"
        }
      >
        {todayLogged ? "Exercised today ✓" : "Mark as exercised"}
      </button>

      <div className="mt-2 flex flex-col gap-1">
        <span
          className={`self-start rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE_CLASS[status]}`}
        >
          {STATUS_BADGE_LABEL[status]}
        </span>
        {/* D-17: always "N week streak" — never "N day streak". */}
        <span className="text-xs text-gray-400">{streak} week streak</span>
      </div>
    </div>
  )
}
