---
phase: 02-charts-visualization
reviewed: 2026-09-16T00:00:00Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - .github/workflows/deploy.yml
  - package.json
  - src/App.tsx
  - src/components/Charts/ActivityHeatmap.tsx
  - src/components/Charts/BmiSection.tsx
  - src/components/Charts/ChartHeader.tsx
  - src/components/Charts/CustomTooltip.tsx
  - src/components/Charts/MetricChart.tsx
  - src/components/Charts/PeriodSelector.tsx
  - src/components/Charts/Sparkline.tsx
  - src/components/Dashboard/Dashboard.tsx
  - src/components/Dashboard/MetricTile.tsx
  - src/hooks/useBmiData.ts
  - src/hooks/useChartData.ts
  - src/hooks/useHeatmapData.ts
  - src/utils/aggregation.test.ts
  - src/utils/aggregation.ts
  - src/utils/bmi.test.ts
  - src/utils/bmi.ts
  - src/utils/chartColors.ts
  - vite.config.ts
findings:
  critical: 1
  warning: 4
  info: 5
  total: 10
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-09-16T00:00:00Z
**Depth:** standard
**Files Reviewed:** 20 (package-lock.json excluded per lock-file filtering policy)
**Status:** issues_found

## Summary

Reviewed the charts/visualization phase: chart hooks (`useChartData`, `useBmiData`, `useHeatmapData`), aggregation/BMI utilities and their tests, chart components (`MetricChart`, `BmiSection`, `ActivityHeatmap`, `ChartHeader`, `CustomTooltip`, `Sparkline`, `PeriodSelector`), the dashboard tile, and supporting config (`vite.config.ts`, `package.json`, deploy workflow).

The pure utility layer (`aggregation.ts`, `bmi.ts`) is solid and well tested — no defects found there. The biggest problem is in `MetricChart.tsx`, which calls a hook conditionally after an early `return null`, combined with a render-phase `navigate()` call — this is a real crash risk under React's rules of hooks, not just a style nit. There is also a genuine data-correctness bug in `useChartData.ts`: the current-period and previous-period date ranges overlap by one day, double-counting that day in both averages used for the trend arrow. Several hooks are also inconsistent in how they handle async errors and cancellation, despite comments claiming shared patterns.

## Critical Issues

### CR-01: Conditional hook call + render-phase navigation in MetricChart can crash the app

**File:** `src/components/Charts/MetricChart.tsx:49-61`

**Issue:**

```tsx
export default function MetricChart() {
  const { metric: metricParam } = useParams<{ metric: string }>()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<"W" | "M" | "Y">("W")

  // T-02-01: guard against invalid metric in URL param
  if (!metricParam || !isValidMetric(metricParam)) {
    navigate(-1)
    return null
  }

  const metric = metricParam as MetricType
  const { data, prevData, isLoading } = useChartData(metric, period)
  ...
```

`MetricChart` is mounted once for the route `/chart/:metric`. Because react-router keeps the same component instance mounted across param changes on a matching route, if this component re-renders with an invalid `metric` param (e.g. the user edits the URL hash, or app code navigates from `/chart/weight` to `/chart/somethingBad` without a full remount), the *first* render called `useChartData` (which itself calls `useState` ×2 and `useEffect` ×1 internally) while a *later* render hits the early `return null` **before** `useChartData` is called. This changes the number of hooks invoked between renders of the same component instance, which is exactly what React's "Rules of Hooks" forbids — React will throw `Error: Rendered fewer hooks than expected. This will cause a crash.`

Independently, `navigate(-1)` is invoked directly in the render body rather than in an effect or event handler. Calling a router navigation function as a side effect *during render* is not pure and can trigger "Cannot update a component while rendering a different component" warnings/errors, in addition to the hook-order crash above.

Note: `eslint-plugin-react-hooks` (already a devDependency, `^7.1.1`) has a rule (`react-hooks/rules-of-hooks`) that flags exactly this pattern — this suggests lint either wasn't run against this file or its warning was ignored.

**Fix:** Move the invalid-metric redirect into a `useEffect`, and call `useChartData` unconditionally (guarding internally, or falling back to a default metric while the effect performs the redirect):

```tsx
export default function MetricChart() {
  const { metric: metricParam } = useParams<{ metric: string }>()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<"W" | "M" | "Y">("W")

  const isValid = !!metricParam && isValidMetric(metricParam)
  const metric = isValid ? (metricParam as MetricType) : "weight" // safe fallback, never rendered

  useEffect(() => {
    if (!isValid) navigate(-1)
  }, [isValid, navigate])

  const { data, prevData, isLoading } = useChartData(metric, period)

  if (!isValid) return null
  ...
```

## Warnings

### WR-01: Current and previous period date ranges overlap by one day, double-counting a day in both averages

**File:** `src/hooks/useChartData.ts:106-117`

**Issue:**

```ts
const start = format(subDays(new Date(), daysBack), "yyyy-MM-dd")
const prevStart = format(subDays(new Date(), daysBack * 2), "yyyy-MM-dd")

const [rawCurrent, rawPrev] = await Promise.all([
  fetchNormalizedRange(metric, start, today),      // between(start, today, true, true)
  fetchNormalizedRange(metric, prevStart, start),  // between(prevStart, start, true, true)
])
```

Both `fetchNormalizedRange` calls use `.between(a, b, true, true)` — inclusive on **both** ends. Since the current-period range is `[start, today]` and the previous-period range is `[prevStart, start]`, the day equal to `start` is included in *both* result sets. That day's entries are then counted in both the "current" average and the "previous" average used by `ChartHeader`'s `TrendIcon`, skewing the trend comparison — most noticeably for the `W` period, where a 1-day overlap is 1/7 of the whole window.

**Fix:** Make the ranges disjoint, e.g. exclude the shared boundary from the previous range:

```ts
const prevEnd = format(subDays(new Date(subDays(new Date(), daysBack)), 1), "yyyy-MM-dd")
// or pass exclusive-start to fetchNormalizedRange for the previous range:
fetchNormalizedRange(metric, prevStart, prevEnd)
```

Or change `fetchNormalizedRange`'s previous-period call to use `.between(prevStart, start, true, false)` so `start` itself is excluded from the previous bucket.

### WR-02: Unhandled promise rejections in `useChartData` and `useBmiData` effects

**File:** `src/hooks/useChartData.ts:141-144`, `src/hooks/useBmiData.ts:67-70`

**Issue:** Both hooks call their async `load()` function directly inside `useEffect` without attaching a `.catch()`:

```ts
load()
return () => {
  cancelled = true
}
```

In `useChartData.ts`, `load()` has a `try { ... } finally { ... }` but no `catch` — if `fetchNormalizedRange` throws (e.g. a Dexie error), `isLoading` is correctly reset in `finally`, but the exception still propagates out of `load()` as an **unhandled promise rejection**. `useBmiData.ts` has no try/catch at all around the `db.weights.orderBy(...)` call. This is inconsistent with `useHeatmapData.ts`, which correctly attaches `load().catch(() => { if (!cancelled) setIsLoading(false) })`.

**Fix:** Add a `.catch()` at the call site (or a `try/catch` inside `load`) in both hooks, matching the pattern already used in `useHeatmapData.ts`:

```ts
load().catch(() => {
  if (!cancelled) setIsLoading(false)
})
```

### WR-03: `MetricTile` async load has no cancellation guard, unlike every other data-fetching hook in this phase

**File:** `src/components/Dashboard/MetricTile.tsx:171-173`

**Issue:**

```ts
useEffect(() => {
  loadTileData(metric, currentDate).then(setTileData)
}, [metric, currentDate])
```

There is no `cancelled` flag here. If `metric` or `currentDate` changes quickly (e.g. rapid date navigation), an older `loadTileData` promise can resolve *after* a newer one and overwrite `tileData` with stale data. This is exactly the race condition the `cancelled` flag pattern (used in `useChartData`, `useBmiData`, `useHeatmapData`) exists to prevent — and `useChartData.ts`'s own docstring even claims parity: `"Uses useEffect + async + cancelled flag pattern (same as MetricTile.tsx)"` (`src/hooks/useChartData.ts:90`), but `MetricTile.tsx` does not actually implement that guard.

**Fix:**

```ts
useEffect(() => {
  let cancelled = false
  loadTileData(metric, currentDate).then((result) => {
    if (!cancelled) setTileData(result)
  })
  return () => {
    cancelled = true
  }
}, [metric, currentDate])
```

### WR-04: `loadTileData` switch has no default/exhaustiveness fallback

**File:** `src/components/Dashboard/MetricTile.tsx:32-154`

**Issue:** The `switch (metric)` inside `loadTileData` handles all six current `MetricType` values but has no `default` case. If `MetricType` is ever extended without updating this switch, the function falls through to an implicit `return undefined`, and the caller does `const { variant, value, lastDate, error } = tileData` after `.then(setTileData)` — destructuring `undefined` will throw at render time. TypeScript's exhaustiveness checking currently protects this, but it's a silent trap for the next person who adds a metric type and misses this file.

**Fix:** Add a `default` branch that throws or returns a safe fallback, e.g.:

```ts
default: {
  const _exhaustive: never = metric
  return { variant: "c", value: "", error: true }
}
```

## Info

### IN-01: Errors are silently swallowed without any logging

**File:** `src/components/Dashboard/MetricTile.tsx:155-157`, `src/hooks/useHeatmapData.ts:71-73`

**Issue:** `loadTileData`'s catch block and `useHeatmapData`'s `.catch()` both swallow errors and fall back to an empty/error UI state with no `console.error` or telemetry hook. This makes production issues (e.g. IndexedDB quota errors, corrupted records) invisible/undebuggable.

**Fix:** At minimum, `console.error(err)` in the catch handlers before setting the fallback state.

### IN-02: `ChartHeader` accepts an unused `period` prop

**File:** `src/components/Charts/ChartHeader.tsx:6-11, 30`

**Issue:** `ChartHeaderProps.period` is declared and passed in from `MetricChart.tsx:93`, but destructured as `period: _period` and never used. This is dead API surface that adds confusion about whether period-specific formatting is (or should be) implemented here.

**Fix:** Either remove the `period` prop entirely, or use it (e.g. to adjust the stats label for the Y period).

### IN-03: Inconsistent date-parsing style across chart files

**File:** `src/components/Charts/MetricChart.tsx:70-76` vs `src/components/Charts/ActivityHeatmap.tsx:29,70,145` and `src/components/Charts/BmiSection.tsx:26`

**Issue:** `MetricChart.tsx` parses `"YYYY-MM-DD" + "T00:00:00"` strings with the native `new Date(...)` constructor, while `ActivityHeatmap.tsx` and `BmiSection.tsx` consistently use `date-fns`'s `parseISO(...)` for the same pattern (explicitly called out elsewhere in comments as the timezone-safe approach). Functionally equivalent for this exact string shape, but the inconsistency is a maintenance hazard if the format ever changes.

**Fix:** Standardize on `parseISO` throughout, matching the documented pattern used in the other chart files.

### IN-04: Build-only tools listed as runtime `dependencies` in package.json

**File:** `package.json:16-38`

**Issue:** `shadcn` (a CLI/codegen tool) and `vite-plugin-pwa` (a Vite build plugin, only imported from `vite.config.ts`) are listed under `dependencies` rather than `devDependencies`. Neither ships in the browser bundle, but this misclassification can mislead dependency audits and bundle-size tooling into thinking they're part of the runtime app.

**Fix:** Move `shadcn` and `vite-plugin-pwa` to `devDependencies`.

### IN-05: Avg/min/max stats always shown with one decimal place, even for discrete integer metrics

**File:** `src/components/Charts/ChartHeader.tsx:44-48`

**Issue:** `stats.avg.toFixed(1)` / `.min.toFixed(1)` / `.max.toFixed(1)` are applied unconditionally. For `steps` and `water` (summed, integer-valued metrics), this renders misleading fake precision like `"Avg 8543.0"` instead of `"Avg 8543"`.

**Fix:** Use the metric's `unit`/type (already available via `METRIC_CONFIG`) to choose `toFixed(0)` for discrete metrics vs `toFixed(1)` for continuous ones.

---

_Reviewed: 2026-09-16T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
