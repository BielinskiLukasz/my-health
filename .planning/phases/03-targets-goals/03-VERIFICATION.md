---
phase: 03-targets-goals
verified: 2026-09-18T18:15:00Z
status: gaps_found
score: 2/4 success criteria verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "User can set a target value and a target date for each metric; the app shows projected pace and whether they are on track (SC#1)"
    status: failed
    reason: "CR-03: Weight target created before any weight entry silently defaults to undefined direction, causing on-track status to invert for loss-direction metrics. User setting a weight loss target without any prior entry sees yellow/red when they should see green, and vice versa. Direction never recomputed automatically after first entry logged."
    artifacts:
      - path: "src/hooks/useTargetData.ts"
        issue: "Lines 48-52: mostRecent can be undefined if no weight entry exists yet; direction persists as undefined; not recomputed on subsequent weight entry"
      - path: "src/utils/targetCalcs.ts"
        issue: "Lines 122-126, 158-163: undefined direction falls into 'up' branch instead of 'down', inverting gap logic and daily streak check"
    missing:
      - "Recompute weight direction on first weight entry after a directionless target, or block weight target creation until at least one entry exists"
      - "Add JS-side direction inference/validation in useTargetData.saveTarget before Dexie write"

  - truth: "Target progress bars and red/yellow/green color coding are visible on both the dashboard and the chart views (SC#2)"
    status: failed
    reason: "CR-01: Dashboard MetricTile line 237 calls isTodayPersonalBest(weekData.at(-1)?.value ?? 0) with a 0 fallback when no weekly data exists. This is not a target color issue per se, but the same data-flow problem affects the on-track status computation when applied with the CR-03 weight-direction bug—color coding becomes unpredictable for weight targets."
    artifacts:
      - path: "src/components/Dashboard/MetricTile.tsx"
        issue: "Line 237: Fallback value 0 fed to PB check; same weekly-data fetch could affect on-track badge reliability when target.direction is undefined (CR-03)."
    missing:
      - "CR-01 and CR-03 must be fixed together to restore color-coding reliability"

  - truth: "Dashboard shows the current consecutive-day streak for each metric that has an active target (SC#3)"
    status: failed
    reason: "CR-04: Exercise-proxy weekly target edit retroactively re-applies the new target to all 52 weeks of history. Weeks that previously met the old target no longer meet the new target, shrinking or zeroing the streak retroactively. This directly contradicts the stated D-08 design intent ('editing the target never resets the streak') and violates the must-have truth in 03-03-PLAN.md line 29."
    artifacts:
      - path: "src/hooks/useExerciseLogData.ts"
        issue: "Lines 54-68: History loop applies current weeklyTarget uniformly to all WEEK_LOOKBACK weeks instead of using the target effective at the time of each week"
      - path: "src/components/Dashboard/ExerciseProxyTile.tsx"
        issue: "Line 136 comment promises D-08 compliance; implementation violates it"
    missing:
      - "Snapshot the target value effective for each historical week, or record target-change events with effective dates"

  - truth: "App automatically detects personal bests (heaviest weight, most steps, longest sleep, etc.) and flags them in history and exercise detail views (SC#4)"
    status: failed
    reason: "CR-01: MetricTile and MetricChart call isTodayPersonalBest(weekData.at(-1)?.value ?? 0) and isTodayPersonalBest(d.value) respectively with a 0 fallback or without date context. For 'min'-direction metrics (weight/min, heartRate/min), 0 is virtually guaranteed lower than any cached best, falsely triggering new-PB detection and poisoning the cache with value=0. Future measurements can never be < 0, so PB detection is permanently broken for that metric. CR-02 also prevents the isTodayPersonalBest hook from being called reliably due to React Rules of Hooks violation."
    artifacts:
      - path: "src/components/Dashboard/MetricTile.tsx"
        issue: "Line 237: Fallback 0 triggers false positive for min-direction PBs"
      - path: "src/hooks/usePersonalBestData.ts"
        issue: "Lines 140-148: Bump logic writes date as todayISO() unconditionally, even when the value itself is from a past date (CR-02 issue compounds this)"
      - path: "src/components/Charts/MetricChart.tsx"
        issue: "Line 115: Scans entire displayed period without date context; can mislabel PB achievement date"
    missing:
      - "CR-01: Only check PB when real weekly data exists; skip the 0 fallback"
      - "CR-02: Fix React Rules of Hooks violation so hook calls are reliable"
      - "WR-02: Pass actual value date through to bump call; restrict badge to actually-today entries"

  - truth: "MetricChart renders all hooks unconditionally before returning on invalid metric param (React Rules of Hooks compliance)"
    status: failed
    reason: "CR-02: MetricChart.tsx lines 84-86 return early from an invalid metric check before calling 4 hooks (useChartData, useTargetData, useChartData again, usePersonalBestData). React Router can keep the same component instance mounted across param changes. A valid-metric render (all 7 hooks called) followed by invalid-metric render (3 hooks called) throws 'Rendered fewer hooks than during the previous render.'"
    artifacts:
      - path: "src/components/Charts/MetricChart.tsx"
        issue: "Lines 78-96: Hooks called after early return on invalid metric"
    missing:
      - "Call all hooks unconditionally with a safe dummy metric, then branch on validity for JSX rendering, or add a wrapping route guard"

deferred: []
behavior_unverified_items: []
coincidental_reliance_items: []
human_verification: []
---

# Phase 03: Targets & Goals Verification Report

**Phase Goal:** Users can set deadlined targets per metric, see projected pace toward each target, track streaks, and spot personal bests

**Verified:** 2026-09-18T18:15:00Z

**Status:** gaps_found

**Re-verification:** No — initial verification

## Summary

Phase 03 has executed all 3 plans (03-01 Target Engine, 03-02 Streaks & Personal Bests, 03-03 Exercise Proxy) and the test suite passes (114/114 tests). However, a standard code review (03-REVIEW.md, committed in this phase) identified **4 Critical issues** in the integration layer (components and hooks) that directly undermine the phase success criteria. These bugs exist in the current codebase and are not caught by the unit test suite (which only tests pure math functions).

**Critical Issues Found:**

1. **CR-03** — Weight target direction defaults to undefined when set before any weight entry exists, silently inverting on-track color logic
2. **CR-01** — Zero fallback value in PB checks poisons the personal-best cache forever for min-direction metrics
3. **CR-02** — MetricChart violates React Rules of Hooks, risking a crash on invalid metric navigation
4. **CR-04** — Exercise-proxy target edit retroactively resets the weekly streak, contradicting the stated D-08 design

All four issues directly affect one or more of the four phase success criteria.

## Goal Achievement Assessment

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can set a target value and target date; app shows projected pace and on-track status | ✗ FAILED | CR-03: weight direction undefined → inverted on-track colors for loss targets |
| 2 | Target progress bars and red/yellow/green coding visible on dashboard and chart | ✗ FAILED | CR-03 + CR-01 compound: undefined direction inverts colors; 0 fallback poisons PB badge |
| 3 | Dashboard shows consecutive-day streak for each targeted metric | ✗ FAILED | CR-04: exercise proxy target edit retroactively resets streak, violating D-08 |
| 4 | App detects personal bests and flags them | ✗ FAILED | CR-01: 0 fallback falsely triggers and poisons cache; CR-02: Rules of Hooks crash risk |

## Critical Issues (4)

### CR-03: Weight target direction silently defaults to undefined, inverting on-track status

**File:** `src/hooks/useTargetData.ts:45-67`

**Codebase Evidence:**
```typescript
let direction: "up" | "down" | undefined
if (metric === "weight") {
  const mostRecent = await db.weights.orderBy("date").reverse().first()
  if (mostRecent) {
    direction = inferDirection(mostRecent.value, t.value)
  }
}
await db.targets.put({ ..., direction, ... })
```

**Issue:** If a user sets a weight target before ever logging a weight entry (a completely plausible onboarding flow), `mostRecent` is undefined, so `direction` persists as undefined. Downstream in targetCalcs.ts:

```typescript
gap = target.direction === "down"
  ? Math.max(0, projectedValue - target.value)
  : Math.max(0, target.value - projectedValue)
```

An undefined direction silently falls into the else branch (up/gain semantics), inverting the on-track color for a user trying to lose weight. This violates Success Criterion #1 ("shows projected pace and whether they are on track") — the on-track status is inverted.

**Impact:** BLOCKER for SC#1 and SC#2. A weight-loss-target user with no prior entries sees inverted color coding with no error, warning, or visual indicator.

---

### CR-01: Zero fallback value falsely triggers Personal Best and poisons the cache

**File:** `src/components/Dashboard/MetricTile.tsx:237` and `src/components/Charts/MetricChart.tsx:115`

**Codebase Evidence:**
```typescript
// MetricTile.tsx:236-237
const isPersonalBest =
  metric !== "temperature" && isTodayPersonalBest(weekData.at(-1)?.value ?? 0)
```

**Issue:** When weekData is empty (no entries this week), the fallback 0 is fed directly into isTodayPersonalBest. For "min"-direction PB metrics (weight/min, heartRate/min), 0 is virtually guaranteed lower than any real cached best, triggering `isNewPersonalBest(0, cachedBest, "min")` → true, which:

1. Shows a false "🏆 Personal best!" badge on a tile with no data
2. Calls `db.personalBests.put({ metric, direction: "min", value: 0, ... })`, overwriting the cached min with 0
3. Permanently poisons the cache — no future measurement can ever be < 0, so PB detection is broken forever for that metric

**Impact:** BLOCKER for SC#4 ("App automatically detects personal bests and flags them"). The cache becomes permanently corrupted on the first "no data this week" render.

---

### CR-02: MetricChart violates React Rules of Hooks (early return before hook calls)

**File:** `src/components/Charts/MetricChart.tsx:78-115`

**Codebase Evidence:**
```typescript
export default function MetricChart() {
  const { metric: metricParam } = useParams<{ metric: string }>()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<"W" | "M" | "Y">("W")

  // Lines 84-86: EARLY RETURN before subsequent hooks
  if (!metricParam || !isValidMetric(metricParam)) {
    navigate(-1)
    return null
  }

  // Lines 90, 93, 96, 114: Hooks called AFTER early return
  const { data, prevData, isLoading } = useChartData(metric, period)
  const { target } = useTargetData(metric)
  const { data: weekData } = useChartData(metric, "W")
  const { isTodayPersonalBest } = usePersonalBestData(metric)
```

**Issue:** React Router keeps the same MetricChart instance mounted across param changes on the same route (e.g., `/chart/weight` → `/chart/invalid` → `/chart/sleep`). A render with a valid metric calls 7 hooks. A render with an invalid metric calls 3 hooks, then returns. React throws: *"Rendered fewer hooks than during the previous render."* This is a real crash risk.

**Impact:** BLOCKER for SC#4 (and all chart-dependent features). Navigating between valid and invalid metrics causes the app to crash.

---

### CR-04: Editing weekly exercise target retroactively resets the streak (violates D-08)

**File:** `src/hooks/useExerciseLogData.ts:54-68` and `src/components/Dashboard/ExerciseProxyTile.tsx:136`

**Codebase Evidence:**
```typescript
// useExerciseLogData.ts:54-68
const history: { met: boolean }[] = []
for (let i = 0; i < WEEK_LOOKBACK; i++) {
  const weekRef = subWeeks(now, i)
  const bounds = isoWeekBounds(weekRef)
  const entries = ... // fetch week i's entries
  const count = entries.filter((e) => e.logged).length
  history.push({ met: count >= weeklyTarget })  // <-- same current weeklyTarget for ALL weeks
}
```

Also, the `ExerciseProxyTile.tsx:136` comment promises: "this never resets the streak — it's a value edit (D-08)."

**Issue:** Every past week is retroactively marked met/unmet based on the CURRENT weekly target, not the target that was in effect when that week occurred. If a user raises their target (3 → 5 sessions/week), weeks that hit 3-4 sessions are now retroactively unmet, shrinking the streak from (say) 8 weeks to 2 weeks. This directly contradicts D-08 and the 03-03-PLAN.md must-have truth (line 29): "Editing the exercise weekly target does not reset the weekly streak."

**Impact:** BLOCKER for SC#3. Editing the exercise target violates the documented design and resets the streak retroactively.

---

## Additional Issues (Warnings)

### WR-01: Personal-best cache mutation runs as a render-time side effect with no error handling

**File:** `src/hooks/usePersonalBestData.ts:126-154`; invoked from render bodies at `src/components/Dashboard/MetricTile.tsx:237` and `src/components/Charts/MetricChart.tsx:115`

**Issue:** `isTodayPersonalBest` writes to Dexie (`void db.personalBests.put(...)`) as a side effect of being *called* during render (not in a useEffect or event handler). Render should be pure — calling a function with real side effects violates this. Also, the Dexie write's rejection is never observed (no `.catch`), so a failed write silently swallows with no user-visible error.

**Impact:** WARNING — Render purity violation; unhandled promise rejection. Side effects must move to useEffect.

---

### WR-02: Personal-best records are stamped with "today's" date even when the triggering value is from a past date

**File:** `src/components/Charts/MetricChart.tsx:115` and `src/hooks/usePersonalBestData.ts:143`

**Issue:** MetricChart scans the *entire currently-displayed period* (`data.some((d) => isTodayPersonalBest(d.value))`), which for Month/Year periods includes many non-today values. If a past value triggers a new-PB match (e.g., after bulk import), isTodayPersonalBest writes `date: todayISO()` unconditionally, mislabeling the achievement date in the personalBests table.

**Impact:** WARNING — PB audit trail corrupted; badge can appear on Month/Year charts even though nothing was logged today.

---

### WR-03: Target value ceiling only enforced via HTML `max` attribute, not JS-side check

**File:** `src/components/Charts/TargetModal.tsx:62-73`

**Issue:** `handleSubmit` validates `numValue <= 0` but never checks `numValue > MAX_VALUE[metric]`, relying entirely on the native `<input type="number" max={...}>` constraint validation.

**Impact:** WARNING — Fragile validation; silently breaks if noValidate is added to the form or value set programmatically.

---

### WR-04: Invalid weekly-target edits fail silently with no user feedback

**File:** `src/components/Dashboard/ExerciseProxyTile.tsx:50-62`

**Issue:** Unlike TargetModal (which calls `toast.error(...)`), `commitEdit` simply discards invalid edits without explanation:
```typescript
if (Number.isInteger(parsed) && parsed >= MIN_WEEKLY_TARGET && parsed <= MAX_WEEKLY_TARGET) {
  await saveTarget({ value: parsed })
}
setIsEditingTarget(false)  // closes editor WITHOUT feedback
```

**Impact:** WARNING — User sees their input vanish with no indication why. Add `toast.error(...)` to match TargetModal's pattern.

---

### IN-01: Chart's target ReferenceLine doesn't gate on `isTargetEligible`, unlike the badge/CTA row

**File:** `src/components/Charts/MetricChart.tsx:217-230, 261-274`

**Issue:** Status badge/CTA is guarded by `isTargetEligible(metric)`, but the `<ReferenceLine>` only checks `{target && (...)}`. Relies on the invariant that no "temperature" row ever exists in db.targets.

**Impact:** INFO — Defensive coding; should guard consistently.

---

## Requirements Coverage

| Requirement | Phase | Status | Notes |
|-------------|-------|--------|-------|
| TARG-01 | Phase 3 | FAILED | Weight target direction bug (CR-03) + exercise proxy streak reset (CR-04) |
| TARG-02 | Phase 3 | FAILED | Pace projection broken by weight direction bug (CR-03) |
| TARG-03 | Phase 3 | FAILED | Progress bar color coding inverted by direction bug (CR-03) |
| TARG-04 | Phase 3 | FAILED | Color coding unreliable due to CR-03 + CR-01 |
| TARG-05 | Phase 3 | FAILED | Streak reset on exercise target edit (CR-04) violates requirement |
| DASH-03 | Phase 3 | FAILED | Streak management broken for exercise metric (CR-04) |
| PB-01 | Phase 3 | FAILED | Cache poisoning on 0 fallback (CR-01) |
| PB-02 | Phase 3 | FAILED | Badge unreliable due to CR-01 + CR-02 crash risk |

---

## Gaps Summary

The phase has implemented all planned components and hooks, and the 114-unit tests pass. However, four Critical bugs in the integration layer directly contradict the phase success criteria:

1. **Weight targets invert on-track colors when set before any entry** — silently wrong for loss-direction users
2. **Personal-best detection poisons its cache on no-data weeks** — permanently breaks PB detection
3. **React Rules of Hooks violation in chart screen** — crash risk on metric navigation
4. **Exercise target edit retroactively resets streak** — contradicts documented design (D-08)

These are not edge cases or minor UX issues — they are fundamental correctness bugs that make core features produce inverted/corrupted results.

## Next Steps

Before proceeding to Phase 4, all four Critical issues must be resolved:

1. **CR-03:** Recompute weight target direction on first weight entry after a directionless target exists, or block target creation until at least one entry
2. **CR-01:** Remove the 0 fallback; only call PB checks when real data exists
3. **CR-02:** Move hooks before the early return, or guard the component with a route wrapper
4. **CR-04:** Snapshot target values per week, or record target-change events with effective dates

Once fixed, re-run the test suite and human UAT per the original verification checkpoints, then re-submit for verification.

---

_Verified: 2026-09-18T18:15:00Z_
_Verifier: Claude (gsd-verifier)_
_Mode: Initial Verification_
_Review Depth: Standard (4 Critical, 4 Warning, 1 Info found)_
