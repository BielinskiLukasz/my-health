---
phase: 03-targets-goals
reviewed: 2026-09-18T19:30:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/components/Charts/MetricChart.tsx
  - src/components/Charts/TargetModal.tsx
  - src/components/Dashboard/Dashboard.tsx
  - src/components/Dashboard/ExerciseProxyTile.tsx
  - src/components/Dashboard/MetricTile.tsx
  - src/components/Log/WeightForm.tsx
  - src/db/schema.ts
  - src/hooks/useExerciseLogData.ts
  - src/hooks/usePersonalBestData.ts
  - src/hooks/useStreakData.ts
  - src/hooks/useTargetData.ts
  - src/utils/personalBest.test.ts
  - src/utils/personalBest.ts
  - src/utils/targetCalcs.test.ts
  - src/utils/targetCalcs.ts
findings:
  critical: 1
  warning: 3
  info: 1
  total: 5
status: issues_found
---

# Phase 03: Code Review Report (post gap-closure re-review)

**Reviewed:** 2026-09-18T19:30:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

This is a re-review of Phase 3 after the two gap-closure plans (03-04, 03-05) that were written to fix the original review's four Critical and several Warning findings (CR-01..CR-04, WR-01, WR-02, WR-04 — see the previous revision of this file, preserved in git history, and `03-VERIFICATION.md`).

Verified fixed and sound on re-inspection:
- **CR-02** (Rules of Hooks violation in `MetricChart.tsx`) — all hooks are now called unconditionally; the invalid-metric case redirects via a post-hook `useEffect` and returns `null` after every hook call. Confirmed correct.
- **CR-03** (weight target direction defaulting to `undefined`) — `direction` is now persisted as an explicit `null`, and `WeightForm.tsx` backfills it via `resolveWeightDirection` on the next weight save. The "grey below 7 data points" guard in `getOnTrackStatus` also shields the window between target creation and the first weight entry, so the inversion described in the original CR-03 cannot manifest in practice. Confirmed correct.
- **WR-04** (silent invalid exercise-target edit) — `ExerciseProxyTile.commitEdit` now calls `toast.error(...)`. Confirmed correct.

However, the fix for **CR-01/WR-01/WR-02** (personal-best cache poisoning / render-purity / wrong PB date) introduced a **new Critical regression**: the "Personal best" badge now reliably fails to display for genuinely new personal bests, because the detection effect's own cache-bump feeds back into its own dependency array and immediately overwrites the correct `true` state with `false` on the very next tick (CR-01 below, freshly numbered for this review). The fix for **CR-04** (exercise streak retroactive rewrite) is also only a partial closure — weeks the user never viewed while they were "current" still fall back to a live re-check against today's target (WR-01 below). Two further, previously-unflagged issues were found (WR-02, and the still-outstanding WR-03/IN-01 carried forward from the prior review, which remain unfixed).

## Critical Issues

### CR-01: `usePersonalBestData`'s own cache-bump defeats its own "new PB" detection — the badge and toast never actually reach the user

**File:** `src/hooks/usePersonalBestData.ts:139-171`
**Issue:**
```ts
useEffect(() => {
  ...
  for (const cb of cachedBests) {
    if (!isNewPersonalBest(value, cb.value, cb.direction)) continue
    matched = true
    ...
    if (!bumpedRef.current.has(key)) {
      bumpedRef.current.add(key)
      db.personalBests.put({ metric: pbMetric, direction: cb.direction, value, date }).catch(...)
      setCachedBests((prev) => prev.map((p) => (p.direction === cb.direction ? { ...p, value } : p)))
    }
  }
  setIsPersonalBest(matched)
}, [eligible, metric, valueToCheck, cachedBests])
```
Trace through a genuine new personal best (e.g. `cachedBests = [{direction: "min", value: 75}]`, `valueToCheck = 70`):

1. **Run A** (triggered by `valueToCheck` changing): loop finds `cb.value=75` is beaten by `70` → `matched = true`. `setCachedBests` bumps the cache to `[{direction:"min", value:70}]` and `setIsPersonalBest(true)` is called. Both state updates are batched into one re-render.
2. Because `cachedBests` is itself a dependency of this same effect, and its reference just changed (Run A called `setCachedBests`), React re-runs the effect again — **Run B** — with the *already-bumped* `cachedBests = [{direction:"min", value:70}]` and the same `valueToCheck = 70`.
3. In Run B, `isNewPersonalBest(70, 70, "min")` is now an exact tie → `false`. `matched` stays `false`. `setIsPersonalBest(false)` fires, **overwriting the `true` set in Run A**.

The end state that the UI actually settles on is `isPersonalBest = false`. The Dexie write from Run A does correctly persist the new best (so the underlying cache is *not* poisoned — CR-01/CR-02/WR-01/WR-02 from the previous review are genuinely fixed at the data layer), but the visible "🏆 Personal best!" badge in `MetricTile.tsx:321-325` and `MetricChart.tsx:164-168` will never render for any forward-detected personal best, because the very effect meant to show it immediately self-corrects to hide it one render later. This reproduces identically on every future new-PB event (not just once), because the same self-correction happens every time `cachedBests` is bumped.

This is a genuine, demonstrable regression introduced by the 03-04 gap-closure fix (not present in the pre-fix code, which had different, if incorrectly-triggered, logic). It defeats the entire purpose of the CR-01 fix and directly undermines phase Success Criterion #4 ("App automatically detects personal bests... and flags them").

**Fix:** Don't include `cachedBests` in the dependency array of the effect that also mutates it — read the latest cache via a ref instead, so the bump doesn't cause the effect to immediately re-evaluate against its own just-written value:
```ts
const cachedBestsRef = useRef(cachedBests)
useEffect(() => { cachedBestsRef.current = cachedBests }, [cachedBests])

useEffect(() => {
  if (!eligible || valueToCheck === null) {
    setIsPersonalBest(false)
    return
  }
  const pbMetric = metric as PbEligibleMetric
  const value = valueToCheck
  let matched = false
  for (const cb of cachedBestsRef.current) {
    if (!isNewPersonalBest(value, cb.value, cb.direction)) continue
    matched = true
    const key = `${pbMetric}:${cb.direction}:${value}`
    if (!bumpedRef.current.has(key)) {
      bumpedRef.current.add(key)
      db.personalBests
        .put({ metric: pbMetric, direction: cb.direction, value, date: todayISO() })
        .catch(() => bumpedRef.current.delete(key))
      setCachedBests((prev) => prev.map((p) => (p.direction === cb.direction ? { ...p, value } : p)))
    }
  }
  setIsPersonalBest(matched)
}, [eligible, metric, valueToCheck]) // cachedBests intentionally excluded
```
Add a regression test (or, since no hook-testing infra exists in this repo yet per 03-04-SUMMARY.md, at minimum a manual UAT step) that logs a value which beats an already-cached best and asserts the badge is still `true` after the effect settles — the existing `personalBest.test.ts`/`targetCalcs.test.ts` suites only test the pure functions and would never catch this, since the bug lives entirely in the hook's effect wiring.

## Warnings

### WR-01: Exercise-streak "frozen snapshot" fix (CR-04) only protects weeks the app was opened during — a week skipped entirely still gets retroactively re-judged by a later target edit

**File:** `src/hooks/useExerciseLogData.ts:61-83`
**Issue:** The freeze mechanism only ever writes a snapshot for week `i===0` (the current, still-open week) on every load:
```ts
if (i === 0) {
  const met = resolveWeekMet(undefined, currentWeekCount, weeklyTarget)
  await db.exerciseWeekSnapshots.put({ weekStart: bounds.start, met })
  history.push({ met })
  continue
}
const snapshot = await db.exerciseWeekSnapshots.get(bounds.start)
...
history.push({ met: resolveWeekMet(snapshot, count, weeklyTarget) })
```
A week only ever gets a persisted snapshot if the user had the dashboard open at least once *while that week was still current*. If a user doesn't open the app at all during a given week (a very plausible gap — a week off, a busy week, etc.), that week never transitions through the `i===0` branch, so no snapshot is ever written for it. The next time it's read (now as `i>=1`), `db.exerciseWeekSnapshots.get(bounds.start)` returns `undefined`, and `resolveWeekMet(undefined, count, weeklyTarget)` falls back to a **live** `count >= weeklyTarget` check using whatever the *current* (possibly since-edited) `weeklyTarget` is — reproducing the exact CR-04 defect (a later target edit retroactively flips an already-elapsed week's met/unmet status) for any week that was skipped rather than "aged out" of the current-week slot. This is explicitly acknowledged as an accepted limitation in `03-05-SUMMARY.md` ("no historical backfill migration was written... acceptable because CR-04's contract is forward-looking"), but it means the original bug is only closed for the common case, not the general one, and can still visibly regress the streak for anyone who doesn't open the app every single week — which contradicts the unconditional phrasing of the still-standing code comment in `ExerciseProxyTile.tsx` ("D-08: this never resets the streak").
**Fix:** When a snapshot is missing for a past week (`i>=1`, `snapshot === undefined`), persist one immediately using the actual historical entry count against a target value that predates the current live edit if any such record is available (e.g. store a `weeklyTarget` history table keyed by effective date), rather than silently defaulting to today's live target. At minimum, document this as a known limitation surfaced to the user (e.g. don't silently recompute — treat a never-snapshotted past week as "unknown" rather than pass-through to a live check against a target that wasn't in effect then).

### WR-02: `WeightForm.tsx` has no `NaN`/negative guard on the parsed weight value, unlike `TargetModal.tsx`'s validation in the same phase — and a malformed value can also corrupt the CR-03 direction backfill

**File:** `src/components/Log/WeightForm.tsx:60-97`
**Issue:**
```ts
const numValue = parseFloat(value)
if (editingId !== undefined) {
  await db.weights.update(editingId, { value: numValue, timestamp: new Date().toISOString() })
} else {
  await db.weights.add({ date: currentDate, value: numValue, timestamp: new Date().toISOString() })
}
...
const resolvedDirection = resolveWeightDirection(weightTarget.direction, weightTarget.value, numValue)
```
Unlike `TargetModal.tsx:65-69` (`if (!value || isNaN(numValue) || numValue <= 0) { toast.error(...); return }`), `WeightForm.tsx` never checks `isNaN(numValue)` or `numValue <= 0` before writing to Dexie. The `!value` guard on line 62 only rejects an empty string; native `<input type="number">` constraint validation is the only thing standing between a malformed value and a `NaN`/negative write to `db.weights`, and it is not bullet-proof across all browsers/input methods (paste, autofill, IME input, programmatic value-setting). If a `NaN` does get through, two things happen: (1) `db.weights` permanently gains a corrupt row that all downstream mean/streak/chart math will silently propagate as `NaN`; (2) it also directly feeds this exact phase's own CR-03 backfill — `resolveWeightDirection(null, targetValue, NaN)` calls `inferDirection(NaN, targetValue)`, and since every comparison against `NaN` is `false`, `inferDirection` unconditionally returns `"up"` regardless of the user's actual target, silently locking in the wrong direction for a weight-loss goal.
**Fix:** Mirror `TargetModal.tsx`'s validation:
```ts
const numValue = parseFloat(value)
if (!value || isNaN(numValue) || numValue <= 0) {
  toast.error("Enter a valid weight.")
  setIsLoading(false)
  return
}
```

### WR-03: Target value ceiling (`MAX_VALUE`) is still only enforced via the HTML `max` attribute, with no JS-side check (carried forward, unfixed)

**File:** `src/components/Charts/TargetModal.tsx:65-69`
**Issue:** Unchanged since the original review: `handleSubmit` validates `numValue <= 0` but never checks `numValue > MAX_VALUE[metric]`, relying entirely on the native `<input type="number" max={...}>` constraint validation to block out-of-range submissions. This was flagged in the pre-gap-closure review (WR-03) and was not part of either 03-04's or 03-05's scope, so it remains open.
**Fix:**
```ts
if (!value || isNaN(numValue) || numValue <= 0 || numValue > MAX_VALUE[metric]) {
  toast.error(`Enter a value between 0 and ${MAX_VALUE[metric]}.`)
  return
}
```

## Info

### IN-01: Chart's target `ReferenceLine` still doesn't gate on `isTargetEligible` (carried forward, unfixed)

**File:** `src/components/Charts/MetricChart.tsx:228-241, 272-285`
**Issue:** Unchanged since the original review: the status badge/CTA row is guarded by `isTargetEligible(metric)` (line 171), but both `<ReferenceLine>` renderings (line-chart and bar-chart branches) only check `{target && (...)}`, relying entirely on the invariant that no `"temperature"` row can exist in `db.targets`. Not addressed by 03-04/03-05 (out of their stated scope), so it remains open.
**Fix:** Guard consistently: `{target && isTargetEligible(metric) && (<ReferenceLine .../>)}`.

---

_Reviewed: 2026-09-18T19:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
