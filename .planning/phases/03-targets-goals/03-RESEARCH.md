# Phase 3: Targets & Goals - Research

**Researched:** 2026-09-18
**Domain:** Goal tracking, progress projection, streak calculation, personal best detection
**Confidence:** HIGH

## Summary

Phase 3 adds deadlined targets with color-coded on-track status, projected pace calculations, per-metric streaks, and personal best detection to the existing Dashboard and chart infrastructure. The phase extends Dexie schema (v2→v3) with two additive tables (`targets` and `exerciseLog`), reuses the existing `useChartData` hook pattern for goal fetching, and introduces lightweight algorithms for trend projection (7-day linear least-squares), streak tracking (per-metric daily/weekly), and personal best scanning (retroactive + forward). All UI is built with existing Tailwind utilities and Recharts `ReferenceLine` component — no new dependencies required.

**Primary recommendation:** Implement Dexie schema v3 as two additive tables (targets per metric, exerciseLog as boolean daily), then layer goal logic into existing chart/tile components using hooks that follow the established `useEffect`+async+cancelled pattern. Linear trend calculation is simple least-squares fit over a 7-day window (no external library needed); optimize personal best detection with a full-table scan on first use, then incremental checks on new entries.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Target CRUD | Frontend (Browser) | — | Targets are user preferences, stored in IndexedDB; no server |
| Pace Projection | Frontend (Browser) | — | Trend calculation is lightweight CPU math; results cached in component state |
| Streak Calculation | Frontend (Browser) | — | Per-metric daily checks performed on demand; no persistent state needed (derived from log entries) |
| Personal Best Detection | Frontend (Browser) | — | Retroactive scans and incremental checks run on device; flagged in UI only |
| Target Reference Line | Browser (Chart) | — | Recharts `ReferenceLine` renders target value as visual cue on chart |
| On-Track Status Badge | Browser (UI) | — | Status color computed from projected pace; displayed as pill badge |
| Dashboard Progress Bar | Browser (UI) | — | Width calculated from current value vs target; displayed using Tailwind utilities |
| Exercise Proxy Toggle | Browser (UI) | — | Boolean toggle persists to exerciseLog table; weekly count derived on render |

## Standard Stack

### Core Technologies (No New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Dexie.js | 4.0+ | IndexedDB schema versioning and migration | Already chosen; supports additive schema v3 migration without altering existing tables v1/v2 |
| date-fns | 3.0+ | Date range calculations, day navigation | Already installed; tree-shakeable; used for streak/pace date math |
| Recharts | 2.10+ | `ReferenceLine` component for target line | Already in use (Phase 2 BmiSection); direct pattern reuse per D-13 |
| Tailwind CSS | 3.4+ | Progress bar, status badge, color utilities | Already in use; new colors (emerald/amber/red/gray for status) are standard utilities |

### Reusable Code Patterns

#### Pattern: Hook Data Fetching
**Source:** `src/hooks/useChartData.ts` (lines 92-148), `src/hooks/useBmiData.ts` (lines 23-74)

All Dexie-backed hooks follow this pattern:
```typescript
const [data, setData] = useState<T[]>([])
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  let cancelled = false
  
  async function load() {
    setIsLoading(true)
    try {
      // Dexie query
      if (cancelled) return
      setData(result)
    } finally {
      if (!cancelled) setIsLoading(false)
    }
  }
  
  load()
  return () => { cancelled = true }
}, [dependencies])
```

This pattern should be replicated for: `useTargetData`, `useStreakData`, `usePersonalBestData`, `useExerciseLogData`.

#### Pattern: ReferenceLine Usage
**Source:** `src/components/Charts/BmiSection.tsx` (lines 92-109)

Target reference lines on charts follow this exact pattern:
```typescript
<ReferenceLine
  y={targetValue}
  stroke={metricAccentColor}
  strokeDasharray="5,5"
  label={{ value: "75 kg", fill: metricAccentColor, fontSize: 12 }}
/>
```

#### Pattern: Per-Metric Dexie Tables
**Source:** `src/db/schema.ts` (lines 1-71)

Current v1/v2 schema never uses a unified table — each metric has its own Dexie EntityTable. Phase 3 must maintain this pattern:
- Do NOT create a `goals` or `allTargets` unified table
- Instead: `targets` table with foreign key reference to metric type (e.g., `metricType: string`)
- Same for `exerciseLog`: simple `{ date: string; logged: boolean }` one-row-per-day table

#### Pattern: Metric Configuration
**Source:** `src/utils/constants.ts` (lines 1-38)

The `METRIC_CONFIG` object declares label/unit/accentColor/accentBorder per metric. Exercise proxy is NOT in METRIC_CONFIG — it's a 7th special tile with its own accent color `#EC4899` (pink per UI-SPEC line 115).

#### Pattern: Tile Variants
**Source:** `src/components/Dashboard/MetricTile.tsx` (lines 17-25, 193-222)

Existing tiles have three variants:
- **Variant A:** Logged today (full value display)
- **Variant B:** Not logged today (faded value + "Not logged today" badge + last date)
- **Variant C:** No data ever (placeholder text)

Target UI (progress bar, status badge, streak) must extend these variants, not replace them. A tile without a target set should render as Phase 1/2 (Variant A/B/C unchanged per D-05).

### Installation
```bash
# Already installed; no new packages needed
npm list dexie date-fns recharts
```

### Version Verification

All are already installed per Phase 1/2 lock:
- **Dexie.js:** v4.0+ (`src/db/schema.ts` imports from "dexie")
- **date-fns:** v3.0+ (`src/utils/aggregation.ts`, `src/hooks/useChartData.ts` import functional API)
- **Recharts:** v2.10+ (`src/components/Charts/BmiSection.tsx` imports ReferenceLine)
- **Tailwind CSS:** v3.4+ (`index.css` configured; utilities in all components)

**No new dependency audit required.** Phase 3 uses only existing, approved libraries.

## Architecture Patterns

### System Architecture: Target Tracking Pipeline

```
User Sets Target
    ↓
IndexedDB Dexie v3 (targets + exerciseLog tables)
    ↓
useTargetData hook (fetch target + metric history)
    ↓
Pace Projection (7-day linear trend)
    ↓
Color Coding (red/yellow/green/grey)
    ↓
Dashboard Tile UI (progress bar + status badge + streak)
    Chart Screen UI (reference line + status badge + PB badge)
```

### Recommended Project Structure

New files to add in Phase 3:

```
src/
├── db/
│   └── schema.ts              # ADD v3 migration: targets + exerciseLog tables
├── hooks/
│   ├── useTargetData.ts       # NEW: fetch target for a metric
│   ├── useStreakData.ts       # NEW: calculate streak for a metric
│   ├── usePersonalBestData.ts # NEW: detect and fetch PBs
│   └── useExerciseLogData.ts  # NEW: fetch weekly exercise count
├── utils/
│   └── targetCalcs.ts         # NEW: pace projection, color thresholds, streak logic
├── components/
│   ├── Dashboard/
│   │   └── MetricTile.tsx     # EXTEND: add progress bar, status badge, streak (conditional on target)
│   ├── Charts/
│   │   ├── MetricChart.tsx    # EXTEND: add target reference line, status badge, PB badge
│   │   └── TargetModal.tsx    # NEW: form for setting/editing targets
│   └── Dashboard/
│       └── ExerciseProxyTile.tsx # NEW: 7th tile for exercise frequency
```

### Pattern 1: Linear Trend Calculation (Pace Projection)

**What:** Given 7+ days of logged values for a metric, fit a line using least-squares regression to project the metric's value at a target date.

**When to use:** On-track status (D-10/D-11) requires knowing whether the user is on pace. This runs on every chart load and whenever new entries are logged.

**Algorithm (simple least-squares):**

```typescript
// Source: Established practice; no dependency needed
function fitLinearTrend(data: { date: string; value: number }[]): { slope: number; intercept: number } | null {
  if (data.length < 2) return null
  
  const n = data.length
  const xValues = Array.from({ length: n }, (_, i) => i) // 0, 1, 2, ... (day index)
  const yValues = data.map(d => d.value)
  
  const xMean = xValues.reduce((a, b) => a + b) / n
  const yMean = yValues.reduce((a, b) => a + b) / n
  
  const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean), 0)
  const denominator = xValues.reduce((sum, x) => sum + (x - xMean) ** 2, 0)
  
  if (denominator === 0) return null
  
  const slope = numerator / denominator
  const intercept = yMean - slope * xMean
  
  return { slope, intercept }
}

// Predict value at day N
function predictAtDay(trend: { slope: number; intercept: number }, dayIndex: number): number {
  return trend.slope * dayIndex + trend.intercept
}
```

This is vanilla math — no library needed. Fits into `src/utils/targetCalcs.ts`.

**Confidence:** HIGH — Simple least-squares is standard; no complexity beyond 7-day window.

### Pattern 2: Streak Calculation

**What:** Per metric, count consecutive days the user logged an entry AND the entry met the target (or for exercise, consecutive weeks hitting weekly target).

**When to use:** Displayed on dashboard tile (D-19) and chart screen; must be recalculated daily.

**Algorithm (pseudo-code):**

```typescript
async function calculateStreak(metric: MetricType, targetValue: number, targetDirection: 'up' | 'down'): Promise<number> {
  const today = formatISO('yyyy-MM-dd', new Date())
  let streak = 0
  let currentDate = today
  
  while (true) {
    const entry = await fetchEntryForDate(metric, currentDate)
    
    if (!entry) {
      break // Day not logged → streak breaks (D-16)
    }
    
    const metTarget = meetsTarget(entry, targetValue, targetDirection, metric)
    
    if (!metTarget) {
      break // Logged but didn't meet target → streak breaks
    }
    
    streak++
    currentDate = subDays(currentDate, 1) // Go back one day
  }
  
  return streak
}
```

For weight, "meets target" is defined per D-15: value moved toward goal vs. previous logged value (or steady within tolerance).

For exercise proxy (D-17), streak counts **consecutive weeks**, not days — each week must hit the weekly session count target.

**Confidence:** HIGH — Logic is straightforward per CONTEXT.md D-14 through D-19.

### Pattern 3: Personal Best Detection

**What:** Retroactively scan all historical entries for a metric to find the "best" value per D-21 direction, then flag new entries as PB when they exceed the stored best.

**When to use:** 
- On first use of the feature (retroactive scan)
- After Samsung Health import (rescan)
- On every new entry logged (forward detection)

**Algorithm (pseudo-code):**

```typescript
async function detectPersonalBest(metric: MetricType): Promise<{ value: number; date: string } | null> {
  const allEntries = await db[metric + 'Entries'].toArray() // e.g., db.weights
  
  if (allEntries.length === 0) return null
  
  let bestEntry: { value: number; date: string } | null = null
  const direction = getPbDirection(metric) // 'max' for weight/steps, 'min' for heartRate, etc.
  
  for (const entry of allEntries) {
    if (!bestEntry) {
      bestEntry = entry
      continue
    }
    
    const isBetter = direction === 'max' ? entry.value > bestEntry.value : entry.value < bestEntry.value
    
    if (isBetter) {
      bestEntry = entry
    }
  }
  
  return bestEntry
}
```

For weight (D-21), both heaviest AND lightest are recorded (two separate "bests"). Store in a `personalBests` table or a per-metric field.

**Confidence:** HIGH — Straightforward max/min logic; retroactive scan is O(n) over the metric's entire history.

### Pattern 4: On-Track Status Color Coding

**What:** Given projected pace (from linear trend) and target value, assign a color (green/yellow/red/grey) per D-10.

**When to use:** Every time a chart loads or a new entry is logged; displayed as status badge.

**Algorithm:** Uses tolerance bands per metric (proposed defaults from UI-SPEC lines 131-137):

```typescript
function getOnTrackStatus(
  projectedValue: number,
  targetValue: number,
  metric: MetricType,
  dataPoints: number
): 'green' | 'yellow' | 'red' | 'grey' {
  // D-11: need 7+ days before showing color
  if (dataPoints < 7) return 'grey'
  
  // Calculate gap between projected and target
  const gap = Math.abs(projectedValue - targetValue)
  
  // Tolerance bands per metric (planner refines these)
  const tolerance = getToleranceForMetric(metric) // e.g., 0.5 for weight, 500 for steps
  
  if (gap <= tolerance) return 'green'
  if (gap <= tolerance * 2) return 'yellow'
  return 'red'
}

// Proposed defaults (planner may adjust after Phase 2 data review):
const TOLERANCES: Record<MetricType, number> = {
  weight: 0.5,        // ±0.5 kg
  sleep: 0.5,         // ±0.5 hours
  steps: 500,         // ±500 steps/day
  water: 200,         // ±200 ml/day
  heartRate: 3,       // ±3 bpm
  temperature: 0.2,   // ±0.2°C (not used; no target tracking)
}
```

For sleep (range target, D-04) and heart rate (ceiling, D-03), distance is measured from the nearest edge, not the midpoint.

**Confidence:** HIGH — Simple threshold logic; planner can propose sensible defaults.

### Anti-Patterns to Avoid

- **Creating a unified `goals` table:** Each metric-specific table should hold its own target. Use `metricType: string` as a foreign key in a single `targets` table if normalized, but DO NOT use a unified schema like `{ metricType, value, targetValue, targetDate }` for all metrics — breaks per-metric querying patterns. [VERIFIED: src/db/schema.ts:43-44]
- **Calculating streaks at write time:** Don't update a persistent "current streak" field every time an entry is logged. Instead, calculate on-demand by walking backwards from today — this is resilient to target edits (D-08 says streak persists across target changes) and to data corrections.
- **Scanning all history every render:** Personal best detection should cache the "best" value on first use (store in a separate `personalBests` table or a localStorage summary), then only check new entries going forward. A full table scan per render is O(n) and breaks mobile responsiveness.
- **Using a range of values for non-range targets:** Weight/steps/water are point targets (a specific number), not ranges. The UI-SPEC mistakenly suggests range input for sleep (D-04); implement sleep range as two separate numeric fields or a single "target ±range" value, not a from/to range picker.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Linear trend / pace projection | Custom trend fitting algorithm | Least-squares regression in `targetCalcs.ts` (pure math, ~20 lines) | Existing codebase has no trend calculation; regression is straightforward and requires no external library |
| Managing Dexie schema versioning | Custom migration logic | Dexie's built-in `version()` chaining and additive `.stores()` (schema v3) | Dexie handles version conflicts and data preservation; manual migrations are error-prone |
| Color/status mapping | Custom status logic | Threshold bands in a lookup table (`getOnTrackStatus()`) | Color logic is metric-agnostic; a lookup table is maintainable and testable |
| Date range calculations | Moment.js or Temporal | date-fns (already installed) functional API | date-fns is tree-shakeable and already used throughout; no new dependency |
| Component state for targets | Redux slices or Context API | Zustand (existing store) or component-level useState + Dexie hooks | Zustand is already used; targets are read from IndexedDB anyway, so Dexie hooks are sufficient |

**Key insight:** Phase 3's calculations are lightweight enough that custom, framework-agnostic implementations in `utils/targetCalcs.ts` are simpler and more maintainable than adding dependencies or overgeneralizing patterns.

## Common Pitfalls

### Pitfall 1: Streak Persists Across Target Changes (D-08)
**What goes wrong:** A developer stores the streak as part of the target record, then deletes the target. The streak is lost. Or, the user changes their target value from 75 kg to 70 kg, and the code resets the streak thinking it's a "new target."

**Why it happens:** Confusing "target" (a user preference) with "streak" (a derived metric based on logging consistency).

**How to avoid:** Store targets and streaks separately. Streaks are always derived on-demand by walking backwards from today, checking if each day's entry met the target. This way, editing a target doesn't affect the stored streak calculation — the streak just recalculates against the new target.

**Warning signs:** 
- Code that reads `target.streak` or tries to update a streak field when a target is saved.
- A database migration that moves old streak data between tables.
- Tests that assume streak resets when a target is edited.

### Pitfall 2: Insufficient Data Before Showing Color (D-11)
**What goes wrong:** User sets a target on Day 1, and the progress bar turns red because the app calculates pace against only 1 day of data. Or the app shows colored status before 7 days, misleading the user.

**Why it happens:** Forgetting the grey "Not enough data yet" state, or calculating pace with fewer than 7 data points.

**How to avoid:** Always check `dataPoints >= 7` before returning a green/yellow/red status. Return grey otherwise. Explicitly render a grey badge with the text "Not enough data yet" (per UI-SPEC lines 174-175).

**Warning signs:**
- On-track status shown as red/yellow/green on day 1 or 2 of logging.
- No visual distinction for "insufficient data" state.
- Tests that don't cover the 6-day / 7-day boundary.

### Pitfall 3: Weight Streak Logic (D-15)
**What goes wrong:** The app checks if weight moved toward the goal direction, but uses the wrong comparison (e.g., compares to target instead of previous logged value, or checks the wrong metric type).

**Why it happens:** Conflating "on pace" (used for color coding) with "met target today" (used for streaks). Weight is special — for streak purposes, a day counts only if the value moved toward the goal direction vs. the *previous logged value*, not vs. the target value.

**How to avoid:** For weight specifically, streak logic is: "Did today's entry move closer to the goal direction than yesterday's entry?" Implement this as a dedicated `weighMetTargetForStreak()` function, separate from the pace/color calculation. Test extensively with weight going up and down.

**Warning signs:**
- Same logic used for "weight on-track color" and "weight streak" — they should differ.
- Streak tests only cover weight that's moving in one direction (e.g., always losing weight).
- No test cases for weight that fluctuates or gains then loses.

### Pitfall 4: Exercise Proxy Streak is Weekly, Not Daily (D-17)
**What goes wrong:** The app shows "5 day streak" for the exercise proxy, but the requirement is "5 week streak" (consecutive weeks hitting the weekly session target).

**Why it happens:** Copy-pasting the daily streak logic from other metrics without adjusting for the weekly cadence of exercise.

**How to avoid:** The exercise proxy is fundamentally different — it's a weekly metric, not a daily one. Its streak counts *consecutive weeks* that hit the weekly target, not *consecutive days*. Implement a separate `calculateExerciseStreak()` function that looks backward week-by-week, not day-by-day.

**Warning signs:**
- Exercise streak label shows "3 day streak" instead of "3 week streak".
- Exercise streak resets because of a single missed day in an otherwise strong week.
- Tests that assume all metrics have daily-granularity streaks.

### Pitfall 5: Personal Best Detection on Import (D-22)
**What goes wrong:** User imports 6 months of Samsung Health data after setting targets. A real PB from 2 months ago is never flagged because the code only checks forward from "now."

**Why it happens:** Assuming PB detection only runs on new entries; forgetting to trigger a retroactive scan after data import.

**How to avoid:** On import completion, trigger a full `detectPersonalBest()` scan for each metric. Cache the results (store in a `personalBests` table with `{ metric, date, value }`). Then, for forward detection, only check if a new entry exceeds the cached best.

**Warning signs:**
- PB badges only appear for very recent entries.
- No PB flagged in imported historical data, even though actual PBs exist.
- Import feature doesn't trigger any PB detection logic.

### Pitfall 6: Missing Edge Cases in Pace Calculation
**What goes wrong:** The linear trend projection crashes or returns `NaN` when:
- Data has only 1 entry (no trend line can be fit)
- All entries have the same value (zero slope)
- Target date is in the past
- User has gaps in logging (sparse data)

**Why it happens:** Not defensive against edge cases in the least-squares math.

**How to avoid:** 
- Guard against fewer than 2 data points (return null or grey status)
- Guard against zero denominator in slope calculation
- Validate target date is in the future before calculating pace
- Test with data that has gaps, outliers, and flat plateaus

**Warning signs:**
- Console errors like "Cannot read property of NaN" when loading a chart.
- Projected pace shows as `Infinity` or undefined.
- On-track status crashes for newly-set targets with sparse data.

## Runtime State Inventory

> This is a migration phase (user setting targets for the first time; new exerciseLog table tracks daily behavior).

### Stored Data
- **Dexie targets table:** User-set goals (metric, target value, target date) — NEW in v3. No existing data.
- **Dexie exerciseLog table:** Boolean daily exercise marker — NEW in v3. No existing data.
- **Personal best cache:** Best value per metric per direction (e.g., highest weight, lowest heart rate) — NEW, stored in a dedicated table or localStorage summary after first retroactive scan.
- **Phase 1/2 data unchanged:** weights, sleepEntries, stepEntries, waterEntries, heartRates, temperatures continue to exist in v1/v2 tables; v3 migration is additive only.

### Live Service Config
- None. All targets and streaks are local to the device.

### OS-Registered State
- None. Phase 3 is browser-only.

### Secrets/Env Vars
- None. No new environment variables needed.

### Build Artifacts
- None. Dexie schema v3 is backward-compatible; no reinstall needed.

**Note:** Every item explicitly checked. Phase 3 adds only new tables; no renaming or migration of existing data. First-use retroactive PB scan is a UI operation, not a hidden state mutation.

## Code Examples

### Example 1: Dexie Schema v3 Migration (Additive Only)

**Source:** Pattern reused from Phase 1 D-19 (`src/db/schema.ts` lines 58-68)

```typescript
// src/db/schema.ts — ADD this after existing v2 definition

interface Target {
  metric: MetricType  // "weight", "sleep", etc.
  value: number       // target value in metric units
  targetDate: string  // YYYY-MM-DD deadline
  direction?: 'up' | 'down'  // optional; inferred from current value
  createdAt: string   // ISO timestamp
}

interface ExerciseLog {
  date: string        // YYYY-MM-DD (primary key)
  logged: boolean     // did user exercise today?
}

interface PersonalBest {
  metric: MetricType
  value: number
  date: string        // YYYY-MM-DD when the best was logged
  direction: 'max' | 'min'  // what kind of best (heaviest, lightest, longest, etc.)
}

// In the MyHealthDB class constructor:
this.version(3).stores({
  targets: "metric",  // metric is primary key; one target per metric
  exerciseLog: "date",  // date is primary key; one boolean per day
  personalBests: "++id, metric",  // one row per metric-direction combo
})
```

**Confidence:** HIGH — Dexie additive migrations are proven safe; schema follows existing per-metric pattern. [VERIFIED: src/db/schema.ts:56-68]

### Example 2: Linear Trend Calculation

**Source:** Vanilla least-squares regression; no external library

```typescript
// src/utils/targetCalcs.ts — NEW file

export function fitLinearTrend(
  data: { date: string; value: number }[]
): { slope: number; intercept: number } | null {
  if (data.length < 2) return null

  const n = data.length
  const xValues = Array.from({ length: n }, (_, i) => i)
  const yValues = data.map(d => d.value)

  const xMean = xValues.reduce((a, b) => a + b) / n
  const yMean = yValues.reduce((a, b) => a + b) / n

  const numerator = xValues.reduce(
    (sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean),
    0
  )
  const denominator = xValues.reduce((sum, x) => sum + (x - xMean) ** 2, 0)

  if (denominator === 0) return null

  const slope = numerator / denominator
  const intercept = yMean - slope * xMean

  return { slope, intercept }
}

export function projectPace(
  trend: { slope: number; intercept: number },
  startDate: string,
  targetDate: string
): number {
  const daysUntilTarget = differenceInDays(new Date(targetDate), new Date(startDate))
  return trend.slope * daysUntilTarget + trend.intercept
}
```

**Confidence:** HIGH — Standard math; tested in similar contexts (trading, analytics). No dependencies.

### Example 3: Streak Calculation Hook (Following Established Pattern)

**Source:** Pattern reused from `useChartData.ts` (lines 92-148) and `useBmiData.ts` (lines 23-74)

```typescript
// src/hooks/useStreakData.ts — NEW file

import { useState, useEffect } from "react"
import { format, subDays } from "date-fns"
import { db } from "@/db/schema"
import type { MetricType } from "@/store/appStore"

interface StreakResult {
  streak: number
  isLoading: boolean
}

export function useStreakData(
  metric: MetricType,
  targetValue?: number,
  targetDirection?: 'up' | 'down'
): StreakResult {
  const [streak, setStreak] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function calculate() {
      setIsLoading(true)
      try {
        // If no target set, streak is always 0 (D-05)
        if (!targetValue) {
          if (!cancelled) {
            setStreak(0)
          }
          return
        }

        const today = format(new Date(), "yyyy-MM-dd")
        let count = 0
        let currentDate = today

        // Walk backwards day by day
        for (let i = 0; i < 365; i++) { // Max 1 year lookback
          const entry = await fetchEntryForDate(metric, currentDate)

          if (!entry) {
            break // Day not logged → streak breaks
          }

          const metTarget = meetsTargetForDay(entry, targetValue, targetDirection, metric)

          if (!metTarget) {
            break // Logged but didn't meet target
          }

          count++
          currentDate = format(subDays(new Date(currentDate), 1), "yyyy-MM-dd")
        }

        if (!cancelled) {
          setStreak(count)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    calculate()
    return () => {
      cancelled = true
    }
  }, [metric, targetValue, targetDirection])

  return { streak, isLoading }
}

// Helper: fetch entry for a specific date
async function fetchEntryForDate(metric: MetricType, date: string) {
  switch (metric) {
    case "weight":
      return await db.weights.where("date").equals(date).first()
    case "sleep":
      return await db.sleepEntries.get(date)
    case "steps":
      return await db.stepEntries.get(date)
    case "water":
      return await db.waterEntries.get(date)
    case "heartRate":
      return await db.heartRates.where("date").equals(date).first()
    default:
      return null
  }
}

// Helper: check if entry met the target for that day
function meetsTargetForDay(entry: any, targetValue: number, direction: 'up' | 'down' | undefined, metric: MetricType): boolean {
  if (metric === "weight") {
    // Weight: must move toward goal direction vs. previous value
    // (simplified; planner implements full logic with previous-entry lookup)
    return direction === 'down' ? entry.value <= targetValue : entry.value >= targetValue
  }
  // Other metrics: simple value comparison
  return direction === 'up' ? entry.value >= targetValue : entry.value <= targetValue
}
```

**Confidence:** HIGH — Follows established hook pattern exactly. [VERIFIED: src/hooks/useChartData.ts:92-148, src/hooks/useBmiData.ts:23-74]

### Example 4: ReferenceLine for Target Value on Chart

**Source:** Pattern reused from `BmiSection.tsx` (lines 92-109)

```typescript
// In MetricChart.tsx, after the main chart data is loaded:

import { ReferenceLine } from "recharts"

// Inside the <LineChart> or <BarChart>:
{target && (
  <ReferenceLine
    y={target.value}
    stroke={CHART_HEX[metric]}
    strokeDasharray="5,5"
    strokeWidth={2}
    label={{
      value: `${target.value} ${METRIC_CONFIG[metric].unit}`,
      fill: CHART_HEX[metric],
      fontSize: 12,
      position: 'right',
    }}
  />
)}
```

**Confidence:** HIGH — Direct reuse of BmiSection pattern. [VERIFIED: src/components/Charts/BmiSection.tsx:92-109]

### Example 5: On-Track Status Badge

**Source:** Derived from UI-SPEC (lines 232-241) and color codes (lines 119-145)

```typescript
// In MetricChart.tsx header:

import { getOnTrackStatus } from "@/utils/targetCalcs"

const statusColor = {
  'green': 'bg-emerald-500 text-white',
  'yellow': 'bg-amber-500 text-white',
  'red': 'bg-red-500 text-white',
  'grey': 'bg-gray-500 text-white',
}[status]

const statusLabel = {
  'green': 'On track',
  'yellow': 'Off track',
  'red': 'Far off',
  'grey': 'Not enough data yet',
}[status]

return (
  <div className="flex items-center gap-2 mt-2">
    {/* Existing Avg/Min/Max stats */}
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
      {statusLabel}
    </span>
  </div>
)
```

**Confidence:** HIGH — UI spec colors and labels are locked (UI-SPEC lines 126-137, 163).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No targets / goals | Deadlined targets with projected pace (Phase 3) | Current | Users can now see if they're on track and adjust daily behavior |
| No streak tracking | Per-metric daily/weekly streaks (Phase 3) | Current | Motivation feature; visual consistency check |
| No personal bests | Auto-detected + flagged in UI (Phase 3) | Current | Celebration of achievements; feature parity with commercial health apps |
| Unidirectional metrics | Weight supports both directions (lose/gain); HR is ceiling (Phase 3) | Current | More flexible goal-setting per D-02, D-03 |
| No range targets | Sleep supports "around X hours" range (Phase 3) | Current | Accounts for realistic sleep variability per D-04 |

**Deprecated/outdated:**
- None. Phase 3 adds entirely new capabilities; no deprecations.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Dexie schema v3 can add two new tables (targets, exerciseLog) without affecting v1/v2 tables | Code Examples, Standard Stack | If wrong: existing data is lost. Mitigation: test with Phase 2 sample data before deploying |
| A2 | Linear least-squares fit over 7 days is sufficient for pace projection without overfitting | Architecture Patterns (Pattern 1) | If wrong: projections are inaccurate. Mitigation: planner can propose higher-order polynomial fit if needed, but likely overkill for health metrics |
| A3 | Tolerance bands (0.5 kg, 500 steps, etc.) from UI-SPEC are sensible defaults | Don't Hand-Roll, Code Examples | If wrong: users see misleading color coding. Mitigation: gather user feedback in Phase 3 UAT; adjust in Phase 4 refinement |
| A4 | Exercise proxy (simple boolean daily toggle) is sufficient as Phase 3 placeholder for Phase 4's full training sessions | Architecture Patterns, Context (D-01) | If wrong: users frustrate with limited exercise tracking. Mitigation: D-01 explicitly calls this a stopgap; Phase 4 will replace it |
| A5 | Retroactive personal best scan on first use is performant (O(n) over metric's history, < 100ms on mobile) | Common Pitfalls (Pitfall 3), Architecture Patterns (Pattern 3) | If wrong: app lags on first use. Mitigation: profile on real device; cache aggressively; consider Worker if needed |

## Open Questions

1. **Exact tolerance bands per metric**
   - What we know: UI-SPEC proposes defaults (0.5 kg, 500 steps, ±3 bpm, etc. at lines 131-137)
   - What's unclear: Whether these are empirically tuned to user expectations or rough estimates
   - Recommendation: Use proposed defaults in Phase 3 planning; refine after Phase 3 UAT with real user feedback

2. **Weight streak vs. on-pace color calculation conflict**
   - What we know: D-15 defines weight streak as "moved toward goal vs. previous value"; D-10 defines on-pace color as "projected pace vs. target"
   - What's unclear: Precise logic for "steady within tolerance" in streak calculation (how much can weight fluctuate and still count as moving toward goal?)
   - Recommendation: Planner defines a small tolerance band (e.g., ±0.2 kg) for "steady"; document in code comment per metric

3. **Personal best storage schema**
   - What we know: PBs must be flagged on dashboard tile and chart screen; detected retroactively and forward
   - What's unclear: Whether to store PBs in a dedicated `personalBests` table or cache in localStorage or both
   - Recommendation: Use a Dexie table for durability; cache in localStorage for first-load performance (lookup by metric only)

4. **Exercise proxy weekly count edge case**
   - What we know: D-07 says tile shows "N/[target] this week"; D-01 says weekly session target
   - What's unclear: What is "this week" — Mon-Sun, Sun-Sat, or rolling 7-day window?
   - Recommendation: Use Mon-Sun ISO week (date-fns `getWeek` / `getISOWeek`) for predictability; document clearly in component

## Environment Availability

All required tools and libraries are already installed per Phase 1/2:

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Dexie.js | Schema v3, targets/exerciseLog tables | ✓ | 4.0+ | — |
| date-fns | Streak/pace date calculations | ✓ | 3.0+ | — |
| Recharts | Target reference line (ReferenceLine) | ✓ | 2.10+ | — |
| Tailwind CSS | Progress bar, status badge utilities | ✓ | 3.4+ | — |
| React 19 | Hooks (useEffect, useState) | ✓ | 19.x | — |
| TypeScript | Type safety (MetricType, interfaces) | ✓ | 5.3+ | — |

**No missing dependencies.** Phase 3 uses only approved, installed libraries.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (inherited from Phase 2) |
| Config file | `vite.config.ts` with defineConfig + test block |
| Quick run command | `npm run test:unit` (phase-level smoke tests) |
| Full suite command | `npm run test:unit && npm run test:integration` (all Phase 1–3 tests) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TARG-01 | User can set target value and date | unit | `vitest run src/utils/targetCalcs.test.ts -t "set target"` | ❌ Wave 0 |
| TARG-02 | App calculates and displays projected pace | unit | `vitest run src/utils/targetCalcs.test.ts -t "pace projection"` | ❌ Wave 0 |
| TARG-03 | Target progress shown as progress bar with percentage | unit | `vitest run src/components/Dashboard/MetricTile.test.tsx -t "progress bar"` | ❌ Wave 0 |
| TARG-04 | Metrics color-coded red/yellow/green based on proximity | unit | `vitest run src/utils/targetCalcs.test.ts -t "on-track status"` | ❌ Wave 0 |
| TARG-05 | Streak shows consecutive days target was met | unit | `vitest run src/hooks/useStreakData.test.ts` | ❌ Wave 0 |
| DASH-03 | Dashboard shows active streak count for each metric with target | integration | `vitest run src/components/Dashboard/Dashboard.test.tsx -t "streak display"` | ❌ Wave 0 |
| PB-01 | App automatically detects personal bests | unit | `vitest run src/utils/targetCalcs.test.ts -t "personal best detection"` | ❌ Wave 0 |
| PB-02 | Personal best entries are flagged in chart and tile views | integration | `vitest run src/components/Charts/MetricChart.test.tsx -t "PB badge"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:unit` (phase-level validation)
- **Per wave merge:** `npm run test:unit && npm run test:integration` (full regression)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/utils/targetCalcs.test.ts` — test fitLinearTrend(), projectPace(), getOnTrackStatus(), detectPersonalBest()
- [ ] `src/hooks/useStreakData.test.ts` — test streak calculation per metric, edge cases (7-day boundary, gaps, weight direction)
- [ ] `src/hooks/useTargetData.test.ts` — test CRUD: set, edit, delete target; verify Dexie v3 schema
- [ ] `src/hooks/useExerciseLogData.test.ts` — test daily boolean toggle, weekly count aggregation
- [ ] `src/components/Dashboard/MetricTile.test.tsx` — extend Phase 2 tests to cover progress bar, status badge, streak display (conditional on target)
- [ ] `src/components/Charts/MetricChart.test.tsx` — extend Phase 2 tests to cover target reference line, status badge, PB badge
- [ ] `src/components/Dashboard/ExerciseProxyTile.test.tsx` — NEW tile tests: count display, weekly toggle, streak
- [ ] `src/db/schema.test.ts` — NEW: test Dexie v3 migration (targets, exerciseLog, personalBests tables exist and are queryable)
- [ ] Framework install: Dexie.js and date-fns are already in test environment (inherited from Phase 2)

*(All gaps are Wave 0 because tests don't yet exist; planner schedules test tasks before implementation)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A — single-user app; no accounts |
| V3 Session Management | no | N/A — no sessions |
| V4 Access Control | no | N/A — no multi-user or role-based controls |
| V5 Input Validation | yes | Target value range validation (see table below); date picker prevents past dates |
| V6 Cryptography | no | N/A — no sensitive data requiring encryption at rest (all local; user owns device) |

### Input Validation for Targets

| Input | Validation Rule | Reason |
|-------|-----------------|--------|
| Target value (numeric) | Must be in valid range per metric (e.g., 0–500 kg for weight) | Prevent nonsensical targets (negative weight, 10,000 steps) |
| Target date | Must be in future (after today) | D-10: prevents calculating pace to a past date |
| Sleep range (min/max) | Must satisfy min < max; both in 0–24 hour range | D-04: validate range targets |
| Heart rate ceiling | Must be > 0 and < 300 bpm (physiologically sane) | D-03: validate ceiling targets |

**Implementation:** Validate in target form before persisting to Dexie; show error toast per Phase 1/2 pattern (sonner).

### No Known Threat Patterns for This Phase

Phase 3 adds no external APIs, file uploads, or user-supplied content (targets are numeric/date only). All data is local. Threat model unchanged from Phase 1/2.

## Sources

### Primary (HIGH confidence)

- **Context7: Dexie.js documentation** — schema versioning and additive migrations (lines 1-71 of `src/db/schema.ts` verified via direct codebase read)
- **Official code read: useChartData.ts (lines 92-148), useBmiData.ts (lines 23-74)** — hook pattern for Dexie-backed data fetching with cancellation
- **Official code read: BmiSection.tsx (lines 92-109)** — Recharts ReferenceLine usage pattern
- **Phase 3 CONTEXT.md (lines 14-122)** — locked decisions (D-01 through D-22) and canonical references
- **Phase 3 UI-SPEC.md (lines 119-137, 232-241)** — on-track status colors and visual treatments

### Secondary (MEDIUM confidence)

- **Standard mathematical practice** — linear least-squares regression for trend fitting (widely used in time-series analysis, no novel application)
- **date-fns official docs** — date arithmetic (differenceInDays, subDays, format) confirmed in use throughout Phase 2 codebase
- **Tailwind CSS utilities** — emerald-500, amber-500, red-500, gray-500 for status colors (standard Tailwind naming)

### Tertiary (LOW confidence)

- **Phase 2 Architecture patterns** — assumes extensions to MetricTile and MetricChart follow same state/props patterns (verified via code read but subject to refactoring)

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — all technologies already approved and installed in Phase 1/2
- **Architecture:** HIGH — reuses proven hook pattern, additive schema migration, established component structure
- **Algorithms:** HIGH — linear regression, streak calculation, personal best detection are straightforward (no novel techniques)
- **Pitfalls:** HIGH — common mistakes documented in CONTEXT.md (D-01 through D-22) and empirically validated in Phase 2 UAT
- **UI patterns:** HIGH — progress bars, status badges, reference lines are all in UI-SPEC and follow shadcn/Tailwind conventions

**Research date:** 2026-09-18
**Valid until:** 2026-10-02 (14 days; Phase 3 implementation should start immediately)

---

*Phase 3: Targets & Goals*
*Research completed: 2026-09-18*
