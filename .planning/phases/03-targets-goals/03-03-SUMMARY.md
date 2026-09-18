---
phase: 03-targets-goals
plan: 03
subsystem: dashboard-targets
tags: [dexie-v5, exercise-proxy, weekly-streak, dashboard-tile]
requires:
  - phase: 03-targets-goals
    provides: "Plan 03-01's targets table + useTargetData hook; Plan 03-02's calculateWeeklyStreak"
provides:
  - "Dexie v5 exerciseLog table (date + logged boolean, one row per day)"
  - "getExerciseWeeklyStatus pure function (green/yellow/red, no grey case)"
  - "useExerciseLogData hook — weekly count, today-toggle, 52-week met-history"
  - "7th Dashboard tile (ExerciseProxyTile) with settable weekly target, same-day toggle, status badge, week-streak"
affects: [phase-4-training-sessions, dashboard]
actuals:
  tokens: 22000
  tasks: 2
  commits: 3
tech-stack:
  added: []
  patterns:
    - "Exercise-proxy weekly status is a distinct 3-state function (green/yellow/red) with no grey branch, unlike the 4-state getOnTrackStatus used by the other 6 metrics"
    - "toggleToday() reads the existing exerciseLog row fresh from Dexie (not from stale hook state) before writing, always keyed on todayISO()"
key-files:
  created:
    - src/hooks/useExerciseLogData.ts
    - src/components/Dashboard/ExerciseProxyTile.tsx
  modified:
    - src/db/schema.ts
    - src/utils/targetCalcs.ts
    - src/utils/targetCalcs.test.ts
    - src/components/Dashboard/Dashboard.tsx
key-decisions:
  - "Default weekly target of 3 sessions/week when no target row exists yet, per plan's Claude's-discretion note"
  - "Inline tap-to-edit target number (no modal) since no /chart/:metric screen exists for the exercise proxy"
patterns-established:
  - "Weekly (not daily) streak history array — {met: boolean}[] most-recent-week-first — feeds the existing calculateWeeklyStreak from Plan 03-02 without any new streak-calculation code"
requirements-completed: [TARG-01, TARG-04, DASH-03]
coverage:
  - id: D1
    description: "getExerciseWeeklyStatus returns green/yellow/red with no grey branch, matching UI-SPEC thresholds"
    requirement: "TARG-04"
    verification:
      - kind: unit
        ref: "src/utils/targetCalcs.test.ts#getExerciseWeeklyStatus"
        status: pass
    human_judgment: false
  - id: D2
    description: "Dexie schema at version 5 with exerciseLog table, versions 1-4 unmodified"
    requirement: "TARG-01"
    verification:
      - kind: unit
        ref: "npm run build (tsc type-check against EntityTable<ExerciseLog, \"date\">)"
        status: pass
    human_judgment: false
  - id: D3
    description: "7th Dashboard tile renders unconditionally with weekly count, toggle, status badge, and week streak"
    requirement: "DASH-03"
    verification: []
    human_judgment: true
    rationale: "Visual placement, styling, and toggle interaction on the live Dashboard require human eyes — no automated UI test exists for this tile yet."
  - id: D4
    description: "toggleToday() always writes to todayISO(), never the Dashboard's selected currentDate"
    requirement: "TARG-01"
    verification: []
    human_judgment: true
    rationale: "Requires manually navigating the Dashboard to a past date, then confirming the toggle still only affects today's exerciseLog row — a runtime/IndexedDB behavior not covered by targetCalcs.test.ts's pure-function tests."
duration: 20min
completed: 2026-09-18
status: complete
---

# Phase 3 Plan 3: Exercise Frequency Proxy Summary

**Dexie v5 exerciseLog table backing a 7th Dashboard tile with a settable weekly-session target, same-day toggle, and consecutive-week streak reusing Plan 03-02's calculateWeeklyStreak.**

## Performance
- **Duration:** ~20min
- **Started:** 2026-09-18T15:38:00Z
- **Completed:** 2026-09-18T15:46:03Z
- **Tasks:** 2
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments
- Delivered TARG-01's "exercise frequency" target as the lightweight proxy D-01 calls for: a new minimal `exerciseLog` Dexie table (one boolean row per day) at schema version 5, additive-only over versions 1-4.
- Added `getExerciseWeeklyStatus` — a dedicated 3-state (green/yellow/red, no grey) status function distinct from the 6-metric `getOnTrackStatus`, since the exercise proxy always has a defined weekly count once a target exists (D-05 doesn't apply here the same way).
- Built `useExerciseLogData` — computes the current Monday-Sunday ISO week's session count, today's toggle state, and a 52-week met-history array for the streak calculation, entirely bounded queries (never a full-table scan, T-03-08).
- Shipped `ExerciseProxyTile` as the Dashboard's unconditional 7th tile (D-07): "N/target this week" count, a "Mark as exercised" / "Exercised today ✓" toggle, inline tap-to-edit weekly target (1-14 range, T-03-09), status badge, and "N week streak" label (D-17 — always "week", never "day").

## Task Commits
1. **Task 1: Exercise weekly-status function + Dexie v5** - `e488610` (test, RED) / `1262e80` (feat, GREEN)
2. **Task 2: Exercise proxy hook + 7th Dashboard tile** - `ada2d54` (feat)

## Files Created/Modified
- `src/db/schema.ts` - Added `ExerciseLog` interface + Dexie `version(5).stores({ exerciseLog: "date" })`, chained after version(4); versions 1-4 untouched.
- `src/utils/targetCalcs.ts` - Added `getExerciseWeeklyStatus(weekCount, weeklyTarget)`.
- `src/utils/targetCalcs.test.ts` - Added `describe("getExerciseWeeklyStatus", ...)` covering green/yellow/red/no-grey cases.
- `src/hooks/useExerciseLogData.ts` - New hook: weekly count, today-logged state, `toggleToday()` (always keyed on `todayISO()`), 52-week met-history for streak.
- `src/components/Dashboard/ExerciseProxyTile.tsx` - New 7th tile component: count display, toggle button, inline-editable target, status badge, streak label.
- `src/components/Dashboard/Dashboard.tsx` - Inserted `<ExerciseProxyTile />` in a full-width `col-span-2` slot after the temperature tile, before the `ActivityHeatmap`.

## Decisions Made
- **Default weekly target = 3 sessions/week** before any target row exists — Claude's discretion per the plan, a sensible starting cadence; the tile always renders in full (count/toggle/status/streak) rather than an empty-state hint, per this plan's explicit `must_haves.truths` overriding the general UI-SPEC "no target = hint only" pattern for the other 6 metrics.
- **Inline tap-to-edit target number** (no modal, no `/chart/:metric` equivalent) since the exercise proxy has no dedicated chart screen — tapping the target digit swaps it for a bounded `<input type="number" min="1" max="14">`, committed on blur/Enter.
- **`toggleToday()` reads the existing row fresh from Dexie** (`db.exerciseLog.get(todayISO())`) rather than trusting the hook's own `todayLogged` state at call time, avoiding any stale-closure risk while still always writing to `todayISO()` — directly satisfies the T-03-07 mitigation and the plan's prohibition against writing to a non-today date.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required
None - no external service configuration required.

## Threat Flags

None - all three threats in this plan's `<threat_model>` (T-03-07, T-03-08, T-03-09) were mitigated directly in the implementation as specified (see key-decisions above), with no new unmitigated surface introduced.

## Pending Human Verification (collected for end-of-phase UAT)

Per `workflow.human_verify_mode: end-of-phase`, this task's `<verify><human-check>` was not run interactively during execution. Recorded here for the phase-level verifier to include in the UAT pass:

- On the Dashboard, the 7th "Exercise" tile shows "0/3 this week" with a "Mark as exercised" button; tapping it flips to "Exercised today ✓" and the count becomes "1/3"; the status badge and week-streak label update accordingly.
- Tap the target number, change it to 5, and confirm the tile now reads "1/5 this week" without the streak resetting.
- Navigate the Dashboard's date picker to a past date, tap "Mark as exercised" again, and confirm the write still lands on today's `exerciseLog` row (not the selected past date) — T-03-07's mitigation, not covered by an automated test.

## Next Phase Readiness

Phase complete, ready for next step.

All three plans in Phase 3 (Targets & Goals) are now executed:
- 03-01: Deadlined targets, projected pace, on-track color coding for weight/sleep/steps/water/heartRate.
- 03-02: Per-metric daily streaks and personal-best detection.
- 03-03 (this plan): Exercise-frequency proxy as the 7th Dashboard tile, closing out TARG-01/TARG-04/DASH-03.

No blockers. The `exerciseLog` table's minimal one-row-per-day boolean shape is intentionally scoped to migrate cleanly into Phase 4's real training-session schema (D-01's reversibility note) — Phase 4 planning should read this table's shape before designing the full session model.

## Self-Check: PASSED

- FOUND: src/hooks/useExerciseLogData.ts
- FOUND: src/components/Dashboard/ExerciseProxyTile.tsx
- FOUND: exerciseLog table in src/db/schema.ts
- FOUND: getExerciseWeeklyStatus in src/utils/targetCalcs.ts
- FOUND: ExerciseProxyTile wired into src/components/Dashboard/Dashboard.tsx
- FOUND: commit e488610 (test)
- FOUND: commit 1262e80 (feat)
- FOUND: commit ada2d54 (feat)

---
*Phase: 03-targets-goals*
*Completed: 2026-09-18*
