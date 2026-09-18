---
phase: 03-targets-goals
plan: 02
subsystem: targets-streaks-personal-bests
tags: [dexie, streak-calculation, personal-best-detection, tdd, dashboard-tile, chart-screen]
requires:
  - phase: 03-targets-goals
    provides: "Plan 03-01's target/pace foundation (targetCalcs.ts TOLERANCES/getOnTrackStatus, useTargetData, Dexie v3 targets table, MetricTile/MetricChart target wiring)"
provides:
  - "meetsTargetForDay/calculateStreak/calculateWeeklyStreak pure daily-check and walk-back streak engines in targetCalcs.ts"
  - "detectPersonalBest/isNewPersonalBest/PB_METRICS pure personal-best engine in personalBest.ts"
  - "Dexie v4 personalBests cache table (additive, chained after v3)"
  - "useStreakData and usePersonalBestData Dexie-backed hooks"
  - "Streak label + PB badge wired into MetricTile.tsx (Dashboard) and MetricChart.tsx (chart screen)"
affects: [phase-04-training-sessions, phase-05-history-list]
actuals:
  tokens: 7825
  tasks: 3
  commits: 5
tech-stack:
  added: []
  patterns:
    - "Two-pass backward walk for streak calculation: pass 1 collects raw per-day values (up to 365-day bound), pass 2 resolves weight's chronologically-nearest-earlier previousValue before calling meetsTargetForDay"
    - "Personal-best cache-then-compare: retroactive full-table scan runs once per metric/direction (cached in personalBests), then isTodayPersonalBest does an in-memory strict-improvement check against the cache, bumping the cache forward when a genuine new PB is detected"
key-files:
  created:
    - src/utils/personalBest.ts
    - src/utils/personalBest.test.ts
    - src/hooks/useStreakData.ts
    - src/hooks/usePersonalBestData.ts
  modified:
    - src/utils/targetCalcs.ts
    - src/utils/targetCalcs.test.ts
    - src/db/schema.ts
    - src/components/Dashboard/MetricTile.tsx
    - src/components/Charts/MetricChart.tsx
key-decisions:
  - "WEIGHT_STEADY_TOLERANCE (0.2kg) kept as a distinct constant from targetCalcs.ts's existing TOLERANCES.weight (0.5kg) — the daily streak check (D-15) and the 7-day pace/color check (D-09-D-12) are deliberately different tolerances for different purposes"
  - "detectPersonalBest resolves exact-value ties by sorting ascending by date and keeping the first-encountered match — deterministic tie-break for the retroactive scan (D-22)"
  - "usePersonalBestData bumps the personalBests cache forward (via a ref-guarded Dexie put) whenever isTodayPersonalBest detects a genuine strict improvement — without this, a stale cache would fail to suppress the badge on a later exact tie against the TRUE current best"
patterns-established:
  - "PB-eligible / streak-eligible metric narrowing via isPbEligible/isStreakEligible type guards, mirroring the existing isTargetEligible guard from Plan 03-01"
requirements-completed: [TARG-05, DASH-03, PB-01, PB-02]
coverage:
  - id: D1
    description: "Streak calculation engine: meetsTargetForDay (daily hard check per metric) and calculateStreak/calculateWeeklyStreak (walk-back counters)"
    requirement: "TARG-05"
    verification:
      - kind: unit
        ref: "src/utils/targetCalcs.test.ts (54 tests, describe blocks: meetsTargetForDay, calculateStreak, calculateWeeklyStreak)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Personal-best detection engine: detectPersonalBest/isNewPersonalBest/PB_METRICS, plus Dexie v4 personalBests cache table"
    requirement: "PB-01"
    verification:
      - kind: unit
        ref: "src/utils/personalBest.test.ts (16 tests)"
        status: pass
      - kind: other
        ref: "npm run build (tsc -b && vite build) — verifies Dexie v4 schema compiles and versions 1-3 are unmodified"
        status: pass
    human_judgment: false
  - id: D3
    description: "Dashboard tile shows '{N} day streak' label below the progress bar (never hidden, even at 0) when a target is set; skipped entirely for temperature"
    requirement: "DASH-03"
    verification:
      - kind: other
        ref: "npm run build (TS compiles, wiring type-checks)"
        status: pass
    human_judgment: true
    rationale: "Visual placement, empty-state rendering, and the live '1 day streak on qualifying day 1' behavior require human confirmation in the browser — deferred to end-of-phase UAT per workflow.human_verify_mode=end-of-phase; embedded as the task's <verify><human-check>."
  - id: D4
    description: "'🏆 Personal best!' badge renders on both the Dashboard tile and the /chart/:metric screen, target-independent, for all 5 PB-eligible metrics; never for temperature"
    requirement: "PB-02"
    verification:
      - kind: other
        ref: "npm run build (TS compiles, wiring type-checks)"
        status: pass
    human_judgment: true
    rationale: "Confirming the badge actually appears on a new all-time-high entry (and does not appear for temperature) requires logging real data and visually checking both surfaces — deferred to end-of-phase UAT per workflow.human_verify_mode=end-of-phase; embedded as the task's <verify><human-check>."
duration: 24min
completed: 2026-09-18
status: complete
---

# Phase 3 Plan 2: Streaks and Personal Bests Summary

Streak/PB pure-math engines (TDD) plus Dexie v4 `personalBests` cache table, wired into MetricTile and MetricChart with a forward-detection cache bump so exact ties never re-trigger the badge.

## Performance
- **Duration:** 24min
- **Started:** 2026-09-18T15:01:38Z
- **Completed:** 2026-09-18T15:25:56Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Built a distinct daily-hard-check streak engine (`meetsTargetForDay`, `calculateStreak`, `calculateWeeklyStreak`) separate from Plan 03-01's 7-day pace/color logic, fully TDD (RED-then-GREEN, 54 passing tests).
- Built a personal-best detection engine (`detectPersonalBest`, `isNewPersonalBest`, `PB_METRICS`) with a deterministic earlier-date tie-break, fully TDD (RED-then-GREEN, 16 passing tests).
- Added Dexie schema v4 (`personalBests` table), additive-only, chained after v3 — versions 1-3 unmodified.
- Wired both engines into `MetricTile.tsx` (Dashboard) and `MetricChart.tsx` (chart screen): streak label always visible (even at "0 day streak") when a target is set, and a "🏆 Personal best!" pill that is target-independent and never shown for temperature.

## Task Commits
1. **Task 1: Streak calculation engine** - `1ca7bc4` (test, RED) / `b81cf03` (feat, GREEN)
2. **Task 2: Personal-best detection engine + Dexie v4** - `8cd8580` (test, RED) / `fbef769` (feat, GREEN)
3. **Task 3: Wire streaks + PB badges into MetricTile/MetricChart** - `031c082` (feat)

## Files Created/Modified
- `src/utils/targetCalcs.ts` - Added `meetsTargetForDay`, `calculateStreak`, `calculateWeeklyStreak` (distinct daily-check engine, D-14–D-19)
- `src/utils/targetCalcs.test.ts` - 23 new tests covering the streak engine
- `src/utils/personalBest.ts` - New: `detectPersonalBest`, `isNewPersonalBest`, `PB_METRICS` (D-20–D-22)
- `src/utils/personalBest.test.ts` - New: 16 tests covering the PB engine
- `src/db/schema.ts` - Dexie v4: `personalBests` table + `PersonalBest` interface (additive)
- `src/hooks/useStreakData.ts` - New: two-pass backward walk hook, short-circuits to `{streak:0}` with no Dexie call when target is null (D-05)
- `src/hooks/usePersonalBestData.ts` - New: cache-then-compare hook with retroactive scan (once per metric) and forward-detection cache bump
- `src/components/Dashboard/MetricTile.tsx` - Streak label (below progress bar) + PB pill wired in
- `src/components/Charts/MetricChart.tsx` - PB pill wired in next to the on-track status badge

## Decisions Made
- `WEIGHT_STEADY_TOLERANCE` (0.2kg) is a separate constant from `TOLERANCES.weight` (0.5kg) — the daily streak check and the 7-day pace/color check intentionally use different tolerances (see key-decisions in frontmatter).
- `detectPersonalBest` sorts ascending by date before scanning so exact-value ties resolve to the earlier date deterministically.
- `usePersonalBestData` bumps its Dexie cache forward whenever `isTodayPersonalBest` detects a genuine strict improvement (see Deviations below — this is a correctness fix, not in the plan's literal text).

## Deviations from Plan

**1. [Rule 2 - Missing critical functionality] Forward-detection cache bump in usePersonalBestData**
- **Found during:** Task 3
- **Issue:** The plan's literal description only has `usePersonalBestData` read the cache and never update it after the initial retroactive scan. Without updating the cache when a genuine new PB is detected, a later day logging the exact same (now-current) best value would incorrectly re-trigger `isTodayPersonalBest` as true (comparing against the stale, lower cached value) — violating the must-have truth "an entry that exactly ties the existing personal best does not re-trigger the badge," since "existing" must mean the TRUE current best, not a stale cache.
- **Fix:** `isTodayPersonalBest` now writes the new value back to `db.personalBests` (and updates in-memory `cachedBests` state) the first time it detects a strict improvement for a given direction, guarded by a `useRef` set keyed on `metric:direction:value` to avoid duplicate writes across re-renders.
- **Files modified:** `src/hooks/usePersonalBestData.ts`
- **Verification:** `npm run build` passes; logic traced against the must-have tie-suppression truth by hand (no dedicated hook-level test exists for this Dexie-integration path — Task 3 is `type="auto"`, not TDD).
- **Committed in:** `031c082`

**2. [Rule 1 - Bug] Fixed TS "no overlap" comparison error in personalBest.test.ts**
- **Found during:** Task 2, `npm run build` verification
- **Issue:** `PB_METRICS.some((m) => m.metric === "temperature")` failed to compile — TS correctly flags this as `error TS2367` because `PB_METRICS`'s narrowed metric type already excludes `"temperature"`, so the comparison can never be true by construction.
- **Fix:** Cast to `m.metric as string` before comparing, so the test still asserts the runtime invariant without fighting the type system that already proves it statically.
- **Files modified:** `src/utils/personalBest.test.ts`
- **Verification:** `npm run build` exits 0; `npm test -- personalBest` still 16/16 passing.
- **Committed in:** `fbef769`

---
**Total deviations:** 2 auto-fixed (1 Rule 2, 1 Rule 1). **Impact on plan:** Both are small, contained fixes — the Rule 2 fix closes a real correctness gap in forward PB detection; the Rule 1 fix is a trivial test-only TS compile fix. Neither changes the plan's file list or task boundaries.

## Issues Encountered
None beyond the two deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both engines (`targetCalcs.ts`, `personalBest.ts`) are pure, fully unit-tested, and have no Dexie dependency of their own — safe to reuse from Phase 4/5 training-session and history views per D-20's forward-compatibility note.
- Dexie is now at schema v4; the `personalBests` table is additive and ready for the retroactive scan to run automatically the first time any user visits a metric tile or chart screen after this plan ships.
- Two `<verify><human-check>` items (Task 3's streak-on-qualifying-day-1 and PB-badge-on-both-surfaces checks) are deferred to end-of-phase UAT per `workflow.human_verify_mode=end-of-phase` — not yet human-verified.
- Ready for 03-03.

---
*Phase: 03-targets-goals*
*Completed: 2026-09-18*

## Self-Check: PASSED

All 9 created/modified source files and all 6 commits (1ca7bc4, b81cf03, 8cd8580, fbef769, 031c082, b94630e) verified present in the working tree and git log.
