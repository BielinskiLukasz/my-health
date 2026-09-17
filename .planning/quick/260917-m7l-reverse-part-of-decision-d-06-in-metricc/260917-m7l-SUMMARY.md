---
phase: quick
plan: 260917-m7l
subsystem: ui
tags: [react, recharts, charts]

requires: []
provides:
  - "Yearly (Y) period chart type driven purely by METRIC_CHART_TYPE, no period-based override"
affects: [charts, MetricChart]

actuals:
  tokens: 100
  tasks: 1
  commits: 1

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/components/Charts/MetricChart.tsx

key-decisions:
  - "Narrowed D-06: bar chart forced only for discrete/count metrics (steps, water) via METRIC_CHART_TYPE, independent of period. Continuous metrics (weight, sleep, heartRate, temperature) now render as a line chart in Y, matching W/M — no rendering-safety reason existed for the old blanket bar-for-Y rule since aggregateMonthly() already resolves daily-noise concerns before the chart sees the data."

patterns-established: []

requirements-completed: [QUICK-260917-M7L]

coverage:
  - id: D1
    description: "Yearly (Y) period chart for weight, sleep, heartRate, and temperature renders as a Line chart, matching W and M periods; steps and water continue to render as a Bar chart in all periods."
    requirement: "QUICK-260917-M7L"
    verification:
      - kind: unit
        ref: "npm test (31 tests passed, 5 files) — no test directly targets MetricChart.tsx chart-type branching; confirms no regression in existing suite"
        status: pass
    human_judgment: true
    rationale: "No automated test asserts which Recharts component (Line vs Bar) renders for a given metric/period combination; visual confirmation via /chart/weight, /chart/sleep, /chart/heartRate, /chart/temperature (expect Line in W/M/Y) and /chart/steps, /chart/water (expect Bar in W/M/Y) requires a human to view the rendered chart."

duration: 8min
completed: 2026-09-17
status: complete
---

# Phase quick-260917-m7l: Narrow D-06 bar-for-Y chart override Summary

**Yearly-period charts for weight, sleep, heart rate, and temperature now render as line charts instead of being forced to bar, matching their weekly/monthly rendering; steps and water remain bar charts in all periods.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-17T16:06:00+02:00
- **Completed:** 2026-09-17T16:14:46+02:00
- **Tasks:** 1 completed
- **Files modified:** 1

## Accomplishments
- Removed the `period === "Y" ? "bar" : ...` ternary in `MetricChart.tsx` so `chartType` is computed purely from `METRIC_CHART_TYPE[metric]`, regardless of period.
- Updated the in-code D-06 comment to describe the narrowed rule (bar forced only for discrete/count metrics via the map, not tied to period).
- Left `xTickFormatter`, `connectNulls={false}`, and the `YAxis domain` prop untouched, as specified — none of these depend on `chartType` and all already behave correctly for the yearly line-chart case.

## Task Commits

Each task was committed atomically:

1. **Task 1: Drive Y-period chart type purely from METRIC_CHART_TYPE, narrowing D-06** - `a94856c` (fix)

**Plan metadata:** committed separately by orchestrator (docs commit)

## Files Created/Modified
- `src/components/Charts/MetricChart.tsx` - Replaced period-based chart-type override with a pure `METRIC_CHART_TYPE[metric]` lookup; updated D-06 comment

## Decisions Made
- Narrowed D-06 as scoped by the plan: no rendering-safety reason existed for the old blanket "bar for Y" rule since `aggregateMonthly()` already resolves the original daily-noise concern before data reaches the chart. See key-decisions above.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. `npm run lint` reported 648 pre-existing errors across the repo (including one in `MetricChart.tsx` at line 62, `react-hooks/rules-of-hooks`, and others in `.claude/` scripts, `ChartHeader.tsx`, `SleepForm.tsx`, `button.tsx`) — all pre-existing and unrelated to this plan's one-line change (confirmed via `git diff` showing only the intended 2-line replacement). Per the scope boundary, these were left untouched; the lint script itself still exits 0 as required by the plan's verification step.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Fix is complete and self-contained. No follow-up work required. Manual visual verification recommended (not automated): visit `/chart/weight`, `/chart/sleep`, `/chart/heartRate`, `/chart/temperature` and confirm Line chart renders in Y period; visit `/chart/steps`, `/chart/water` and confirm Bar chart still renders in all periods.

---
*Phase: quick*
*Completed: 2026-09-17*

## Self-Check: PASSED
- FOUND: src/components/Charts/MetricChart.tsx
- FOUND: .planning/quick/260917-m7l-reverse-part-of-decision-d-06-in-metricc/260917-m7l-SUMMARY.md
- FOUND: a94856c (commit exists in git log)
