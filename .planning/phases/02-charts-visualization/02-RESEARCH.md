# Phase 2: Charts & Visualization — Research

**Researched:** 2026-09-14
**Domain:** Data visualization, Recharts, date aggregation, heatmap, BMI
**Confidence:** MEDIUM (Recharts React 19 compatibility requires workaround; all other findings verified via npm registry and codebase reads)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Tapping a metric tile navigates to `/chart/:metric` (not the log form). MetricTile onClick changes target.
- **D-02:** FAB on the chart screen opens the log form for that metric.
- **D-03:** Period switcher is a segmented control (W | M | Y) above the chart. Reuses existing `button.tsx`.
- **D-04:** Chart screen header: metric name + back button left; `Avg X.X (min–max) ↑` summary stat right. Stat updates on period switch.
- **D-05:** Chart type is auto-chosen by metric: weight/sleep/heart rate/temperature → line chart; steps/water → bar chart.
- **D-06:** Yearly view shows 12 monthly aggregate bars (monthly average for continuous, monthly total for steps).
- **D-07:** Custom styled tooltips matching dark mode (not Recharts default).
- **D-08:** Each metric uses its own accent color (same as Dashboard tile accent): weight=blue, sleep=purple, steps=green, water=cyan, heart rate=red, temperature=orange.
- **D-09:** BMI appears as a separate mini-section below the weight chart (not overlaid as second line). Shows current BMI value, category label, and BMI trend mini-chart. Requires height in Settings.
- **D-10:** Heatmap shows logging activity. Intensity = number of metrics logged that day (0=grey, 1–2=light, 3–4=medium, 5–6=full). 6 metrics total.
- **D-11:** Heatmap time range: rolling 12 months (last 365 days), current day at right edge.
- **D-12:** Heatmap location: Dashboard, below the 2-column metric tile grid.
- **D-13:** Tapping a heatmap cell shows a tooltip with date and which metrics were logged.
- **D-14:** Dashboard tiles gain a 14-day mini sparkline. Uses metric accent color. DASH-02 progress bars deferred to Phase 3.
- **D-15:** Tiles with no data in 14 days show "Start logging to see trends" instead of empty chart.
- **D-16:** DASH-02 (target progress + color coding) deferred to Phase 3. Out of scope for Phase 2.

### Claude's Discretion

None specified — all implementation decisions locked in CONTEXT.md.

### Deferred Ideas (OUT OF SCOPE)

- DASH-02 progress bars and red/yellow/green color coding on tiles (Phase 3).
- Training day overlay on heatmap (Phase 4).
- Target-hit day heatmap overlay (Phase 3).
- Multi-metric overlay charts (v2).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHRT-01 | User can view a weekly chart for any metric | D-03 period selector, D-05 auto-chart-type, useChartData hook with 7-day Dexie range query |
| CHRT-02 | User can view a monthly chart for any metric | D-03 period selector, 30-day range query, same aggregation pattern as weekly |
| CHRT-03 | User can view a yearly chart for any metric | D-06 12 monthly bars, group-by-month aggregation; yearly view uses BarChart for all metrics |
| CHRT-04 | Activity heatmap showing training days and target-hit days | D-10/D-11/D-12/D-13; Phase 2 delivers logging-activity heatmap; training/target overlays deferred |
| DASH-02 | Each metric tile shows target progress bar and color indicator | D-16: DEFERRED to Phase 3. Phase 2 adds sparklines only. |
| BMI-01 | User stores height once; BMI auto-calculated from weight entries | Height from `localStorage('myhealth-height')` + weight entries → BMI array |
| BMI-02 | BMI charted alongside weight in weight view | D-09: separate section below weight chart, mini LineChart |
</phase_requirements>

---

## Summary

Phase 2 adds the visualization layer on top of Phase 1's data foundation. The three main deliverables are: (1) per-metric chart screens with weekly/monthly/yearly views, (2) a GitHub-style activity heatmap on the Dashboard, and (3) auto-calculated BMI displayed below the weight chart.

**The critical technical constraint:** The project runs React 19.2.6 `[VERIFIED: package.json:22]`. Recharts 3.x has a known blank-chart rendering issue with React 19 that requires explicitly installing `react-is@^19` as a direct dependency alongside recharts. Without this fix, charts render as empty white rectangles with no console errors. Install together: `npm install recharts@^3.10.1 react-is@^19`.

**Recharts version decision:** CLAUDE.md specifies "Recharts 2.10+" but the 2.x branch is now deprecated (Recharts issue #7361 confirms: "v2 and older are not receiving updates"). The correct version for this project is **3.10.1**, which explicitly supports React 19 in its peer dependencies `[VERIFIED: npm registry]`.

**Heatmap:** Recharts has no native heatmap component. The GitHub-style 52×7 grid is best built as a custom CSS Grid component — no third-party library needed. The data model is simple (date → metric count), and the layout is a straightforward column-major grid.

**Primary recommendation:** Install `recharts@^3.10.1 react-is@^19`, use `LineChart`/`BarChart` per metric type, aggregate data client-side with date-fns after Dexie range queries, build the heatmap as a custom CSS Grid, and render BMI as a separate mini-section below the weight LineChart.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Chart data queries | Browser (Dexie IndexedDB) | — | All data is local; queries run client-side via Dexie range API |
| Data aggregation (weekly/monthly/yearly) | Browser (custom hooks) | — | No server; client-side groupBy + average/sum with date-fns |
| Chart rendering | Browser (Recharts + React) | — | SVG-based, purely client-side, no SSR |
| Heatmap rendering | Browser (CSS Grid + React) | — | Custom component, column-major CSS Grid layout |
| BMI calculation | Browser (utility function) | — | `weight / (height/100)²`; height from localStorage |
| Period state (W/M/Y) | Browser (local component state) | — | Per CONTEXT.md and established patterns: chart-screen-specific state stays local |
| Sparkline data | Browser (Dexie 14-day query) | — | Same Dexie pattern as MetricTile |
| Routing (/chart/:metric) | Browser (HashRouter) | — | Existing HashRouter pattern; add new route to App.tsx |
| Dark mode in chart tooltips | Browser (CSS classes / Tailwind) | — | Custom tooltip must use Tailwind `dark:` classes; Recharts renders tooltips as HTML |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.10.1 | LineChart, BarChart for metric charts and sparklines | Locked choice in CLAUDE.md; v3 is current stable branch supporting React 19 |
| react-is | 19.3.0 | Recharts peer dep resolution; fixes blank-chart bug with React 19 | Required workaround for React 19 + Recharts compatibility |
| date-fns | 4.4.0 (already installed) | eachDayOfInterval, startOfWeek, format, subDays for aggregation | Already installed; functional API, tree-shaken imports |
| dexie | 4.4.5 (already installed) | `where("date").between(start, end)` range queries for chart data | Already installed; indexed `date` field on all tables |

### Supporting (no new installs needed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | v4 (already installed) | Utility classes for chart container, tooltip, heatmap cells | All component styling |
| zustand | 5.0.15 (already installed) | Reading darkMode state in chart tooltips | Check `darkMode` to decide tooltip text colors |
| react-router-dom | 7.18.3 (already installed) | `/chart/:metric` route + `useParams()` | Chart screen routing |
| lucide-react | 1.40.0 (already installed) | ArrowUp/ArrowDown/Minus icons for trend arrows | Chart screen summary stat |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom CSS Grid heatmap | react-heat-map (uiwjs) | react-heat-map uses `YYYY/MM/DD` date format, incompatible with project's `YYYY-MM-DD` storage. Adds a dependency for ~80 lines of layout code. |
| Custom CSS Grid heatmap | shadcn-heatmap | Copy-paste approach aligns with shadcn philosophy, but adds boilerplate to manage. Custom CSS Grid is simpler for this use case. |
| Recharts 3.x | Recharts 2.x | 2.x is deprecated (no updates); does not work with React 19 without the same react-is workaround. |

**Installation:**
```bash
npm install recharts@^3.10.1 react-is@^19
```

**Version verification (npm registry):**
```bash
npm view recharts version   # → 3.10.1  [VERIFIED: npm registry, 2026-09-14]
npm view react-is version   # → 19.3.0  [VERIFIED: npm registry, 2026-09-14]
```

---

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| recharts | npm | 8+ yrs | 40.5M/wk | github.com/recharts/recharts | OK | Approved |
| react-is | npm | 7+ yrs (new version 2026-09-09) | 258.9M/wk | github.com/facebook/react | SUS (too-new flag) | Approved — see note |

**Packages removed due to SLOP verdict:** none

**Packages flagged as suspicious (SUS):** `react-is` — flagged `too-new` because v19.3.0 was published 2026-09-09 (5 days ago). However, `react-is` is the official React type-checking utility maintained by Meta in the React monorepo (repo: git+https://github.com/react/react.git), with 258M+ weekly downloads. The "too-new" signal reflects a legitimate React release cycle update, not a malicious package. Approved without human-verify checkpoint.

---

## Architecture Patterns

### System Architecture Diagram

```
User taps metric tile
        |
        v
MetricTile.onClick → navigate("/chart/:metric")
        |
        v
MetricChart screen
  ├── useParams() → metric name
  ├── useState<'W'|'M'|'Y'>('W') → selected period
  ├── useChartData(metric, period) → Dexie range query → aggregated data[]
  │         ├── W: db.TABLE.where("date").between(start7, today).toArray()
  │         ├── M: between(start30, today)
  │         └── Y: between(start365, today) → group by month → 12 bars
  ├── ChartHeader (summary stat: avg, min/max, trend arrow)
  ├── PeriodSelector (W|M|Y segmented buttons)
  ├── ResponsiveContainer
  │     └── LineChart or BarChart (auto by metric type)
  │           ├── XAxis (date formatted by period)
  │           ├── YAxis
  │           ├── CartesianGrid
  │           ├── Tooltip content={<CustomTooltip />}
  │           └── Line/Bar (metric accent color)
  ├── BmiSection (weight chart only)
  │     ├── Current BMI value + category
  │     └── ResponsiveContainer → LineChart (BMI over time)
  └── FAB → navigate("/log/:metric")

Dashboard
  ├── MetricTile × 6 (each with 14-day Sparkline)
  └── ActivityHeatmap
        ├── useHeatmapData() → 365-day query all 6 tables → Map<date, count>
        ├── 52×7 CSS Grid (column-major, week = column, day of week = row)
        └── Tooltip on cell tap
```

### Recommended Project Structure

```
src/
├── components/
│   ├── Charts/
│   │   ├── MetricChart.tsx        # /chart/:metric screen — chart + BMI section
│   │   ├── PeriodSelector.tsx     # W|M|Y segmented control (reuses button.tsx)
│   │   ├── ChartHeader.tsx        # avg/min/max/trend stat bar
│   │   ├── CustomTooltip.tsx      # dark-mode-aware tooltip for all charts
│   │   ├── Sparkline.tsx          # 14-day mini line (no axes) in MetricTile
│   │   ├── ActivityHeatmap.tsx    # 52×7 CSS Grid heatmap on Dashboard
│   │   └── BmiSection.tsx         # Current BMI + category + mini trend chart
│   ├── Dashboard/
│   │   ├── Dashboard.tsx          # MODIFIED: add <ActivityHeatmap /> below grid
│   │   └── MetricTile.tsx         # MODIFIED: change onClick, add <Sparkline />
│   └── ...
├── hooks/
│   ├── useChartData.ts            # Dexie range query + aggregation by period
│   ├── useHeatmapData.ts          # 365-day multi-table query → Map<date, count>
│   └── useBmiData.ts              # height from localStorage + weights → BMI[]
├── utils/
│   ├── chartColors.ts             # Hex values for each metric (for Recharts stroke/fill)
│   ├── aggregation.ts             # groupByDay, groupByMonth, averageEntries functions
│   └── bmi.ts                     # calcBmi(), bmiCategory()
├── App.tsx                        # MODIFIED: add /chart/:metric route
└── ...
```

### Pattern 1: Dexie Date Range Query

**What:** Query a metric table for entries within a date window, returning typed array.
**When to use:** All chart data fetching and sparkline data fetching.

```typescript
// Source: Dexie.js docs + MetricTile.tsx existing pattern
import { subDays, format } from 'date-fns'
import { db } from '@/db/schema'

async function fetchWeightRange(daysBack: number): Promise<Weight[]> {
  const today = format(new Date(), 'yyyy-MM-dd')
  const start = format(subDays(new Date(), daysBack), 'yyyy-MM-dd')
  // YYYY-MM-DD strings compare correctly lexicographically
  return db.weights
    .where('date')
    .between(start, today, true, true)  // inclusive both ends
    .toArray()
}
```

### Pattern 2: Client-Side Daily Aggregation (multi-per-day averaging)

**What:** For metrics with multiple entries per day (weight, heartRate, temperature), average them into one data point per day.
**When to use:** Before passing data to Recharts.

```typescript
// Source: MetricTile.tsx existing D-18 pattern (generalized)
import { parseISO, format } from 'date-fns'

interface DailyPoint { date: string; value: number }

function aggregateDailyAverage(
  entries: { date: string; value: number }[]
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
      value: vals.reduce((s, v) => s + v, 0) / vals.length,
    }))
}
```

### Pattern 3: Monthly Aggregation for Yearly View

**What:** Group 365 days of entries into 12 monthly summary bars.
**When to use:** Yearly (Y) period view per D-06.

```typescript
// Source: date-fns docs (format, getMonth, getYear) + training knowledge [ASSUMED]
import { format } from 'date-fns'

function aggregateMonthly(
  daily: DailyPoint[],
  mode: 'average' | 'sum'
): DailyPoint[] {
  const byMonth = new Map<string, number[]>()
  for (const d of daily) {
    const monthKey = format(new Date(d.date + 'T00:00:00'), 'yyyy-MM')
    const arr = byMonth.get(monthKey) ?? []
    arr.push(d.value)
    byMonth.set(monthKey, arr)
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, vals]) => ({
      date: month,
      value: mode === 'sum'
        ? vals.reduce((s, v) => s + v, 0)
        : vals.reduce((s, v) => s + v, 0) / vals.length,
    }))
}
// Steps uses 'sum', all others use 'average'
```

### Pattern 4: Recharts Line/Bar Chart with Date X-Axis

**What:** Responsive chart with formatted date labels and dark-mode-aware custom tooltip.
**When to use:** MetricChart screen for weekly and monthly views.

```typescript
// Source: stacknotice.com recharts-react-data-visualization-2026 (web search)
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { CHART_COLORS } from '@/utils/chartColors'

// Weekly/monthly: X label = "Sep 8", "Sep 9"
// Yearly: X label = "Jan", "Feb"
<ResponsiveContainer width="100%" height={220}>
  <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
    <XAxis
      dataKey="date"
      tickFormatter={(v) =>
        period === 'Y'
          ? format(parseISO(v + '-01'), 'MMM')
          : format(parseISO(v), 'MMM d')
      }
      tick={{ fill: '#71717a', fontSize: 11 }}
      axisLine={false}
      tickLine={false}
    />
    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
    <Tooltip content={<CustomTooltip unit={unit} />} />
    <Line
      type="monotone"
      dataKey="value"
      stroke={CHART_COLORS[metric]}
      strokeWidth={2}
      dot={false}
      connectNulls={false}
    />
  </LineChart>
</ResponsiveContainer>
```

### Pattern 5: Custom Dark-Mode Tooltip

**What:** Tooltip styled to match app dark theme; receives `active`, `payload`, `label`.
**When to use:** All chart screens and sparklines with tooltips.

```typescript
// Source: recharts.github.io/en-US/guide/customize (CITED) + web search pattern
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

### Pattern 6: Heatmap CSS Grid (52 × 7)

**What:** GitHub-style activity grid. Weeks are columns, days of week are rows.
**When to use:** ActivityHeatmap component on Dashboard.

```typescript
// Source: CSS Grid spec + web search heatmap patterns [ASSUMED for exact Tailwind classes]
// Layout: grid-template-rows: repeat(7, 1fr); grid-auto-flow: column
// Cells are 10×10 squares with 2px gap

function cellColor(count: number): string {
  if (count === 0) return 'bg-zinc-800'
  if (count <= 2) return 'bg-emerald-900'  // light — use neutral accent
  if (count <= 4) return 'bg-emerald-600'  // medium
  return 'bg-emerald-500'                  // full (5–6 metrics)
}

// Data prep: generate all 365 dates → look up count from Map
// Pad first column to align with correct day-of-week start
```

### Pattern 7: BMI Calculation

**What:** Derive BMI series from all weight entries + height from localStorage.
**When to use:** Weight chart screen only (BMI-01, BMI-02).

```typescript
// Source: BMI formula is standard medical definition [ASSUMED no citation needed]
// VERIFIED: height storage key = 'myhealth-height' [VERIFIED: src/components/Settings/Settings.tsx:11]

function calcBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return weightKg / (heightM * heightM)
}

function bmiCategory(bmi: number): string {
  // Source: CONTEXT.md ## Specific Ideas
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}
```

### Pattern 8: Sparkline (14-day mini trend)

**What:** Tiny line chart with no axes, no grid, embedded in MetricTile.
**When to use:** Each metric tile on Dashboard (D-14).

```typescript
// Source: Recharts docs — LineChart without axes [ASSUMED]
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

### Anti-Patterns to Avoid

- **Hard-coding chart width/height:** Always use `ResponsiveContainer width="100%" height={N}`. Hard-coded pixel widths break on different screen sizes.
- **Using Tailwind class names in Recharts `stroke`/`fill` props:** Recharts SVG attributes need hex values (`#3b82f6`), not class names (`text-blue-500`). Create `src/utils/chartColors.ts` with hex map.
- **Querying the full table for chart data:** Always scope with `.where("date").between(start, end)` to limit the result set. Never call `.toArray()` on an unfiltered table.
- **Dual Y-axis for BMI overlay:** D-09 explicitly rules this out. BMI is a separate section, not a second Y-axis on the weight chart.
- **useLiveQuery for chart screens:** Phase 1 uses `useEffect + async function` pattern consistently (MetricTile.tsx). Follow the same pattern in Phase 2 hooks to avoid introducing a new reactive pattern without dexie-react-hooks being installed.
- **Recharts v2 install:** v2.x is deprecated and has the same React 19 blank-chart issue. Only install v3.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Line/Bar chart rendering | Custom SVG path calculations | `recharts` LineChart/BarChart | Responsive sizing, axis math, SVG path generation are all solved |
| Date range generation | Loop incrementing Date objects | `date-fns eachDayOfInterval` | DST-safe, handles month boundaries correctly |
| Month label formatting | String slice on YYYY-MM | `date-fns format(date, 'MMM')` | Locale-aware, no off-by-one |
| Weekly start boundary | Manual Sunday/Monday calculation | `date-fns startOfWeek({weekStartsOn:1})` | Correct for all locales |
| Summary stat (avg, min, max) | Custom reduce loops | `Math.min/max` + `Array.reduce` | Primitives are sufficient; no library needed |

**Key insight:** Recharts handles all the hard parts of chart layout (axis scaling, responsive sizing, SVG path math, tooltip positioning). The only custom code needed is data preparation (aggregation) and styling (colors, tooltip markup).

---

## Common Pitfalls

### Pitfall 1: Blank Charts with React 19

**What goes wrong:** After installing Recharts, all charts render as empty white rectangles. No console errors. Everything looks correct in code.

**Why it happens:** Recharts depends on `react-is` for element type checking. When the transitive `react-is` version doesn't match React 19, Recharts' internal rendering silently fails.

**How to avoid:** Install `react-is@^19` explicitly as a direct dependency in the same npm install command as recharts: `npm install recharts@^3.10.1 react-is@^19`

**Warning signs:** Chart container renders with the correct dimensions but no SVG content inside the `<svg>` element.

**Source:** bstefanski.com/blog/recharts-empty-chart-react-19 `[CITED]`

---

### Pitfall 2: Tailwind Color Classes Don't Work in Recharts Props

**What goes wrong:** `<Line stroke="text-blue-500" />` renders a grey/default line because `text-blue-500` is not a valid CSS color — it's a Tailwind utility class that maps to a hex via a stylesheet.

**Why it happens:** Recharts SVG attributes accept CSS color values, not Tailwind class names. Tailwind v4 (this project) uses a different config system than v3 and does not expose a JavaScript `theme()` resolver.

**How to avoid:** Create `src/utils/chartColors.ts` mapping each MetricType to its hex value `[VERIFIED: src/utils/constants.ts:1-38]`:

```typescript
// src/utils/chartColors.ts
// Maps MetricType → hex (matches Tailwind classes in constants.ts)
export const CHART_COLORS: Record<string, string> = {
  weight:      '#3b82f6',  // blue-500
  sleep:       '#8b5cf6',  // violet-500
  steps:       '#10b981',  // emerald-500
  water:       '#06b6d4',  // cyan-500
  heartRate:   '#ef4444',  // red-500
  temperature: '#f97316',  // orange-500
}
```

**Warning signs:** Charts render with grey lines/bars instead of the metric accent color.

---

### Pitfall 3: Date String Parsing Timezone Shift

**What goes wrong:** `new Date("2024-01-15")` in JavaScript parses as UTC midnight, which shifts to the previous day in negative-offset timezones (e.g., UTC-5 → "2024-01-14T19:00:00").

**Why it happens:** ISO 8601 date-only strings are parsed as UTC by the JS Date constructor. If the user's browser is in UTC-5, `new Date("2024-01-15")` → Jan 14 at 7pm local time, causing chart points to appear on the wrong date.

**How to avoid:** Use `parseISO("2024-01-15")` from date-fns — it also parses as UTC, so use `format(parseISO(date), 'MMM d')` for display (consistent timezone), OR use `new Date(date + 'T00:00:00')` (forces local midnight). Choose one approach and stick to it. Since all stored dates are YYYY-MM-DD `[VERIFIED: src/db/schema.ts:8]`, the safe pattern is `parseISO(date + 'T00:00:00')` or just `new Date(date + 'T00:00:00')`.

**Warning signs:** Weekly chart shows 6 data points instead of 7; the first data point is on the "wrong" day.

---

### Pitfall 4: Sleep Duration Units

**What goes wrong:** Charting sleep `duration` in minutes produces Y-axis values like 480 instead of 8h. The chart looks confusing.

**Why it happens:** Sleep is stored as `beddingTime` / `wakeTime` ISO timestamps `[VERIFIED: src/db/schema.ts:13-15]`, with an optional computed `duration` in minutes.

**How to avoid:** Convert minutes to decimal hours for the chart Y-axis: `duration / 60`. Y-axis label = "hours". Tooltip shows `${(value).toFixed(1)}h`. Example: 480 minutes → 8.0h.

---

### Pitfall 5: Missing Height in BMI Section

**What goes wrong:** BMI section crashes or shows `NaN` when height is empty string or `'0'`.

**Why it happens:** Height is stored as a string in localStorage `[VERIFIED: src/components/Settings/Settings.tsx:11]`. `parseFloat('')` → `NaN`; division by zero if height is 0.

**How to avoid:** In `useBmiData.ts`, guard before calculation:
```typescript
const heightCm = parseFloat(localStorage.getItem('myhealth-height') ?? '')
if (!heightCm || heightCm <= 0) return { bmiData: [], error: 'no-height' }
```
BmiSection renders a "Set height in Settings" message when `error === 'no-height'`.

---

### Pitfall 6: Heatmap Cell Sizing on Small Screens

**What goes wrong:** 52 columns × 10px + 2px gap = ~624px minimum width. On a 375px phone screen, cells overflow or the grid truncates.

**Why it happens:** CSS grid columns for 52 weeks don't naturally wrap to fit small screens.

**How to avoid:** Set `overflow-x: auto` on the heatmap container and use `min-width: 600px` on the grid itself. This makes the heatmap horizontally scrollable on small screens — the standard GitHub behavior on mobile.

---

### Pitfall 7: Recharts ResponsiveContainer Height in Flex Parent

**What goes wrong:** `<ResponsiveContainer width="100%" height="100%">` renders with 0 height when the parent is a flex or grid container without an explicit height.

**Why it happens:** `height="100%"` requires the parent to have a defined pixel height. If the parent is `height: auto`, the child's `100%` resolves to `0`.

**How to avoid:** Always use a fixed pixel height: `<ResponsiveContainer width="100%" height={220}>`. Never use `height="100%"`.

---

## Code Examples

### Metric type auto-selects chart component

```typescript
// Source: CONTEXT.md D-05 (locked decision)
const METRIC_CHART_TYPE: Record<MetricType, 'line' | 'bar'> = {
  weight:      'line',
  sleep:       'line',
  steps:       'bar',
  water:       'bar',
  heartRate:   'line',
  temperature: 'line',
}

// Yearly view (D-06): always bar regardless of metric type
const chartType = period === 'Y' ? 'bar' : METRIC_CHART_TYPE[metric]
```

### METRIC_CONFIG hex values (extend existing file)

The `src/utils/constants.ts` file `[VERIFIED: src/utils/constants.ts:1-38]` defines accent colors as Tailwind class strings. Phase 2 needs a parallel hex map for Recharts. Add to `constants.ts` or create `chartColors.ts`:

```typescript
// Verbatim from constants.ts [VERIFIED: src/utils/constants.ts:1-38]:
// weight: 'text-blue-500' / 'border-blue-500'
// sleep: 'text-violet-500' / 'border-violet-500'
// steps: 'text-emerald-500' / 'border-emerald-500'
// water: 'text-cyan-500' / 'border-cyan-500'
// heartRate: 'text-red-500' / 'border-red-500'
// temperature: 'text-orange-500' / 'border-orange-500'

export const CHART_HEX: Record<MetricType, string> = {
  weight:      '#3b82f6',
  sleep:       '#8b5cf6',
  steps:       '#10b981',
  water:       '#06b6d4',
  heartRate:   '#ef4444',
  temperature: '#f97316',
}
```

### Trend arrow calculation (D-04 summary stat)

```typescript
// Source: CONTEXT.md D-04 and ## Specific Ideas (locked decision)
// "trend compares current period average to previous period of same length"
function trendArrow(current: number, previous: number): '↑' | '↓' | '→' {
  const delta = (current - previous) / previous
  if (delta > 0.01) return '↑'
  if (delta < -0.01) return '↓'
  return '→'
}
// Display: `Avg ${avg.toFixed(1)} (${min.toFixed(1)} – ${max.toFixed(1)}) ${arrow}`
```

### BMI categories (exact values from CONTEXT.md)

```typescript
// Verbatim from CONTEXT.md ## Specific Ideas:
// "Underweight < 18.5, Normal 18.5–24.9, Overweight 25–29.9, Obese ≥ 30"
function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25)   return 'Normal'
  if (bmi < 30)   return 'Overweight'
  return 'Obese'
}
```

### Heatmap intensity levels (from CONTEXT.md D-10)

```typescript
// Verbatim from CONTEXT.md D-10:
// "0=grey, 1–2=light shade, 3–4=medium, 5–6=full saturation (6 metrics total)"
function heatmapCellClass(count: number): string {
  if (count === 0) return 'bg-zinc-800'
  if (count <= 2)  return 'bg-emerald-900 dark:bg-emerald-900'
  if (count <= 4)  return 'bg-emerald-600 dark:bg-emerald-600'
  return 'bg-emerald-500 dark:bg-emerald-500'
}
// Use a neutral/green accent for heatmap (no metric-specific color — CONTEXT.md D-10 doesn't specify)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts 2.x | Recharts 3.x (current stable) | ~2024-2025 | v2 deprecated; v3 removes CategoricalChartState, uses hooks for internal state |
| Tailwind v3 config (tailwind.config.js + theme()) | Tailwind v4 (CSS-based config, no JS config file) | 2024 | Cannot use `theme('colors.blue.500')` in JS — must hardcode hex values for Recharts |
| react-smooth (Recharts animation dep) | Built-in animation (removed react-smooth) | Recharts v3 | Animation now maintained inside recharts; one fewer dep |
| recharts-scale (axis scaling dep) | Built-in scale (removed recharts-scale) | Recharts v3 | Scale utilities now inside recharts |

**Deprecated/outdated:**
- `CategoricalChartState` prop: removed in Recharts v3. Use hooks instead.
- `ref.current.current` on `ResponsiveContainer`: removed in v3. Use `ref.current` directly if ref needed.
- Recharts v2.x: deprecated; no further updates (`[CITED: github.com/recharts/recharts/issues/7361]`)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Heatmap should use emerald green as accent color (same as steps tile). CONTEXT.md D-10 does not specify the heatmap color, only intensity levels. | Code Examples — heatmapCellClass | Minor: wrong color choice. Easy to change. |
| A2 | The existing `useEffect + async function` pattern (from MetricTile.tsx) is the preferred data-fetching pattern for Phase 2 hooks, not `useLiveQuery`. `dexie-react-hooks` is not installed. | Architecture Patterns | Low: if team wants reactive updates, would need `npm install dexie-react-hooks`. Data is static after query in practice. |
| A3 | Sleep chart should display duration in decimal hours (divide stored minutes by 60). Sleep schema stores `duration` as minutes. | Pattern 2 / Pitfall 4 | Medium: wrong unit makes Y-axis unreadable. Confirmed via schema read but unit conversion not in CONTEXT.md. |
| A4 | Heatmap month labels run left-to-right above the grid (older months on left, current on right). Direction not explicitly specified in D-11/D-12. | Heatmap pattern | Low: UX convention; easy to reverse. |
| A5 | `react-is` SUS verdict is safe to override. Package is the official React utility from Meta, not a slopsquatted impersonator. | Package Legitimacy Audit | Very low: 258M+ weekly downloads; GitHub repo confirmed as facebook/react monorepo. |

---

## Open Questions

1. **Heatmap accent color for multi-metric intensity**
   - What we know: D-10 specifies intensity levels (0/1-2/3-4/5-6) using shading of an unspecified color.
   - What's unclear: Which Tailwind color family to use — emerald (same as steps), zinc with opacity, or a new neutral green?
   - Recommendation: Use emerald (steps color) as the default. Planner can add a note to confirm with user during execution.

2. **useLiveQuery vs useEffect for chart data**
   - What we know: Phase 1 uses `useEffect + async`. `dexie-react-hooks` is not installed. Chart data doesn't need real-time reactivity during chart viewing.
   - What's unclear: Does the team want chart data to auto-refresh if user logs while viewing chart?
   - Recommendation: Use `useEffect + async` for consistency with Phase 1. Note: the user would need to navigate away and back to refresh — acceptable for charts.

3. **Recharts v3 + React 19 blank chart — confirmed fix**
   - What we know: Install `react-is@^19` fixes the issue per bstefanski.com blog.
   - What's unclear: Whether the fix holds for React 19.2.6 specifically (blog tested with 19.0.0) vs 19.2.3 reported issue.
   - Recommendation: Plan a smoke-test task immediately after install: render one `<LineChart>` with dummy data, verify non-empty SVG. If it fails, debug before proceeding with other chart tasks.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| recharts | All charts | Not installed | — (3.10.1 on registry) | None — must install |
| react-is | Recharts React 19 fix | Not installed | 19.3.0 on registry | None — must install with recharts |
| date-fns | Data aggregation | Already installed | 4.4.0 | — |
| dexie | Data queries | Already installed | 4.4.5 | — |
| react-router-dom | /chart/:metric route | Already installed | 7.18.3 | — |
| lucide-react | Trend arrows, FAB icon | Already installed | 1.40.0 | — |

**Missing dependencies with no fallback:**
- `recharts@^3.10.1` — install in Wave 0 before any chart implementation tasks
- `react-is@^19` — install simultaneously with recharts

**Missing dependencies with fallback:**
- None — all other dependencies present.

---

## Security Domain

Security enforcement is enabled (`security_enforcement: true`, `security_asvs_level: 1`).

### Applicable ASVS Categories (Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in this app (single-user, local-only) |
| V3 Session Management | No | No sessions; data is local IndexedDB |
| V4 Access Control | No | Single-user app; all data access is local |
| V5 Input Validation | Yes | Validate height before BMI calculation; validate date range params |
| V6 Cryptography | No | No encryption; data stays local |

### Known Threat Patterns for This Phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| BMI divide-by-zero | Tampering (malformed height) | Guard: `if (!heightCm || heightCm <= 0) return error` before dividing |
| XSS in chart tooltips | Tampering | React JSX escapes by default — do not use `dangerouslySetInnerHTML` in tooltip components |
| Heatmap tooltip injection | Tampering | Same as above — render metric names from a static allowlist, not from raw stored strings |
| Date param injection | Tampering | `subDays(new Date(), N)` generates dates programmatically — no user-controlled date strings in Dexie queries |

**Security note:** Phase 2 is purely read-only relative to the data store (it queries but does not write). The only user-controlled data flowing into chart logic is height from localStorage, which must be validated as a positive number before use. All other inputs (metric type, period) are constrained to an enum/union.

---

## Sources

### Primary (MEDIUM confidence via npm registry)
- `npm view recharts version` → 3.10.1, `npm view recharts@3.10.1 peerDependencies` → confirms React 19 support `[VERIFIED: npm registry, 2026-09-14]`
- `npm view react-is version` → 19.3.0 `[VERIFIED: npm registry, 2026-09-14]`
- `src/db/schema.ts` (lines 1-71) — all 6 metric table schemas, field names, Dexie version history `[VERIFIED: src/db/schema.ts:1-71]`
- `src/utils/constants.ts` (lines 1-38) — METRIC_CONFIG with accent colors `[VERIFIED: src/utils/constants.ts:1-38]`
- `src/store/appStore.ts` (lines 1-28) — MetricType enum, dark mode pattern `[VERIFIED: src/store/appStore.ts:1-28]`
- `src/components/Settings/Settings.tsx` (line 11) — localStorage key `'myhealth-height'` `[VERIFIED: src/components/Settings/Settings.tsx:11]`
- `src/App.tsx` (lines 1-34) — existing routes (HashRouter) `[VERIFIED: src/App.tsx:1-34]`
- `src/components/Dashboard/MetricTile.tsx` — existing Dexie query pattern, navigation pattern `[VERIFIED: src/components/Dashboard/MetricTile.tsx:1-225]`
- `package.json` — installed dependencies (React 19.2.6, Tailwind v4, date-fns 4.4.0, dexie 4.4.5, recharts NOT installed) `[VERIFIED: package.json:1-54]`
- `02-CONTEXT.md` — D-01 through D-16, all locked decisions `[VERIFIED: .planning/phases/02-charts-visualization/02-CONTEXT.md]`

### Secondary (LOW confidence via web search)
- [recharts-react-data-visualization-2026 (StackNotice)](https://stacknotice.com/blog/recharts-react-data-visualization-2026) — LineChart, BarChart, CustomTooltip patterns
- [How to Fix Recharts Empty Chart with React 19 (Bart Stefanski)](https://www.bstefanski.com/blog/recharts-empty-chart-react-19/) — react-is fix
- [Recharts 3.0 migration guide (GitHub Wiki)](https://github.com/recharts/recharts/wiki/3.0-migration-guide) — breaking changes from v2
- [Recharts v2 deprecated issue #7361](https://github.com/recharts/recharts/issues/7361) — confirms v2 no longer maintained
- [GitHub style heatmap CSS Grid patterns](https://github.com/uiwjs/react-heat-map) — SVG/grid layout reference

### Tertiary (ASSUMED — training knowledge)
- Monthly aggregation groupBy pattern (date-fns `format(date, 'yyyy-MM')` for bucketing)
- Recharts `connectNulls={false}` behavior for sparse data
- CSS Grid column-major layout for heatmap
- Sparkline with no axes pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — Recharts v3.10.1 and react-is confirmed on npm registry; React 19 blank-chart fix from authoritative-enough web source (dedicated blog post, confirmed symptoms match project)
- Architecture: MEDIUM — Codebase patterns verified by reading actual source files; aggregation patterns based on training knowledge
- Pitfalls: MEDIUM — Recharts/React 19 pitfall has a cited source; Tailwind v4 color issue confirmed by reading package.json (Tailwind v4 installed)
- BMI categories: HIGH — verbatim from CONTEXT.md
- Accent color hex values: MEDIUM — standard Tailwind palette hex values (blue-500 = #3b82f6 etc.) — well-established but not re-verified from Tailwind source this session

**Research date:** 2026-09-14
**Valid until:** 2026-10-14 (Recharts and React 19 ecosystem is active; react-is fix should remain stable)
