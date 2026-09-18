---
phase: 03-targets-goals
plan: 01
subsystem: targets-engine
tags: [dexie, recharts, tdd, targets, pace-projection, on-track-status]
requires:
  - phase: 02-charts-visualization
    provides: "useChartData hook pattern, MetricChart/MetricTile components, BmiSection ReferenceLine precedent, CHART_HEX accent colors"
provides:
  - "Dexie v3 targets table + Target interface (metric-keyed, additive migration)"
  - "targetCalcs.ts pure pace/status engine: fitLinearTrend, projectPace, inferDirection, getOnTrackStatus, TOLERANCES"
  - "useTargetData hook (fetch/save/delete a target for any of the 5 target-eligible metrics)"
  - "TargetModal component (Set/Edit/Delete Target dialog with validation)"
  - "MetricChart target reference line + status badge + summary label"
  - "MetricTile progress bar + status badge for targeted metrics"
affects: [03-02-streaks-pbs, 03-03-exercise-proxy]
actuals:
  tokens: 6766
  tasks: 3
  commits: 5
tech-stack:
  added: []
  patterns:
    - "Pure calc functions in utils/*.ts mirror bmi.ts's dependency-free style, TDD file-pair (targetCalcs.ts + targetCalcs.test.ts)"
    - "useTargetData follows useChartData/useBmiData's useEffect+async+cancelled hook pattern"
    - "Target reference line reuses BmiSection's Recharts ReferenceLine pattern exactly"
key-files:
  created:
    - src/utils/targetCalcs.ts
    - src/utils/targetCalcs.test.ts
    - src/hooks/useTargetData.ts
    - src/components/Charts/TargetModal.tsx
  modified:
    - src/db/schema.ts
    - src/components/Charts/MetricChart.tsx
    - src/components/Dashboard/MetricTile.tsx
key-decisions:
  - "fitLinearTrend returns null for zero-slope (identical-value) data, not just for a zero x-index denominator — the plan's must_haves truth explicitly required this degrade-to-null behavior for Pitfall 6, even though the day-index x-values (0..n-1) never produce a zero geometric denominator on their own."
  - "Sleep/steps/water target value max is Claude's discretion (24h, 100000 steps, 10000ml) since RESEARCH's Input Validation table only specifies explicit max for weight (500) and heartRate (300)."
patterns-established:
  - "isTargetEligible/temperature-exclusion type guard: narrows MetricType to the 5 target-eligible metrics before calling getOnTrackStatus, keeping temperature permanently outside all target code paths at the type level, not just by convention."
requirements-completed: [TARG-01, TARG-02, TARG-03, TARG-04]
coverage:
  - id: D1
    description: "fitLinearTrend/projectPace/inferDirection/getOnTrackStatus pure functions, covering all boundary cases in the plan's <behavior> block"
    requirement: "TARG-02, TARG-04"
    verification:
      - kind: unit
        ref: "src/utils/targetCalcs.test.ts (31 tests, vitest run targetCalcs)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Dexie schema v3 targets table + Target interface, additive migration (v1/v2 untouched)"
    requirement: "TARG-01"
    verification:
      - kind: unit
        ref: "npm run build (tsc type-checks EntityTable<Target,\"metric\">)"
        status: pass
    human_judgment: false
  - id: D3
    description: "useTargetData CRUD hook (save/fetch/delete target, weight direction inference)"
    requirement: "TARG-01"
    verification: []
    human_judgment: true
    rationale: "No automated test exercises live IndexedDB persistence in this plan (Dexie requires a browser or fake-indexeddb harness, not wired here) — logic reviewed against useChartData's established hook pattern but a human should confirm saveTarget/deleteTarget against a real browser IndexedDB."
  - id: D4
    description: "TargetModal Set/Edit/Delete Target dialog with value+date validation"
    requirement: "TARG-01"
    verification: []
    human_judgment: true
    rationale: "Form UX and dialog interaction (validation toasts, prefill on edit, delete confirm) require visual/interactive human verification per the plan's <human-check> for Task 2 — end-of-phase UAT will collect this."
  - id: D5
    description: "MetricChart target reference line, status badge, and summary label; no target UI for temperature"
    requirement: "TARG-02, TARG-04"
    verification:
      - kind: unit
        ref: "npm run build (type-checks isTargetEligible guard); grep verification of isTargetEligible usage"
        status: pass
    human_judgment: true
    rationale: "Visual placement of the reference line, badge, and label on the actual rendered chart needs human confirmation per the plan's <human-check> for Task 2 — deferred to end-of-phase UAT."
  - id: D6
    description: "MetricTile progress bar + status badge, clamped to [0,100]%, only rendered when a target exists"
    requirement: "TARG-03, TARG-04"
    verification:
      - kind: unit
        ref: "grep verification of Math.min(100, ...) clamp and target-truthy guard"
        status: pass
    human_judgment: true
    rationale: "Visual confirmation that untargeted tiles render byte-identical to Phase 2 (D-05) and targeted tiles show the correct bar/badge needs human eyes — deferred to end-of-phase UAT per the plan's <human-check> for Task 3."
duration: 25min
completed: 2026-09-18
status: complete
---

# Phase 3 Plan 1: Target Engine Tracer Summary

**Dexie v3 targets table with least-squares pace projection, red/yellow/green/grey on-track status engine, and wired Set/Edit Target UI across the chart screen and Dashboard tiles.**

## Performance
- **Duration:** 25min
- **Started:** 2026-09-18T14:34:00Z (approx.)
- **Completed:** 2026-09-18T14:59:20Z
- **Tasks:** 3
- **Files modified:** 7 (4 created, 3 modified)

## Accomplishments
- Built a fully TDD'd (RED-then-GREEN, 31 tests) pace/status engine (`targetCalcs.ts`) that never throws or returns NaN/Infinity on sparse, flat, or expired-deadline data — degrading to `null`/`grey` instead (Pitfall 6).
- Extended Dexie to schema v3 with an additive `targets` table (D-19: v1/v2 untouched) and a `useTargetData` hook that infers weight's loss/gain direction from the most recent logged entry (D-02).
- Wired a `TargetModal` (Set/Edit/Delete Target, future-date validation, physiological range limits) into `MetricChart`, plus a dashed `ReferenceLine` and a red/yellow/green/grey status badge — computed from the trailing 7-day window regardless of the currently selected chart period.
- Extended `MetricTile` with a target progress bar + status badge that renders only when a target exists, leaving untargeted tiles and temperature (which never gets target UI, D-21) byte-identical to Phase 2.

## Task Commits
1. **Task 1 (RED): failing targetCalcs tests** - `a952af5` (test)
2. **Task 1 (GREEN): targetCalcs.ts + Dexie v3 + useTargetData** - `bce1d7a` (feat)
3. **Task 2: TargetModal + MetricChart reference line/badge** - `40fa365` (feat)
4. **Task 3: MetricTile progress bar + badge** - `9c01a12` (feat)

## Files Created/Modified
- `src/utils/targetCalcs.ts` - Pure pace/status math: `fitLinearTrend`, `projectPace`, `inferDirection`, `getOnTrackStatus`, `TOLERANCES`
- `src/utils/targetCalcs.test.ts` - 31 vitest cases covering every `<behavior>` boundary (grey<7 days, inclusive tolerance/2x-tolerance boundaries, sleep range, weight direction, overshoot)
- `src/hooks/useTargetData.ts` - Fetch/save/delete a target for any of the 5 target-eligible metrics; infers weight direction on save
- `src/components/Charts/TargetModal.tsx` - Set/Edit Target dialog (shadcn Dialog), future-date + positive-value validation, nested delete-confirm dialog
- `src/db/schema.ts` - Dexie version 3, additive `targets` table + `Target` interface
- `src/components/Charts/MetricChart.tsx` - Target CTA, summary label, dashed `ReferenceLine`, status badge; temperature excluded
- `src/components/Dashboard/MetricTile.tsx` - Progress bar + status badge below the sparkline, rendered only when a target exists

## Decisions Made
- **fitLinearTrend degrades to null on zero slope, not just zero denominator.** The plan's must_haves truth ("zero-slope (identical-value) data ... degrade to null") required this even though the day-index x-values (always 0..n-1, distinct) never produce a zero geometric denominator by themselves. Added an explicit `if (slope === 0) return null` guard after computing the least-squares fit.
- **Sleep/steps/water target max values are Claude's discretion.** RESEARCH's Input Validation table only specifies explicit maximums for weight (500) and heartRate (300); sleep/steps/water use sane physiological/logging ceilings (24h, 100000 steps, 10000ml) not sourced from the table.
- **isTargetEligible type guard excludes temperature at the type level.** Both `MetricChart.tsx` and `MetricTile.tsx` narrow `MetricType` to the 5 target-eligible metrics before calling `getOnTrackStatus`, so temperature can never reach target-calculation code paths even if a stray target row existed.

## Deviations from Plan

None - plan executed exactly as written, with one clarifying implementation choice documented above (zero-slope guard) required to satisfy the plan's own must_haves truth about Pitfall 6 degradation.

## Issues Encountered

None. The only friction was reconciling the `<behavior>` block's "zero denominator" phrasing for identical-value data with the actual least-squares formula (day-index x-values never produce a zero denominator) — resolved by adding an explicit zero-slope guard, satisfying both the literal test I wrote from `<behavior>` and the plan's Pitfall 6 must_haves truth.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness

Task 1's tracer feedback gate (Dexie -> targetCalcs -> useTargetData -> chart UI -> dashboard UI) is proven end-to-end: `npm run build` and `npm test -- targetCalcs` both pass after all three tasks. Plan 03-02 (streaks/PBs) and 03-03 (exercise proxy) can now build on `targetCalcs.ts`'s exported functions and the `targets` table without further schema changes.

Three `<human-check>` verification items are deferred to end-of-phase UAT per `workflow.human_verify_mode: end-of-phase` (not blocking-human gates):
- Task 2: visually confirm Set/Edit Target flow, reference line placement, and grey badge on a brand-new target at `/chart/weight`; confirm no target UI at `/chart/temperature`.
- Task 3: visually confirm Dashboard tile progress bar/badge for a targeted metric, and confirm an untargeted tile is unchanged from Phase 2.

No blockers.

---
*Phase: 03-targets-goals*
*Completed: 2026-09-18*

## Self-Check: PASSED

All created files (targetCalcs.ts, targetCalcs.test.ts, useTargetData.ts, TargetModal.tsx, this SUMMARY.md) and all task/metadata commit hashes (a952af5, bce1d7a, 40fa365, 9c01a12, 46bf5de) verified present in the repository.
