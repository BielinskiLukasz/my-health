---
phase: 03-targets-goals
status: issues_found
reviewed: 2026-09-18T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - src/components/Charts/MetricChart.tsx
  - src/components/Charts/TargetModal.tsx
  - src/components/Dashboard/Dashboard.tsx
  - src/components/Dashboard/ExerciseProxyTile.tsx
  - src/components/Dashboard/MetricTile.tsx
  - src/db/schema.ts
  - src/hooks/useExerciseLogData.ts
  - src/hooks/usePersonalBestData.ts
  - src/hooks/useStreakData.ts
  - src/hooks/useTargetData.ts
  - src/utils/personalBest.test.ts
  - src/utils/personalBest.ts
  - src/utils/targetCalcs.test.ts
  - src/utils/targetCalcs.ts
---

# Phase 03: Code Review Report

**Reviewed:** 2026-09-18T00:00:00Z
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

The pure math modules (`targetCalcs.ts`, `personalBest.ts`) are clean, well-documented, and thoroughly tested — no defects found there. The problems are concentrated where these pure functions get wired into hooks and components: a data-corrupting false-positive in the Personal Best flow, a React Rules-of-Hooks violation on the chart screen, a silently-wrong weight-target direction default, and an exercise-streak recompute bug that directly contradicts the code's own documented design intent (D-08). Four Critical-severity issues and four Warnings were found; details and fixes below.

## Critical Issues

### CR-01: `0` fallback value falsely triggers "Personal Best" and poisons the cache

**File:** `src/components/Dashboard/MetricTile.tsx:236-237`
**Issue:**
```ts
const isPersonalBest =
  metric !== "temperature" && isTodayPersonalBest(weekData.at(-1)?.value ?? 0)
```
`weekData` (from `useChartData(metric, "W")`) can legitimately be empty — e.g. the user has historical heart-rate or weight data but hasn't logged anything in the last 7 days. In that case `weekData.at(-1)?.value` is `undefined` and the fallback `0` is fed directly into `isTodayPersonalBest`, which treats it as a real measurement.

For any `"min"`-direction PB metric (`weight`/min, `heartRate`/min — see `PB_METRICS` in `src/utils/personalBest.ts`), `0` is virtually guaranteed to be lower than any real cached best, so `isNewPersonalBest(0, cachedBest, "min")` returns `true`. This:
1. Shows a false "🏆 Personal best!" badge on a tile with **no data logged this week**.
2. Calls `db.personalBests.put({ metric, direction: "min", value: 0, date: todayISO() })` inside `usePersonalBestData.ts` (`isTodayPersonalBest`, lines 140-148), permanently overwriting the cached min with `0`. Because no real future measurement can ever be `< 0`, the min-PB detection for that metric is now poisoned forever (no legitimate future personal best will ever be detected again) until someone manually clears the `personalBests` table.

**Fix:** Never call the PB check with a sentinel/fallback value — only check when real data exists:
```ts
const latest = weekData.at(-1)?.value
const isPersonalBest = metric !== "temperature" && latest !== undefined && isTodayPersonalBest(latest)
```

---

### CR-02: `MetricChart` violates React's Rules of Hooks (early return between hook calls)

**File:** `src/components/Charts/MetricChart.tsx:84-116`
**Issue:**
```ts
const { metric: metricParam } = useParams<{ metric: string }>()
const navigate = useNavigate()
const [period, setPeriod] = useState<"W" | "M" | "Y">("W")

if (!metricParam || !isValidMetric(metricParam)) {
  navigate(-1)
  return null
}

const metric = metricParam as MetricType
const { data, prevData, isLoading } = useChartData(metric, period)   // hook #4
const { target } = useTargetData(metric)                             // hook #5
const { data: weekData } = useChartData(metric, "W")                 // hook #6
...
const { isTodayPersonalBest } = usePersonalBestData(metric)          // hook #7
```
The component calls 3 hooks unconditionally, then conditionally returns `null` before calling 4 more hooks. React Router keeps the same `MetricChart` instance mounted across param changes on the same route (e.g. browser back/forward between `/chart/weight` and a bad `/chart/xyz` URL, or any programmatic navigation that changes only the `:metric` param without unmounting). If a render with a valid metric (7 hooks called) is followed by a render with an invalid metric (3 hooks called), React throws: *"Rendered fewer hooks than during the previous render."* This is a real crash risk, not just a lint nit.

**Fix:** Call all hooks unconditionally first, then branch on validity for the returned JSX:
```ts
const metric = metricParam && isValidMetric(metricParam) ? metricParam : "weight" // dummy safe default
const { data, prevData, isLoading } = useChartData(metric, period)
const { target } = useTargetData(metric)
// ...all other hooks...

if (!metricParam || !isValidMetric(metricParam)) {
  navigate(-1)
  return null
}
```
(Or move the validity check into a wrapping route guard component that renders `<MetricChart metric={metric} />` only once validated, so this component is only ever mounted with a valid metric.)

---

### CR-03: Weight target created before any weight entry silently defaults to the wrong direction forever

**File:** `src/hooks/useTargetData.ts:45-67`
**Issue:**
```ts
let direction: "up" | "down" | undefined
if (metric === "weight") {
  const mostRecent = await db.weights.orderBy("date").reverse().first()
  if (mostRecent) {
    direction = inferDirection(mostRecent.value, t.value)
  }
}
await db.targets.put({ metric, value: t.value, targetDate: t.targetDate, direction, createdAt: ... })
```
If a user sets a weight target *before ever logging a weight entry* (a completely plausible onboarding flow — "set my goal first, log later"), `mostRecent` is `undefined`, so `direction` is persisted as `undefined`. Downstream, both `getOnTrackStatus` and `meetsTargetForDay` in `src/utils/targetCalcs.ts` treat `target.direction === "down" ? ... : ...` — an `undefined` direction silently falls into the `"up"` (gain/floor) branch:
```ts
// targetCalcs.ts:122-126
gap = target.direction === "down"
  ? Math.max(0, projectedValue - target.value)
  : Math.max(0, target.value - projectedValue)
```
```ts
// targetCalcs.ts:158-163
return target.direction === "down" ? delta < 0 : delta > 0
```
So a user trying to *lose* weight gets floor/"gain" semantics applied to their on-track color and daily streak — the exact opposite of D-02's intent — with **no error, warning, or visual indicator** that anything is wrong. Worse, `direction` is never recomputed automatically once the user logs their first weight; it only gets fixed if they happen to re-open the target editor and re-save (which re-runs the same inference).

**Fix:** Either block target creation for weight until at least one entry exists, or recompute/backfill `direction` the first time a weight entry is logged after a directionless target exists (e.g. in the weight-logging save path, check `if (target.metric === 'weight' && target.direction === undefined) { infer and update }`).

---

### CR-04: Editing the weekly exercise target retroactively rewrites history and resets the streak — contradicting the code's own D-08 comment

**File:** `src/hooks/useExerciseLogData.ts:54-68`, `src/components/Dashboard/ExerciseProxyTile.tsx:50-62`
**Issue:** `ExerciseProxyTile.tsx`'s `commitEdit` explicitly documents the intended behavior:
```ts
// T-03-09: same numeric-range validation as TargetModal before the
// Dexie write (D-08: this never resets the streak — it's a value edit).
```
But `useExerciseLogData`'s history computation applies the **current** `weeklyTarget` uniformly to *all* 52 looked-back weeks:
```ts
for (let i = 0; i < WEEK_LOOKBACK; i++) {
  const weekRef = subWeeks(now, i)
  ...
  const count = entries.filter((e) => e.logged).length
  history.push({ met: count >= weeklyTarget })   // <-- same weeklyTarget for every past week
}
```
`weeklyMetHistory` feeds directly into `calculateWeeklyStreak(weeklyMetHistory)` in `ExerciseProxyTile.tsx`. If a user raises their weekly target (e.g. 3 → 5 sessions/week), every past week that only hit 3-4 sessions — which satisfied the target *at the time* — is now retroactively marked `met: false`, shrinking or zeroing the displayed streak. This is a direct, demonstrable contradiction of the comment's stated guarantee that editing the target value never resets the streak.

**Fix:** Snapshot the target value that was in effect for each historical week (e.g. store `weeklyTarget` alongside each week's aggregate, or record target-change events with effective dates) instead of re-applying today's target retroactively across all 52 weeks.

## Warnings

### WR-01: Personal-best cache mutation runs as a side effect of rendering, with unhandled promise rejection

**File:** `src/hooks/usePersonalBestData.ts:126-154`; invoked directly from render bodies at `src/components/Dashboard/MetricTile.tsx:237` and `src/components/Charts/MetricChart.tsx:115`
**Issue:** `isTodayPersonalBest` both writes to Dexie (`void db.personalBests.put(...)`) and calls `setCachedBests(...)` as side effects of simply being *called* — and both call sites invoke it directly in the component render body (not in a `useEffect` or event handler):
```tsx
// MetricTile.tsx render body
const isPersonalBest = metric !== "temperature" && isTodayPersonalBest(weekData.at(-1)?.value ?? 0)
// MetricChart.tsx render body
const isPersonalBest = metric !== "temperature" && data.some((d) => isTodayPersonalBest(d.value))
```
Calling a function with real side effects (a database write) during render violates render purity (React explicitly warns against side effects — including DB writes — during render, even in the "adjust state during render" pattern). It also means the write's rejection is never observed (`void db.personalBests.put(...)` has no `.catch`), so a failed write is silently swallowed with no user-visible error and no retry.
**Fix:** Move the "detect + persist new personal best" logic into a `useEffect` keyed on the value that should be checked (e.g. today's own logged value from the write path, not from render-time scans), and add `.catch` handling (or `await` + try/catch) around the Dexie write.

### WR-02: New personal-best records are stamped with "today's" date even when the triggering value isn't from today

**File:** `src/components/Charts/MetricChart.tsx:115`, `src/hooks/usePersonalBestData.ts:140-148`
**Issue:** `MetricChart.tsx` scans the *entire currently-displayed period* (`data.some((d) => isTodayPersonalBest(d.value))`), which for the "M" or "Y" period includes many non-today values. If any of those values legitimately triggers a new-PB match (e.g. after a bulk import of older history not yet reflected in the cache), `isTodayPersonalBest`'s bump logic unconditionally writes `date: todayISO()`:
```ts
const date = todayISO()
void db.personalBests.put({ metric: pbMetric, direction: cb.direction, value, date })
```
This mislabels the achievement date in the `personalBests` table with today's date instead of the actual date the value occurred (`d.date`), corrupting the personal-best audit trail. It can also cause the "🏆 Personal best!" badge to appear on a Month/Year chart view even though nothing was logged today.
**Fix:** Pass the entry's own date through to the bump call, and restrict "Personal best today" badge logic to actually-today's entry rather than scanning the whole displayed period.

### WR-03: Target value ceiling (`MAX_VALUE`) is only enforced via the HTML `max` attribute, with no JS-side check

**File:** `src/components/Charts/TargetModal.tsx:62-73`
**Issue:** `handleSubmit` validates `numValue <= 0` but never checks `numValue > MAX_VALUE[metric]`, relying entirely on the native `<input type="number" max={...}>` constraint validation to block out-of-range submissions. This is fragile: it silently stops working if `noValidate` is ever added to the form, if the value is set programmatically in a way that bypasses the browser's submit-time check, or in older/inconsistent browser implementations.
**Fix:**
```ts
if (!value || isNaN(numValue) || numValue <= 0 || numValue > MAX_VALUE[metric]) {
  toast.error(`Enter a value between 0 and ${MAX_VALUE[metric]}.`)
  return
}
```

### WR-04: Invalid weekly-target edits fail silently with no user feedback

**File:** `src/components/Dashboard/ExerciseProxyTile.tsx:50-62`
**Issue:** Unlike `TargetModal.tsx` (which calls `toast.error(...)` on invalid input), `commitEdit` simply discards the edit without any explanation when the parsed value is non-integer or out of `[MIN_WEEKLY_TARGET, MAX_WEEKLY_TARGET]`:
```ts
if (Number.isInteger(parsed) && parsed >= MIN_WEEKLY_TARGET && parsed <= MAX_WEEKLY_TARGET) {
  await saveTarget({ value: parsed })
}
setIsEditingTarget(false)
```
The user sees their input vanish back to the old value with no indication why the edit didn't take effect.
**Fix:** Add a `toast.error(...)` (matching `TargetModal`'s pattern) in the `else` branch before closing the editor.

## Info

### IN-01: Chart's target `ReferenceLine` doesn't gate on `isTargetEligible`, unlike the badge/CTA row

**File:** `src/components/Charts/MetricChart.tsx:217-230, 261-274`
**Issue:** The status badge/CTA row is correctly guarded by `isTargetEligible(metric)` (line 160), but the `<ReferenceLine>` rendering in both the line-chart and bar-chart branches only checks `{target && (...)}`, with no `isTargetEligible` guard. This currently relies entirely on the invariant that a `"temperature"` row can never exist in `db.targets` (since no UI ever writes one). Should that invariant ever be violated (manual DB edit, future refactor, import feature), the chart would render a target line for temperature.
**Fix:** Guard consistently: `{target && isTargetEligible(metric) && (<ReferenceLine .../>)}` (or memoize a single `showTarget` boolean used everywhere).

---

_Reviewed: 2026-09-18T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
