# Phase 2: Charts & Visualization — Pattern Map

**Mapped:** 2026-09-14
**Files analyzed:** 16 (13 new, 3 modified)
**Analogs found:** 16 / 16

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/Charts/MetricChart.tsx` | component | request-response | `src/components/Log/WeightForm.tsx` | role-match (screen component with useParams + navigate) |
| `src/components/Charts/PeriodSelector.tsx` | component | request-response | `src/components/ui/button.tsx` | role-match (button group reusing Button variants) |
| `src/components/Charts/ChartHeader.tsx` | component | transform | `src/components/Dashboard/MetricTile.tsx` | partial (display-only with computed values) |
| `src/components/Charts/CustomTooltip.tsx` | component | request-response | `src/components/Dashboard/MetricTile.tsx` | partial (dark-mode Tailwind classes, zinc palette) |
| `src/components/Charts/Sparkline.tsx` | component | request-response | `src/components/Dashboard/MetricTile.tsx` | role-match (embedded in tile, uses metric accent color) |
| `src/components/Charts/ActivityHeatmap.tsx` | component | CRUD | `src/components/Dashboard/Dashboard.tsx` | partial (grid layout, CSS class composition) |
| `src/components/Charts/BmiSection.tsx` | component | transform | `src/components/Dashboard/MetricTile.tsx` | partial (read-only display section with computed value) |
| `src/hooks/useChartData.ts` | hook | CRUD | `src/components/Dashboard/MetricTile.tsx` (loadTileData) | exact (same Dexie `.where("date").between()` pattern, useEffect + async) |
| `src/hooks/useHeatmapData.ts` | hook | CRUD | `src/components/Dashboard/MetricTile.tsx` (loadTileData) | role-match (multi-table Dexie query in useEffect) |
| `src/hooks/useBmiData.ts` | hook | transform | `src/components/Dashboard/MetricTile.tsx` (loadTileData) | partial (useEffect + async + localStorage read) |
| `src/utils/chartColors.ts` | utility | transform | `src/utils/constants.ts` | exact (parallel map extending MetricType → hex) |
| `src/utils/aggregation.ts` | utility | transform | `src/components/Dashboard/MetricTile.tsx` (inline averages) | role-match (same reduce + map patterns, extracted into utility) |
| `src/utils/bmi.ts` | utility | transform | `src/utils/constants.ts` | partial (pure utility file with typed exports) |
| `src/App.tsx` | config | request-response | `src/App.tsx` | exact (add Route alongside existing routes) |
| `src/components/Dashboard/MetricTile.tsx` | component | request-response | `src/components/Dashboard/MetricTile.tsx` | exact (modify onClick + add Sparkline child) |
| `src/components/Dashboard/Dashboard.tsx` | component | request-response | `src/components/Dashboard/Dashboard.tsx` | exact (append ActivityHeatmap below grid) |

---

## Pattern Assignments

### `src/components/Charts/MetricChart.tsx` (component, request-response)

**Analog:** `src/components/Log/WeightForm.tsx` + `src/components/Log/LogScreen.tsx`

**Imports pattern** (`src/components/Log/LogScreen.tsx` lines 1–9):
```typescript
import { useNavigate, useParams } from "react-router-dom"
import { METRIC_CONFIG } from "@/utils/constants"
import { useAppStore } from "@/store/appStore"
```

**useParams + navigate pattern** (`src/components/Log/LogScreen.tsx` lines 12–14):
```typescript
const { metric } = useParams<{ metric?: string }>()
const navigate = useNavigate()
const setSelectedMetric = useAppStore((s) => s.setSelectedMetric)
```

**Screen container pattern** (`src/components/Log/WeightForm.tsx` lines 95–97):
```typescript
return (
  <div className="px-4 pt-6">
    <h1 className="text-xl font-semibold mb-4">...</h1>
```

**Back button pattern** (use `navigate(-1)` — same pattern as `navigate("/log")` in WeightForm line 73):
```typescript
const navigate = useNavigate()
// back button: onClick={() => navigate(-1)}
```

**Local state pattern** (`src/components/Log/WeightForm.tsx` lines 24–28):
```typescript
const [value, setValue] = useState("")
const [isLoading, setIsLoading] = useState(false)
// For chart screen: const [period, setPeriod] = useState<'W' | 'M' | 'Y'>('W')
```

**FAB pattern** — floating action button navigating to log:
```typescript
// onClick: () => navigate("/log/" + metric)
// Tailwind: fixed bottom-6 right-6 z-10 rounded-full bg-white text-black p-4 shadow-lg
```

---

### `src/components/Charts/PeriodSelector.tsx` (component, request-response)

**Analog:** `src/components/ui/button.tsx`

**Segmented button group pattern** — reuse Button component with active/inactive variant:
```typescript
import { Button } from "@/components/ui/button"

// Active period gets variant="default", inactive gets variant="outline"
const periods = ['W', 'M', 'Y'] as const
{periods.map((p) => (
  <Button
    key={p}
    variant={selected === p ? "default" : "outline"}
    size="sm"
    onClick={() => onSelect(p)}
  >
    {p}
  </Button>
))}
```

**Button variants available** (`src/components/ui/button.tsx` lines 12–22):
- `default` — white/primary fill (use for active period)
- `outline` — bordered transparent (use for inactive periods)
- `ghost` — hover only (alternative for inactive)

---

### `src/components/Charts/ChartHeader.tsx` (component, transform)

**Analog:** `src/components/Dashboard/MetricTile.tsx`

**Accent color display pattern** (`src/components/Dashboard/MetricTile.tsx` lines 186–188):
```typescript
<span className={`text-xs uppercase tracking-widest mb-2 ${accentColor}`}>
  {label}
</span>
```

**Value display pattern** (lines 198–202):
```typescript
<div className="flex items-baseline gap-1">
  <span className="text-4xl font-semibold text-white leading-none">{value}</span>
  <span className="text-sm text-gray-400">{unit}</span>
</div>
```

**Summary stat pattern** — `Avg 73.4 (71.0 – 74.8) ↑`:
```typescript
// trend arrow: use lucide-react ArrowUp / ArrowDown / Minus icons
import { ArrowUp, ArrowDown, Minus } from "lucide-react"

function trendArrow(current: number, previous: number) {
  const delta = (current - previous) / previous
  if (delta > 0.01) return <ArrowUp className="size-4 text-emerald-500" />
  if (delta < -0.01) return <ArrowDown className="size-4 text-red-500" />
  return <Minus className="size-4 text-zinc-400" />
}
```

---

### `src/components/Charts/CustomTooltip.tsx` (component, request-response)

**Analog:** `src/components/Dashboard/MetricTile.tsx` (zinc palette + dark mode classes)

**Zinc dark palette** (from MetricTile lines 182–184):
```typescript
// bg-zinc-950 for deepest background (tile background)
// bg-zinc-900 for input/card (WeightForm line 119)
// text-gray-400 for secondary text
// text-white for primary values
```

**Tooltip pattern** (from RESEARCH.md Pattern 5):
```typescript
import { TooltipProps } from 'recharts'

interface CustomTooltipProps extends TooltipProps<number, string> {
  unit: string
}

function CustomTooltip({ active, payload, label, unit }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-lg text-sm">
      <p className="text-zinc-400 text-xs mb-1">{label}</p>
      <p className="text-white font-semibold">
        {payload[0].value?.toFixed(1)} {unit}
      </p>
    </div>
  )
}
```

**Dark mode:** Tailwind `dark:` classes work here because tooltip renders as HTML (not SVG). No need to read Zustand darkMode state — Tailwind's dark variant handles it automatically via `document.documentElement.classList`.

---

### `src/components/Charts/Sparkline.tsx` (component, request-response)

**Analog:** `src/components/Dashboard/MetricTile.tsx` (embedded child component, uses metric accent color)

**Accent color prop pattern** (MetricTile lines 8–14):
```typescript
interface MetricTileProps {
  metric: MetricType
  accentColor: string   // Tailwind class — but Sparkline needs hex for Recharts stroke
  accentBorder: string
}
// For Sparkline: import { CHART_HEX } from "@/utils/chartColors" to get hex value
```

**Empty state pattern** (MetricTile lines 193–195):
```typescript
// When no data: show text instead of broken chart widget
<span className="text-sm text-gray-400">Start logging to see trends</span>
```

**Sparkline Recharts pattern** (from RESEARCH.md Pattern 8 — no axes):
```typescript
import { ResponsiveContainer, LineChart, Line } from 'recharts'

<ResponsiveContainer width="100%" height={40}>
  <LineChart data={data14d}>
    <Line
      type="monotone"
      dataKey="value"
      stroke={accentHex}
      strokeWidth={1.5}
      dot={false}
    />
  </LineChart>
</ResponsiveContainer>
// No XAxis, YAxis, CartesianGrid, Tooltip — purely visual trend indicator
```

---

### `src/components/Charts/ActivityHeatmap.tsx` (component, CRUD)

**Analog:** `src/components/Dashboard/Dashboard.tsx`

**Grid layout pattern** (Dashboard.tsx lines 17–27):
```typescript
<div className="grid grid-cols-2 gap-2">
  {/* For heatmap: grid with 7 rows, auto-flow column */}
  {/* style={{ gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column' }} */}
</div>
```

**Heatmap container pattern**:
```typescript
// Horizontal scroll on small screens (Pitfall 6 from RESEARCH.md)
<div className="overflow-x-auto">
  <div
    className="grid gap-[2px]"
    style={{
      gridTemplateRows: 'repeat(7, 10px)',
      gridAutoFlow: 'column',
      minWidth: '600px',
    }}
  >
    {cells.map((cell) => (
      <div
        key={cell.date}
        className={`w-[10px] h-[10px] rounded-sm ${heatmapCellClass(cell.count)}`}
        title={cell.date}
      />
    ))}
  </div>
</div>
```

**Heatmap intensity classes** (from CONTEXT.md D-10 / RESEARCH.md Code Examples):
```typescript
function heatmapCellClass(count: number): string {
  if (count === 0) return 'bg-zinc-800'
  if (count <= 2)  return 'bg-emerald-900'
  if (count <= 4)  return 'bg-emerald-600'
  return 'bg-emerald-500'
}
```

**Tooltip on cell tap** — use state to track hovered cell + render tooltip div:
```typescript
const [tooltip, setTooltip] = useState<{ date: string; metrics: string[] } | null>(null)
// onClick on cell: setTooltip({ date: cell.date, metrics: cell.metrics })
```

---

### `src/components/Charts/BmiSection.tsx` (component, transform)

**Analog:** `src/components/Dashboard/MetricTile.tsx` (read-only display with computed value + variant C empty state)

**Empty/no-data state pattern** (MetricTile lines 193–195):
```typescript
// When height not set:
<span className="text-sm text-gray-400">Set height in Settings to see BMI</span>
```

**Value display pattern** (MetricTile lines 198–202):
```typescript
<div className="flex items-baseline gap-1">
  <span className="text-4xl font-semibold text-white leading-none">{bmi.toFixed(1)}</span>
  <span className="text-sm text-gray-400">{category}</span>
</div>
```

**Section header pattern** (MetricTile line 187):
```typescript
<span className="text-xs uppercase tracking-widest mb-2 text-blue-500">BMI</span>
```

**Mini chart** — same Recharts LineChart pattern as Sparkline but taller (height={120}), with YAxis for readability.

---

### `src/hooks/useChartData.ts` (hook, CRUD)

**Analog:** `src/components/Dashboard/MetricTile.tsx` — `loadTileData` function + `useEffect`

**useEffect + async pattern** (MetricTile lines 170–172):
```typescript
useEffect(() => {
  loadTileData(metric, currentDate).then(setTileData)
}, [metric, currentDate])
```

**Dexie date range query pattern** (MetricTile lines 31–36):
```typescript
const todayEntries = await db.weights
  .where("date")
  .equals(currentDate)
  .toArray()
```

**For range queries** (same API, different method — from RESEARCH.md Pattern 1):
```typescript
import { subDays, format } from 'date-fns'

const today = format(new Date(), 'yyyy-MM-dd')
const start = format(subDays(new Date(), daysBack), 'yyyy-MM-dd')
// YYYY-MM-DD strings compare correctly lexicographically
const entries = await db.weights
  .where('date')
  .between(start, today, true, true)  // inclusive both ends
  .toArray()
```

**Hook return pattern** (follow MetricTile state pattern, lines 168–172):
```typescript
const [data, setData] = useState<DailyPoint[]>([])
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  let cancelled = false
  async function load() {
    setIsLoading(true)
    try {
      // ... Dexie query + aggregation
      if (!cancelled) setData(result)
    } finally {
      if (!cancelled) setIsLoading(false)
    }
  }
  load()
  return () => { cancelled = true }
}, [metric, period])

return { data, isLoading }
```

---

### `src/hooks/useHeatmapData.ts` (hook, CRUD)

**Analog:** `src/components/Dashboard/MetricTile.tsx` (multi-case switch over all metric tables)

**Multi-table query pattern** (MetricTile lines 30–155 — switch over all 6 tables):
```typescript
// Query all 6 tables simultaneously for a date range
const [weights, sleepEntries, stepEntries, waterEntries, heartRates, temperatures] =
  await Promise.all([
    db.weights.where('date').between(start, today, true, true).toArray(),
    db.sleepEntries.where('date').between(start, today, true, true).toArray(),
    db.stepEntries.where('date').between(start, today, true, true).toArray(),
    db.waterEntries.where('date').between(start, today, true, true).toArray(),
    db.heartRates.where('date').between(start, today, true, true).toArray(),
    db.temperatures.where('date').between(start, today, true, true).toArray(),
  ])
```

**Error handling pattern** (MetricTile lines 153–155):
```typescript
} catch {
  return { variant: "c", value: "", error: true }
}
// For hook: setError(true); setData(new Map())
```

---

### `src/hooks/useBmiData.ts` (hook, transform)

**Analog:** `src/components/Log/WeightForm.tsx` (useEffect + async + localStorage read)

**localStorage read pattern** (WeightForm line 21 for store; Settings.tsx line 11 for height key):
```typescript
// Height key: 'myhealth-height' [VERIFIED: src/components/Settings/Settings.tsx:11]
const heightCm = parseFloat(localStorage.getItem('myhealth-height') ?? '')
if (!heightCm || heightCm <= 0) return // guard before BMI calculation
```

**useEffect + async load pattern** (WeightForm lines 30–51):
```typescript
useEffect(() => {
  async function load() {
    try {
      // query + transform
    } catch {
      // set error state
    }
  }
  load()
}, [dependency])
```

---

### `src/utils/chartColors.ts` (utility, transform)

**Analog:** `src/utils/constants.ts`

**Existing Tailwind class map** (`src/utils/constants.ts` lines 1–38 — full file):
```typescript
export const METRIC_CONFIG = {
  weight:      { accentColor: "text-blue-500",    accentBorder: "border-blue-500" },
  sleep:       { accentColor: "text-violet-500",  accentBorder: "border-violet-500" },
  steps:       { accentColor: "text-emerald-500", accentBorder: "border-emerald-500" },
  water:       { accentColor: "text-cyan-500",    accentBorder: "border-cyan-500" },
  heartRate:   { accentColor: "text-red-500",     accentBorder: "border-red-500" },
  temperature: { accentColor: "text-orange-500",  accentBorder: "border-orange-500" },
} as const
```

**Parallel hex map to add** (same file or new `chartColors.ts`):
```typescript
import type { MetricType } from "@/store/appStore"

// Hex equivalents of Tailwind accent colors — for Recharts SVG stroke/fill props
// (Tailwind v4 has no JS theme() resolver; hex values must be hardcoded)
export const CHART_HEX: Record<MetricType, string> = {
  weight:      '#3b82f6',  // blue-500
  sleep:       '#8b5cf6',  // violet-500
  steps:       '#10b981',  // emerald-500
  water:       '#06b6d4',  // cyan-500
  heartRate:   '#ef4444',  // red-500
  temperature: '#f97316',  // orange-500
}
```

**File structure pattern** (`src/utils/constants.ts` line 38):
```typescript
} as const
// End with: export type MetricColorKey = keyof typeof CHART_HEX  (optional)
```

---

### `src/utils/aggregation.ts` (utility, transform)

**Analog:** `src/components/Dashboard/MetricTile.tsx` (inline average patterns, lines 37–40, 116–118)

**Inline daily average pattern extracted from MetricTile** (lines 37–40):
```typescript
const avg = todayEntries.reduce((sum, e) => sum + e.value, 0) / todayEntries.length
// Generalized:
function dailyAverage(entries: { value: number }[]): number {
  return entries.reduce((sum, e) => sum + e.value, 0) / entries.length
}
```

**groupByDay pattern** (generalized from MetricTile switch cases):
```typescript
interface DailyPoint { date: string; value: number }

function groupByDay(
  entries: { date: string; value: number }[],
  mode: 'average' | 'sum' | 'last'
): DailyPoint[] {
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
      value: mode === 'sum'
        ? vals.reduce((s, v) => s + v, 0)
        : vals.reduce((s, v) => s + v, 0) / vals.length,
    }))
}
```

---

### `src/utils/bmi.ts` (utility, transform)

**Analog:** `src/utils/constants.ts` (pure utility module, typed exports, `as const`)

**Module pattern** (`src/utils/constants.ts` lines 1, 38):
```typescript
// Pure functions, no imports from db or store
export function calcBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return weightKg / (heightM * heightM)
}

// Categories verbatim from CONTEXT.md ## Specific Ideas
export function bmiCategory(bmi: number): 'Underweight' | 'Normal' | 'Overweight' | 'Obese' {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25)   return 'Normal'
  if (bmi < 30)   return 'Overweight'
  return 'Obese'
}
```

---

### `src/App.tsx` (modified — add `/chart/:metric` route)

**Analog:** `src/App.tsx` itself

**Existing route pattern** (`src/App.tsx` lines 25–31):
```typescript
<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/log" element={<LogScreen />} />
  <Route path="/log/:metric" element={<LogScreen />} />
  <Route path="/settings" element={<Settings />} />
</Routes>
```

**Add chart route** (insert after `/log/:metric`, before `/settings`):
```typescript
<Route path="/chart/:metric" element={<MetricChart />} />
```

**Import pattern** (`src/App.tsx` lines 4–9):
```typescript
import MetricChart from "./components/Charts/MetricChart"
// Add alongside other page-level imports
```

---

### `src/components/Dashboard/MetricTile.tsx` (modified)

**Analog:** `src/components/Dashboard/MetricTile.tsx` itself

**handleTap change** (line 174–177 — currently navigates to `/log/:metric`):
```typescript
// Current:
const handleTap = () => {
  setSelectedMetric(metric)
  navigate("/log/" + metric)
}

// Change to (D-01):
const handleTap = () => {
  navigate("/chart/" + metric)
}
// setSelectedMetric call can be removed (chart screen uses useParams)
```

**Add Sparkline** — after the value display section (inside the `<button>` return, below variant blocks):
```typescript
import Sparkline from "@/components/Charts/Sparkline"

// Add as last child inside <button> element:
<Sparkline metric={metric} accentHex={CHART_HEX[metric]} />
```

---

### `src/components/Dashboard/Dashboard.tsx` (modified)

**Analog:** `src/components/Dashboard/Dashboard.tsx` itself

**Current structure** (lines 10–29 — append ActivityHeatmap after closing `</div>` of grid):
```typescript
// Current last element is closing </div> of the grid div
// Add after the grid:
import ActivityHeatmap from "@/components/Charts/ActivityHeatmap"

// Inside return, after the grid div:
<div className="mt-6">
  <ActivityHeatmap />
</div>
```

---

## Shared Patterns

### Dexie Data Fetching
**Source:** `src/components/Dashboard/MetricTile.tsx` lines 25–172
**Apply to:** `useChartData.ts`, `useHeatmapData.ts`, `useBmiData.ts`

All data fetching follows the same pattern:
1. Define an async function outside the component/hook
2. Call it inside `useEffect` with `.then(setter)` or `await` inside try/catch
3. Use `db.TABLE.where("date").equals(date)` for single-day, `.between(start, end, true, true)` for ranges
4. Return typed data or an error state object (`{ variant: "c", error: true }`)

### Tailwind Dark Theme Palette
**Source:** All existing components (`MetricTile.tsx`, `WeightForm.tsx`)
**Apply to:** All new components

| Use | Class |
|-----|-------|
| Page/screen background | `px-4 pt-6` wrapper |
| Card background | `bg-zinc-950` (tiles) / `bg-zinc-900` (inputs, tooltips) |
| Card border | `border-zinc-700` |
| Primary text | `text-white` |
| Secondary text | `text-gray-400` |
| Muted element | `text-zinc-400` |

### Import Aliases
**Source:** All existing files
**Apply to:** All new files

```typescript
// Always use @/ alias for src imports:
import { db } from "@/db/schema"
import { useAppStore } from "@/store/appStore"
import { METRIC_CONFIG } from "@/utils/constants"
import { cn } from "@/lib/utils"
```

### useAppStore Selector Pattern
**Source:** `src/components/Dashboard/MetricTile.tsx` lines 166–167
**Apply to:** Any component needing store state

```typescript
// Use selector functions (one per value) to avoid unnecessary re-renders:
const currentDate = useAppStore((s) => s.currentDate)
const darkMode = useAppStore((s) => s.darkMode)
```

### Screen Container Pattern
**Source:** `src/components/Log/WeightForm.tsx` lines 94–97
**Apply to:** `MetricChart.tsx`

```typescript
return (
  <div className="px-4 pt-6">
    <h1 className="text-xl font-semibold mb-4">...</h1>
    {/* content */}
  </div>
)
```

---

## No Analog Found

All files have close analogs in the codebase. No files require falling back to RESEARCH.md-only patterns.

---

## Critical Notes for Planner

1. **Recharts not installed yet.** Every chart task must be preceded by or gated on: `npm install recharts@^3.10.1 react-is@^19`. Plan a smoke-test task immediately after install (render one `<LineChart>` with dummy data, verify non-empty SVG in browser).

2. **Tailwind hex hardcoding is required.** `src/utils/chartColors.ts` must be created before any Recharts stroke/fill props are used. Tailwind v4 has no JS `theme()` resolver.

3. **Sleep duration needs unit conversion.** Sleep is stored as minutes (`duration` field in `db/schema.ts` line 16). Chart Y-axis must show decimal hours: `value / 60`. Tooltip shows `${(value).toFixed(1)}h`.

4. **Date string parsing.** Use `new Date(date + 'T00:00:00')` or `parseISO` from date-fns consistently to avoid timezone shift (RESEARCH.md Pitfall 3).

5. **BMI height guard.** `useBmiData.ts` must guard `if (!heightCm || heightCm <= 0)` before any division (RESEARCH.md Pitfall 5).

6. **ResponsiveContainer height must be fixed pixels.** Never use `height="100%"` — always `height={220}` or similar pixel value (RESEARCH.md Pitfall 7).

---

## Metadata

**Analog search scope:** `src/components/`, `src/utils/`, `src/store/`, `src/db/`, `src/App.tsx`
**Files scanned:** 10 source files read
**Pattern extraction date:** 2026-09-14
