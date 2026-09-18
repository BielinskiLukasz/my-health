---
phase: 03-targets-goals
plan: 05
subsystem: targets-goals
tags: [dexie, react, targetCalcs, exercise-proxy, weight-target, gap-closure]

# Dependency graph
requires:
  - phase: 03-targets-goals
    provides: "Target engine (03-01), streak/PB math (03-02), exercise proxy tile (03-03) — this plan fixes integration bugs found by 03-REVIEW.md/03-VERIFICATION.md against that code"
provides:
  - "resolveWeightDirection() — backfills a weight target's null/undefined direction from a logged weight value, never re-deriving an already-resolved direction (closes CR-03)"
  - "resolveWeekMet() + Dexie v6 exerciseWeekSnapshots table — freezes each already-elapsed week's met/unmet status against the target in effect at the time (closes CR-04, restores D-08)"
  - "ExerciseProxyTile toast.error(...) on invalid weekly-target edit (closes WR-04)"
affects: [phase-04-training-sessions]

# Actuals (#2632)
actuals:
  tokens: 3422
  tasks: 2
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Backfill-on-write: a Dexie-write path (WeightForm.tsx) opportunistically repairs a related-but-stale target row in its own isolated try/catch, never surfacing that repair's failure as the primary write's error toast"
    - "Frozen-snapshot pattern: a per-period Dexie table (exerciseWeekSnapshots) that is only ever overwritten for the current, still-open period, and read-only for every already-elapsed period — prevents a later parameter edit from retroactively rewriting historical derived state"

key-files:
  created: []
  modified:
    - src/utils/targetCalcs.ts
    - src/utils/targetCalcs.test.ts
    - src/db/schema.ts
    - src/hooks/useTargetData.ts
    - src/components/Log/WeightForm.tsx
    - src/hooks/useExerciseLogData.ts
    - src/components/Dashboard/ExerciseProxyTile.tsx

key-decisions:
  - "Corrected two swapped up/down expected values in the plan's own resolveWeightDirection <behavior> spec (03-05-PLAN.md lines 129-132) — the plan's illustrative examples contradicted inferDirection's own tested contract and the existing useTargetData.ts call-site semantics. Implemented using the semantically-correct formula (matching the plan's <action> block: inferDirection(latestWeightValue, targetValue), the same argument order as the existing production call site) rather than the literal (and backwards) expected outputs in <behavior>. See Deviations below."
  - "Past-week snapshots are only ever written retroactively when that week WAS the current week on some earlier day (i===0 write); pre-existing history that predates this fix's rollout falls back to a live count>=target check using today's weeklyTarget on first read, exactly as the plan's action text specifies — no historical backfill migration was written, matching the plan's explicit scope (CR-04 only prevents FUTURE target edits from retroactively rewriting weeks, it does not retroactively fix weeks computed before this fix existed)."

patterns-established:
  - "Frozen-snapshot derived-state tables (weekStart-keyed) are additive-only Dexie tables, versioned like any other schema addition — never altering prior versions."

requirements-completed: [TARG-01, TARG-02, TARG-03, TARG-04, TARG-05, DASH-03]

coverage:
  - id: D1
    description: "A weight target created before any weight entry exists no longer persists direction:undefined; it persists direction:null, and the next weight save backfills it to the correct up/down value via resolveWeightDirection, without ever re-deriving an already-resolved direction (CR-03)"
    requirement: "TARG-01"
    verification:
      - kind: unit
        ref: "src/utils/targetCalcs.test.ts#resolveWeightDirection"
        status: pass
      - kind: unit
        ref: "npm run build (tsc -b) — Target.direction widening and call-site updates type-check"
        status: pass
    human_judgment: false
  - id: D2
    description: "Editing the exercise weekly target no longer retroactively changes whether an already-elapsed week counted toward the streak; the current, still-open week is still recomputed live every load (CR-04, restores D-08)"
    requirement: "TARG-05"
    verification:
      - kind: unit
        ref: "src/utils/targetCalcs.test.ts#resolveWeekMet"
        status: pass
    human_judgment: true
    rationale: "resolveWeekMet's pure logic is unit-tested, but confirming the end-to-end Dashboard behavior (edit target -> past-week streak unaffected) requires interacting with the running app across multiple simulated weeks/reloads, which is the <human-check> item in 03-05-PLAN.md Task 2 and is deferred to the end-of-phase UAT batch per HUMAN_VERIFY_MODE=end-of-phase."
  - id: D3
    description: "Invalid exercise weekly-target edits show a toast.error(...) instead of silently discarding the input (WR-04)"
    requirement: "TARG-05"
    verification:
      - kind: unit
        ref: "npm run build (tsc -b) — ExerciseProxyTile.tsx toast import/usage type-checks; no dedicated unit test written (UI-level toast call, matches existing untested TargetModal.tsx pattern)"
        status: pass
    human_judgment: true
    rationale: "Toast visibility is a UI/UX confirmation best verified by a human seeing the toast render; also part of the same 03-05-PLAN.md Task 2 <human-check> item, deferred to end-of-phase UAT."

duration: 18min
completed: 2026-09-18
status: complete
---

# Phase 03 Plan 05: Gap-Closure — Weight Direction Backfill & Exercise Streak Freeze Summary

**Fixed two Critical + one Warning defect from 03-REVIEW.md/03-VERIFICATION.md: weight targets set before any entry no longer invert on-track color (CR-03), editing the exercise weekly target no longer retroactively rewrites past weeks' streak status (CR-04), and invalid weekly-target edits now show a toast error (WR-04).**

## Performance

- **Duration:** 18 min
- **Started:** 2026-09-18T17:41:00Z (approx, following 03-04's completion)
- **Completed:** 2026-09-18T17:58:07Z
- **Tasks:** 2
- **Files modified:** 7 (6 source + 1 test)

## Accomplishments
- `resolveWeightDirection()` in `targetCalcs.ts` backfills a weight target's still-unresolved direction the moment a weight entry is logged, and is provably idempotent against an already-resolved direction (never re-infers/flips it)
- `Target.direction` widened to `"up" | "down" | null`; `useTargetData.saveTarget` now persists an explicit `null` (never a bare `undefined`) for weight targets created before any entry exists — closing the exact silent-inversion bug CR-03 described
- `WeightForm.tsx` backfills the target direction immediately after every successful weight save, isolated in its own try/catch so a backfill failure can never surface as a failed weight-save toast
- `resolveWeekMet()` + a new additive Dexie v6 `exerciseWeekSnapshots` table freeze each already-elapsed week's met/unmet status the first time it is computed as the current week; a later-edited `weeklyTarget` can never retroactively recompute it — restoring the D-08 "editing a target never resets the streak" guarantee for the exercise proxy
- `ExerciseProxyTile.commitEdit` now calls `toast.error(...)` on an invalid weekly-target edit, matching `TargetModal.tsx`'s existing pattern (WR-04)

## Task Commits

Each task was committed with its own RED/GREEN pair:

1. **Both tasks' RED tests** - `85d7611` (test: failing tests for resolveWeightDirection + resolveWeekMet)
2. **Task 1: Weight target direction backfill (CR-03)** - `252981e` (feat)
3. **Task 2: Exercise weekly-streak snapshot (CR-04) + invalid-edit toast (WR-04)** - `61983ac` (feat)

**Plan metadata:** (this commit, following SUMMARY.md creation)

_Note: both RED tests were written together in a single commit since they were authored in one pass over `targetCalcs.test.ts`; each task's own GREEN implementation commit followed separately, preserving the RED-before-GREEN gate per task._

## Files Created/Modified
- `src/utils/targetCalcs.ts` - Added `resolveWeightDirection()` and `resolveWeekMet()`; widened `getOnTrackStatus`/`meetsTargetForDay`'s `direction` param type to include `null`
- `src/utils/targetCalcs.test.ts` - 9 new tests (`resolveWeightDirection` x5, `resolveWeekMet` x4)
- `src/db/schema.ts` - Widened `Target.direction` to `"up" | "down" | null`; added `ExerciseWeekSnapshot` interface + Dexie v6 additive migration
- `src/hooks/useTargetData.ts` - `saveTarget` persists explicit `null` (not `undefined`) for a directionless weight target
- `src/components/Log/WeightForm.tsx` - Backfills weight target direction after every successful save, isolated try/catch
- `src/hooks/useExerciseLogData.ts` - History loop now freezes/reads `exerciseWeekSnapshots`; only the current week is recomputed live each load
- `src/components/Dashboard/ExerciseProxyTile.tsx` - `commitEdit` shows `toast.error(...)` on invalid input

## Decisions Made
- Implemented `resolveWeightDirection`'s backfill formula per the plan's `<action>` block (`inferDirection(latestWeightValue, targetValue)` — same argument order as the existing `useTargetData.ts` call site), not per two of the plan's `<behavior>` block's illustrative expected outputs, which had up/down swapped relative to `inferDirection`'s own tested contract. See Deviations below for full detail.
- No historical migration script was written to retroactively populate `exerciseWeekSnapshots` for weeks that predate this fix; those weeks fall back to a live `count >= currentWeeklyTarget` check on first read (matching the plan's explicit action text) — acceptable because CR-04's contract is forward-looking (a target edit going forward must not rewrite history), not a promise to reconstruct target history that was never recorded.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug in plan's own test spec] Corrected two swapped expected values in `resolveWeightDirection`'s `<behavior>` block**
- **Found during:** Task 1, RED phase (writing the failing tests)
- **Issue:** 03-05-PLAN.md's `<behavior>` block states `resolveWeightDirection(undefined, 70, 65)` returns `"down"` and `resolveWeightDirection(null, 70, 75)` returns `"up"`. Independently re-deriving these from `inferDirection`'s actual, tested implementation (`return targetValue < currentValue ? "down" : "up"`) and the plan's own `<action>` block (which specifies calling `inferDirection(latestWeightValue, targetValue)` — current weight then target weight, the same order the existing `useTargetData.ts` call site already uses) produces the opposite results: currently weighing 65kg with a target of 70kg means the user needs to *gain* weight (`"up"`), and currently weighing 75kg with a target of 70kg means the user needs to *lose* weight (`"down"`). The plan's two illustrative examples had these swapped — implementing them literally would have re-introduced a real direction-inversion bug inside the very backfill mechanism meant to fix CR-03's direction-inversion bug.
- **Fix:** Implemented `resolveWeightDirection` per the plan's `<action>` block's formula (matching the established, tested `inferDirection` contract and the existing `useTargetData.ts` call-site semantics), and wrote the RED test's expected values to match that correct semantics (`resolveWeightDirection(undefined, 70, 65)` → `"up"`; `resolveWeightDirection(null, 70, 75)` → `"down"`). The three other behavior examples (idempotence x2, null-passthrough) were unaffected and implemented as literally specified.
- **Files modified:** `src/utils/targetCalcs.ts`, `src/utils/targetCalcs.test.ts`
- **Verification:** `npm test -- targetCalcs` passes all 69 (Task 1) / 69 (Task 2, unchanged) tests; the must_haves backstop truth ("direction once resolved to up/down is never silently re-derived") and the edge-probe truth (inferDirection's own tie-break contract unchanged) both hold under this implementation.
- **Committed in:** `85d7611` (RED test with corrected values), `252981e` (GREEN implementation)

---

**Total deviations:** 1 auto-fixed (1 bug in plan's own test spec, corrected before it could regress the fix it was meant to verify)
**Impact on plan:** Necessary correction — implementing the plan's literal (incorrect) expected values would have shipped a new direction-inversion bug inside CR-03's own fix. No scope creep; the actual `<action>` block's formula (and the plan's must_haves) were followed exactly.

## Issues Encountered
None beyond the deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three defects targeted by this gap-closure plan (CR-03, CR-04, WR-04) are fixed, unit-tested, and type-checked; full test suite (127/127) and build pass with no regressions.
- The `<human-check>` item in Task 2's `<verify>` block (mark exercised today, edit the weekly target up, confirm past weeks' streak status is unaffected, and confirm an invalid edit shows a toast) is deferred to the end-of-phase UAT batch per `HUMAN_VERIFY_MODE=end-of-phase` — not a blocker for this plan's completion, but should be included in Phase 03's consolidated UAT pass alongside 03-04's own deferred human-check items.
- This is the last plan in Phase 03 (5 of 5); once the end-of-phase UAT batch (including this plan's and 03-04's human-check items) is run and passes, Phase 03 can be marked complete and re-submitted to `/gsd-verify-work` for re-verification against 03-VERIFICATION.md's 4 gaps.

---
*Phase: 03-targets-goals*
*Completed: 2026-09-18*

## Self-Check: PASSED

All 7 modified source files and this SUMMARY.md verified present on disk; all 4 commits
(`85d7611`, `252981e`, `61983ac`, `622ee7f`) verified present in `git log --oneline --all`.
