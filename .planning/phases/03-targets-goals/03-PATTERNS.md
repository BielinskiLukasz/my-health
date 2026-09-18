# Phase 3: Targets & Goals - Pattern Map

**Mapped:** 2026-09-18  
**Files analyzed:** 11 files (4 new, 7 modified)  
**Analogs found:** 11 / 11 (100% match rate)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/db/schema.ts` | config/schema | CRUD persistence | `src/db/schema.ts` (v2→v3 pattern) | exact |
| `src/hooks/useTargetData.ts` | hook | CRUD | `src/hooks/useChartData.ts` | exact |
| `src/hooks/useStreakData.ts` | hook | compute/transform | `src/hooks/useBmiData.ts` | exact |
| `src/hooks/usePersonalBestData.ts` | hook | CRUD/compute | `src/hooks/useBmiData.ts` | role-match |
| `src/hooks/useExerciseLogData.ts` | hook | CRUD | `src/hooks/useChartData.ts` | exact |
| `src/utils/targetCalcs.ts` | utility | transform | `src/utils/aggregation.ts` | role-match |
| `src/components/Dashboard/MetricTile.tsx` | component | request-response | `src/components/Dashboard/MetricTile.tsx` | self-extend |
| `src/components/Charts/MetricChart.tsx` | component | request-response | `src/components/Charts/MetricChart.tsx` | self-extend |
| `src/components/Charts/TargetModal.tsx` | component/form | request-response | `src/components/Log/WeightForm.tsx` | pattern-match |
| `src/components/Dashboard/ExerciseProxyTile.tsx` | component | request-response | `src/components/Dashboard/MetricTile.tsx` | role-match |
| `src/components/Dashboard/Dashboard.tsx` | component | request-response | `src/components/Dashboard/Dashboard.tsx` | self-extend |

---

## Pattern Assignments

### `src/db/schema.ts` (config, CRUD persistence)

**Analog:** `src/db/schema.ts` (lines 56-68)

**Pattern: Additive Dexie Schema Migration (v2→v3)**

Current v2 schema pattern (lines 56-68):
```typescript
class MyHealthDB extends Dexie {
  weights!: EntityTable<Weight, "id">
  sleepEntries!: EntityTable<Sleep, "date">
  // ... other tables
  
  constructor() {
    super("MyHealthDB")
    this.version(1).stores({
      weights: "++id, date",
      sleepEntries: "date",
      // ... v1 tables
    })
    this.version(2).stores({
      temperatures: "++id, date",  // NEW in v2, additive only
    })
  }
}
```

**Extend this pattern for v3:**
- Add new `Target` interface with properties: `metric: MetricType`, `value: number`, `targetDate: string`, `createdAt: string`
- Add new `ExerciseLog` interface with properties: `date: string`, `logged: boolean`
- Add new `PersonalBest` interface with properties: `metric: MetricType`, `value: number`, `date: string`, `direction: 'max' | 'min'`
- Define EntityTable properties in MyHealthDB class
- Add `this.version(3).stores({...})` chaining for targets, exerciseLog, personalBests (additive, never alter v1/v2)

**Key insight:** Per Phase 1 D-19, schema versioning is strictly additive. No existing tables are renamed or modified. The version(3) call chains after version(2) and defines ONLY new tables.

---

### `src/hooks/useTargetData.ts` (hook, CRUD)

**Analog:** `src/hooks/useChartData.ts` (lines 1-25, 92-148)

**Pattern: Hook Data Fetching with Dexie Query + Cancellation**

Imports (lines 1-5):
```typescript
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { db } from "@/db/schema"
import type { MetricType } from "@/store/appStore"
```

Core hook pattern (lines 92-148):
```typescript
export function useChartData(
  metric: MetricType,
  period: "W" | "M" | "Y"
): ChartDataResult {
  const [data, setData] = useState<DailyPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        // Dexie query here
        const result = await /* db query */

        if (cancelled) return

        setData(result)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [metric, period])

  return { data, isLoading }
}
```

**For useTargetData:** Replace the Dexie query with a fetch from the new `targets` table by metric type (e.g., `db.targets.get(metric)`). Return `{ target: Target | null, isLoading: boolean }`.

---

### `src/hooks/useStreakData.ts` (hook, compute)

**Analog:** `src/hooks/useBmiData.ts` (lines 23-74)

**Pattern: Hook with Computation + Cancellation**

Imports (lines 1-4):
```typescript
import { useState, useEffect } from "react"
import { db } from "@/db/schema"
import { groupByDay } from "@/utils/aggregation"
import { calcBmi, bmiCategory } from "@/utils/bmi"
```

Core computation pattern (lines 29-70):
```typescript
useEffect(() => {
  let cancelled = false

  async function load() {
    // Fetch ALL weight entries (no date range)
    const allWeights = await db.weights.orderBy("date").toArray()

    if (cancelled) return

    // Compute (normalize, group, transform)
    const dailyAvg = groupByDay(normalized, "average")
    const result = dailyAvg.map(d => ({ date: d.date, bmi: calcBmi(d.value, heightCm) }))

    if (!cancelled) {
      setBmiData(result)
      setCurrentBmi(result[result.length - 1].bmi)
    }
  }

  load()
  return () => { cancelled = true }
}, [])
```

**For useStreakData:** Fetch entries for a metric within a 365-day lookback, then compute streak by walking backwards day-by-day (per D-14/D-15/D-17 in CONTEXT.md). Return `{ streak: number, isLoading: boolean }`.

---

### `src/hooks/usePersonalBestData.ts` (hook, compute)

**Analog:** `src/hooks/useBmiData.ts` (lines 23-74)

**Pattern: Hook with Computation + Cancellation**

Use the same cancellation + async + state pattern as useBmiData. Key differences:
- Fetch ALL entries for a metric (no date range) via `db[metric + 'Entries'].toArray()` 
- Compute the best value per metric direction (max for weight/steps/water, min for heart rate)
- Return `{ personalBests: PersonalBest[], isLoading: boolean }` (may be multiple bests for weight: lowest AND highest)

---

### `src/hooks/useExerciseLogData.ts` (hook, CRUD)

**Analog:** `src/hooks/useChartData.ts` (lines 1-25, 92-148)

**Pattern: Hook Data Fetching with Dexie Query + Cancellation**

Same cancellation + state + useEffect pattern. For exercise proxy:
- Fetch the new `exerciseLog` table entries for the current week (ISO week: Mon-Sun)
- Count `logged: true` entries
- Return `{ weekCount: number, todayLogged: boolean, weekTarget: number, isLoading: boolean }`

---

### `src/utils/targetCalcs.ts` (utility, transform)

**Analog:** `src/utils/aggregation.ts` (lines 1-35)

**Pattern: Pure Functional Utility Functions**

Imports (lines 1-1):
```typescript
import { format } from "date-fns"
```

Core pattern — simple, testable, pure functions (lines 13-35):
```typescript
export function groupByDay(
  entries: { date: string; value: number }[],
  mode: "average" | "sum"
): DailyPoint[] {
  if (entries.length === 0) return []

  const byDate = new Map<string, number[]>()
  for (const e of entries) {
    const arr = byDate.get(e.date) ?? []
    arr.push(e.value)
    byDate.set(e.date, arr)
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date,
      value: mode === "sum" ? vals.reduce((s, v) => s + v, 0) : vals.reduce((s, v) => s + v, 0) / vals.length,
    }))
}
```

**For targetCalcs.ts:** Implement pure functions like:
- `fitLinearTrend(data: { date: string; value: number }[]): { slope: number; intercept: number } | null`
- `projectPace(trend: {...}, startDate: string, targetDate: string): number`
- `getOnTrackStatus(projectedValue: number, targetValue: number, metric: MetricType, dataPoints: number): 'green' | 'yellow' | 'red' | 'grey'`
- `meetsTargetForDay(entry: any, targetValue: number, direction: 'up' | 'down' | undefined, metric: MetricType): boolean`

All functions take in primitive data and return computed results; no state mutations or side effects.

---

### `src/components/Dashboard/MetricTile.tsx` (component, request-response)

**Analog:** `src/components/Dashboard/MetricTile.tsx` (self, entire file as base for extension)

**Pattern: Conditional Rendering by Variant + Navigation**

Current variant structure (lines 181-229):
```typescript
export default function MetricTile({
  metric,
  label,
  unit,
  accentColor,
  accentBorder,
}: MetricTileProps) {
  const navigate = useNavigate()
  const currentDate = useAppStore((s) => s.currentDate)
  const [tileData, setTileData] = useState<TileData>({ variant: "c", value: "" })

  useEffect(() => {
    loadTileData(metric, currentDate).then(setTileData)
  }, [metric, currentDate])

  const handleTap = () => {
    navigate("/chart/" + metric)
  }

  const { variant, value, lastDate, error } = tileData

  return (
    <button
      className={`relative flex flex-col rounded-2xl bg-zinc-950 p-4 text-left border-l-[3px] ${accentBorder} w-full`}
    >
      <span className={`text-xs uppercase tracking-widest mb-2 ${accentColor}`}>
        {label}
      </span>

      {error ? (
        <span className="text-sm text-gray-400">Could not load data</span>
      ) : variant === "c" ? (
        <span className="text-sm text-gray-400">No {label} yet</span>
      ) : variant === "a" ? (
        // Variant A: logged today
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-semibold text-white leading-none">{value}</span>
          <span className="text-sm text-gray-400">{unit}</span>
        </div>
      ) : (
        // Variant B: not logged today
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-semibold text-white leading-none opacity-50">{value}</span>
            <span className="text-sm text-gray-400 opacity-50">{unit}</span>
          </div>
          <div className="flex items-center gap-2">
            {lastDate && <span className="text-xs text-gray-400">{formatShortDate(lastDate)}</span>}
            <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">Not logged today</span>
          </div>
        </div>
      )}

      <div className="mt-2">
        <Sparkline metric={metric} accentHex={CHART_HEX[metric]} height={60} />
      </div>
    </button>
  )
}
```

**How to extend for Phase 3:** 
- Add conditional state for target, streak, and PB data (fetch via new hooks)
- After the sparkline (line 226-227), add a new section:
  - IF a target is set: render a progress bar (Tailwind width %), status badge (red/yellow/green/grey pill), and streak counter
  - IF no target set: render as-is (variants A/B/C unchanged per D-05)
- Progress bar width = `(currentValue / targetValue) * 100`
- Status badge uses `getOnTrackStatus()` colors and labels

**Key constraint:** This is an extension, NOT a replacement. Variants A/B/C remain unchanged for tiles without targets.

---

### `src/components/Charts/MetricChart.tsx` (component, request-response)

**Analog:** `src/components/Charts/MetricChart.tsx` (self, as base) + `src/components/Charts/BmiSection.tsx` (ReferenceLine pattern, lines 92-109)

**Pattern: Chart Component with Conditional Sub-Sections**

Current chart structure (lines 51-100):
```typescript
export default function MetricChart() {
  const { metric: metricParam } = useParams<{ metric: string }>()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<"W" | "M" | "Y">("W")

  if (!metricParam || !isValidMetric(metricParam)) {
    navigate(-1)
    return null
  }

  const metric = metricParam as MetricType
  const { data, prevData, isLoading } = useChartData(metric, period)
  const chartType = METRIC_CHART_TYPE[metric]
  const config = METRIC_CONFIG[metric]
  const accentHex = CHART_HEX[metric]
  const yAxisDomain = getYAxisDomain(metric)

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-xl font-semibold text-white">{config.label}</h1>
      </div>

      <ChartHeader metric={metric} data={data} prevData={prevData} period={period} />
      {/* ... chart body ... */}
    </div>
  )
}
```

**ReferenceLine pattern for target (from BmiSection.tsx, lines 92-109):**
```typescript
<ReferenceLine
  y={18.5}
  stroke="#71717a"
  strokeDasharray="3 3"
  label={{ value: "18.5", fill: "#71717a", fontSize: 10 }}
/>
```

**How to extend for Phase 3:**
1. Fetch target via `useTargetData(metric)` hook
2. After ChartHeader, add status badge:
   - Fetch via `getOnTrackStatus()` hook
   - Render as a pill: `<span className={statusColor}>{statusLabel}</span>`
3. Inside the chart (LineChart or BarChart), add a ReferenceLine if target is set:
   ```typescript
   {target && (
     <ReferenceLine
       y={target.value}
       stroke={CHART_HEX[metric]}
       strokeDasharray="5,5"
       label={{ value: `${target.value} ${config.unit}`, fill: CHART_HEX[metric], fontSize: 12 }}
     />
   )}
   ```
4. For PB badge: fetch via `usePersonalBestData(metric)` and render a "🏆 Personal best!" badge next to the status badge if a PB is detected for today's entry.

**Key constraint:** BmiSection pattern shows that ReferenceLine is a direct child of the chart component, not a wrapper. Follow that exact pattern.

---

### `src/components/Charts/TargetModal.tsx` (component/form, request-response)

**Analog:** `src/components/Log/WeightForm.tsx` (lines 1-80)

**Pattern: Dialog Form with CRUD Operations**

Imports pattern (lines 1-17):
```typescript
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
```

Form state + load pattern (lines 19-57):
```typescript
export default function WeightForm() {
  const navigate = useNavigate()
  const currentDate = useAppStore((s) => s.currentDate)
  const [value, setValue] = useState("")
  const [editingId, setEditingId] = useState<number | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const entries = await db.weights
          .where("date")
          .equals(currentDate)
          .sortBy("timestamp")
        if (entries.length > 0) {
          // Pre-fill with most recent entry
          const latest = entries[entries.length - 1]
          setValue(latest.value.toString())
          setEditingId(latest.id)
        } else {
          setValue("")
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
        await db.weights.update(editingId, { value: numValue })
      } else {
        await db.weights.add({ date: currentDate, value: numValue })
      }
      toast.success("Saved")
      navigate("/log")
    } catch {
      toast.error("Failed to save.")
    } finally {
      setIsLoading(false)
    }
  }
}
```

**For TargetModal:**
- Accept `metric: MetricType` and `isOpen: boolean` props
- Load existing target from `db.targets.get(metric)` on mount
- Form fields: target value (number input), target date (date picker), direction (for weight: 'up' or 'down', inferred from current value vs. target)
- On submit: `db.targets.put({ metric, value, targetDate, createdAt })` (PUT for upsert)
- On delete: `db.targets.delete(metric)`
- Toast success/error per WeightForm pattern

---

### `src/components/Dashboard/ExerciseProxyTile.tsx` (component, request-response)

**Analog:** `src/components/Dashboard/MetricTile.tsx` (lines 160-229)

**Pattern: Specialized Tile Component (Copy & Adapt)**

Use MetricTile as a base template, but with these differences:
- Not a generic `<MetricTile>` — a standalone ExerciseProxyTile component
- State: fetch `useExerciseLogData(metric='exercise')` to get `weekCount`, `todayLogged`, `weekTarget`
- Display: "3/4 this week" (current count / target count)
- Interactive: a toggle/checkbox below the weekly count to mark today as exercised
- On toggle: update `db.exerciseLog.put({ date: todayISO(), logged: newValue })`
- Tile structure mirrors MetricTile:
  - Accent color: `#EC4899` (pink, per UI-SPEC line 115)
  - Label: "Exercise"
  - Value display: "N/M this week" (with large font for the count)
  - Sparkline: 14-day heatmap showing which days exercised (optional, or reuse Sparkline component if it supports boolean data)
- No variants A/B/C — exercise is a simple boolean daily toggle, no "logged today" vs. "not logged today" distinction

**Key difference:** This tile is always "variant A" (logged/toggled today) or empty (no logging needed). It's not a value-measuring metric like weight; it's a behavior tracker.

---

### `src/components/Dashboard/Dashboard.tsx` (component, request-response)

**Analog:** `src/components/Dashboard/Dashboard.tsx` (self, lines 1-35)

**Pattern: Grid Layout with Conditional Sections**

Current structure (lines 7-35):
```typescript
export default function Dashboard() {
  const currentDate = useAppStore((s) => s.currentDate)

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold mb-4">
        {formatDisplayDate(currentDate)}
      </h1>
      <div className="grid grid-cols-2 gap-2">
        {(["weight", "sleep", "steps", "water"] as const).map((m) => (
          <MetricTile key={m} metric={m} {...METRIC_CONFIG[m]} />
        ))}
        <div className="col-span-2">
          <MetricTile metric="heartRate" {...METRIC_CONFIG.heartRate} />
        </div>
        <div className="col-span-2">
          <MetricTile metric="temperature" {...METRIC_CONFIG.temperature} />
        </div>
      </div>
      <div className="mt-6">
        <ActivityHeatmap />
      </div>
    </div>
  )
}
```

**How to extend for Phase 3:**
- Add a 7th tile for exercise proxy (per D-07)
- Insert `<ExerciseProxyTile />` after the temperature tile and before ActivityHeatmap
- Grid layout: 2-column, so the exercise tile should likely span full width like heartRate/temperature (col-span-2) or be placed as the first of a new row

---

## Shared Patterns

### Hook Cancellation Pattern
**Source:** `src/hooks/useChartData.ts` (lines 100-145), `src/hooks/useBmiData.ts` (lines 29-71)
**Apply to:** All new hooks (useTargetData, useStreakData, usePersonalBestData, useExerciseLogData)

```typescript
useEffect(() => {
  let cancelled = false

  async function load() {
    setIsLoading(true)
    try {
      // Dexie query or computation
      const result = await /* ... */
      
      if (cancelled) return
      
      setState(result)
    } finally {
      if (!cancelled) setIsLoading(false)
    }
  }

  load()
  return () => { cancelled = true }
}, [dependencies])
```

**Why:** Prevents state updates after unmount; essential for async Dexie operations.

---

### Conditional Rendering by Data State
**Source:** `src/components/Dashboard/MetricTile.tsx` (lines 191-222)
**Apply to:** MetricTile extensions (progress bar, status badge, streak), ExerciseProxyTile, TargetModal

```typescript
{error ? (
  <span>Error message</span>
) : variant === "c" ? (
  <span>No data yet</span>
) : variant === "a" ? (
  // Variant A: logged/complete
  <div>Full display</div>
) : (
  // Variant B: not logged/incomplete
  <div>Partial display</div>
)}
```

**Why:** Matches existing app pattern; ensures all states (error, no-data, partial, complete) are handled.

---

### Dexie Query Pattern for Metric Tables
**Source:** `src/hooks/useChartData.ts` (lines 23-79)
**Apply to:** All hooks that fetch metric data (useTargetData, useStreakData, usePersonalBestData, useExerciseLogData)

```typescript
async function fetchNormalizedRange(
  metric: MetricType,
  start: string,
  end: string
): Promise<{ date: string; value: number }[]> {
  switch (metric) {
    case "weight":
      const entries = await db.weights.where("date").between(start, end, true, true).toArray()
      return entries.map((e) => ({ date: e.date, value: e.value }))
    // ... other metrics
  }
}
```

**Why:** Centralizes per-metric table access; reusable across hooks.

---

### Toast Notifications for User Feedback
**Source:** `src/components/Log/WeightForm.tsx` (lines 78, 80, 87, 92)
**Apply to:** TargetModal (on save, delete, errors)

```typescript
import { toast } from "sonner"

// On success
toast.success("Target saved")

// On error
toast.error("Failed to save target.")
```

**Why:** Matches existing app UX; provides user feedback without dialog/modal overhead.

---

### ReferenceLine for Chart Annotations
**Source:** `src/components/Charts/BmiSection.tsx` (lines 92-109)
**Apply to:** MetricChart (target reference line, per D-13)

```typescript
import { ReferenceLine } from "recharts"

{target && (
  <ReferenceLine
    y={target.value}
    stroke={metricHexColor}
    strokeDasharray="5,5"
    label={{
      value: `${target.value} ${unit}`,
      fill: metricHexColor,
      fontSize: 12,
      position: 'right',
    }}
  />
)}
```

**Why:** Recharts native component; proven pattern for threshold/target visualization.

---

### Tailwind Conditional Classes for Status Colors
**Source:** Phase 2 patterns, leveraging Tailwind utilities
**Apply to:** MetricTile (status badge), ExerciseProxyTile

**Status color mapping:**
```typescript
const statusClasses = {
  'green': 'bg-emerald-500 text-white',
  'yellow': 'bg-amber-500 text-white',
  'red': 'bg-red-500 text-white',
  'grey': 'bg-gray-500 text-white',
}

<span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}>
  {statusLabel}
</span>
```

**Why:** Matches Phase 2 color theme; no new custom CSS; matches UI-SPEC color codes (lines 119-145).

---

## No Analog Found

All 11 files have clear analogs in the existing codebase. No files require bootstrap patterns from RESEARCH.md.

---

## Anti-Patterns to Avoid (From RESEARCH.md)

| Anti-Pattern | Why Bad | How to Avoid |
|---|---|---|
| Unified `goals` table across all metrics | Breaks per-metric query patterns | Create a single `targets` table with `metric` foreign key; query by metric |
| Calculating streaks at write time | Fails when targets are edited (D-08) | Compute streaks on-demand by walking backwards; never persist a "current streak" field |
| Full personal best scan every render | O(n) performance cost; breaks mobile responsiveness | Cache best values on first use in a `personalBests` table; only check new entries going forward |
| Using range inputs for non-range targets | Confuses point targets (weight/steps/water) with range targets (sleep) | Weight/steps/water: single numeric field. Sleep: two fields (min/max) or a single "target ± tolerance" value |
| Streak reset on target edit | Contradicts D-08 (streak persists across edits) | Derive streaks from historical log entries; target edits do NOT reset streak |

---

## Metadata

**Analog search scope:** `src/db/`, `src/hooks/`, `src/utils/`, `src/components/` (Dashboard, Charts, Log, ui)  
**Files scanned:** 30+  
**Pattern extraction date:** 2026-09-18  
**All analogs verified:** git ls-files confirms tracked sources (no gitignored mirrors)

---

*Phase 3: Targets & Goals*  
*Pattern mapping completed: 2026-09-18*
