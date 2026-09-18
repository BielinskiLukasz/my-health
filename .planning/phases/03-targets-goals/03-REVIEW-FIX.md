---
phase: 03-targets-goals
fixed_at: 2026-09-18T21:00:00Z
review_path: .planning/phases/03-targets-goals/03-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 03: Code Review Fix Report

**Fixed at:** 2026-09-18T21:00:00Z
**Source review:** .planning/phases/03-targets-goals/03-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (CR-01, WR-01, WR-02, WR-03 — `fix_scope: critical_warning`, so IN-01 was excluded)
- Fixed: 4
- Skipped: 0

**Verification performed in:** main checkout (`workflow.use_worktrees: false` in `.planning/config.json`, so no isolated worktree was created for this run — edits and commits happened directly on `develop`).

## Fixed Issues

### CR-01: `usePersonalBestData`'s own cache-bump defeats its own "new PB" detection

**Files modified:** `src/hooks/usePersonalBestData.ts`
**Commit:** `ffeb612`
**Applied fix:** Removed `cachedBests` from the dependency array of the detect+persist effect (it was both a dependency and something the effect mutates via `setCachedBests`, causing the effect to immediately re-fire against its own just-written value and overwrite `isPersonalBest(true)` back to `false` one render later). Added a `cachedBestsRef` kept in sync by a small separate effect (`useEffect(() => { cachedBestsRef.current = cachedBests }, [cachedBests])`), and changed the detect effect's loop to read `cachedBestsRef.current` instead of `cachedBests` directly. The effect's own dependency array is now `[eligible, metric, valueToCheck]`, matching the reviewer's suggested fix exactly.
**Verification:** `npm test -- personalBest` → 20/20 passed. `npm test` (full suite) → 127/127 passed. `npm run build` → succeeded (tsc + vite build, pre-existing chunk-size warning only, unrelated to this change).

### WR-01: Exercise-streak "frozen snapshot" fix only protects weeks the app was opened during

**Files modified:** `src/hooks/useExerciseLogData.ts`
**Commit:** `0ea50a7`
**Applied fix:** In the past-week branch (`i >= 1`) of the history loop, when `db.exerciseWeekSnapshots.get(bounds.start)` returns `undefined` (the week was never viewed while current), the hook now immediately persists a snapshot for it — computed once from the actual historical entry count against the live `weeklyTarget` at the moment of discovery — via `db.exerciseWeekSnapshots.put(...)`, instead of only ever recomputing it live on every subsequent read. This does not fully close the gap the reviewer describes (the very first snapshot for a skipped week is still resolved against whatever `weeklyTarget` happens to be live at the moment it's first discovered missing, not necessarily the target that was actually in effect during that historical week — full closure would require a target-value history table keyed by effective date, which the reviewer themselves flagged as the complete fix but is a materially larger schema/feature change out of scope for an atomic fix). It does close the more severe part of the bug the review demonstrates: previously, a skipped week re-evaluated against the *live* target on **every single read** forever, so a later target edit could keep flipping it back and forth indefinitely. After this fix, the week is frozen the first time the gap is discovered and stops drifting on all subsequent reads, matching the "at minimum" fallback the reviewer proposed (treat a never-snapshotted past week as resolved-once rather than perpetually re-derived from a moving live target).
**Verification:** `npm test` (full suite) → 127/127 passed (no dedicated hook test exists for this path, consistent with 03-04/03-05-SUMMARY.md's noted absence of hook-testing infra in this repo). `npm run build` → succeeded.

### WR-02: `WeightForm.tsx` has no `NaN`/negative guard on the parsed weight value

**Files modified:** `src/components/Log/WeightForm.tsx`
**Commit:** `f45a7db`
**Applied fix:** Mirrored `TargetModal.tsx`'s validation pattern exactly: `parseFloat(value)` is now checked with `isNaN(numValue) || numValue <= 0` immediately after parsing and before any Dexie write, showing `toast.error("Enter a valid weight.")` and returning early on failure. This also transitively protects the CR-03 `resolveWeightDirection` backfill immediately below it in the same handler, since a `NaN`/negative value can no longer reach `db.weights.add`/`update` or the direction-backfill call.
**Verification:** `npm test` (full suite) → 127/127 passed. `npm run build` → succeeded.

### WR-03: Target value ceiling (`MAX_VALUE`) only enforced via the HTML `max` attribute

**Files modified:** `src/components/Charts/TargetModal.tsx`
**Commit:** `4b0a8a4`
**Applied fix:** Applied the reviewer's exact suggested fix — `handleSubmit`'s validation now also checks `numValue > MAX_VALUE[metric]` alongside the existing `isNaN`/`<= 0` checks, showing `toast.error(\`Enter a value between 0 and ${MAX_VALUE[metric]}.\`)` on failure, so the ceiling is enforced in JS and not solely via the native `<input max={...}>` constraint.
**Verification:** `npm test` (full suite) → 127/127 passed. `npm run build` → succeeded.

## Skipped Issues

None — all 4 in-scope findings (CR-01, WR-01, WR-02, WR-03) were fixed. IN-01 was out of scope for this run (`fix_scope: critical_warning` excludes Info-tier findings) and was left untouched.

---

_Fixed: 2026-09-18T21:00:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
