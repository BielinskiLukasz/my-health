---
phase: quick
plan: 260917-nbo
subsystem: ui
tags: [recharts, chart-domain, bmi, y-axis]

requires:
  - phase: quick-260917-g44
    provides: getYAxisDomain pattern for weight/heartRate/temperature Y-axis min/max scaling
provides:
  - getBmiYAxisDomain pure function in chartDomain.ts with threshold-clamped domain logic
  - BmiSection.tsx mini chart Y-axis now scales to data with 18.5/25 threshold floor/ceiling
affects: [BmiSection, chartDomain]

actuals:
  tokens: 4500
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "getBmiYAxisDomain: numeric [min, max] domain tuple clamped against fixed category thresholds (18.5, 25), distinct from getYAxisDomain's string-formula 'dataMin - N' pattern used for metrics without fixed thresholds"

key-files:
  created: []
  modified:
    - src/utils/chartDomain.ts
    - src/utils/chartDomain.test.ts
    - src/components/Charts/BmiSection.tsx

key-decisions:
  - "getBmiYAxisDomain kept separate from getYAxisDomain/MIN_MAX_SCALE_METRICS rather than adding 'bmi' to MetricType, since the 18.5/25 clamp needs real Math.min/max arithmetic that Recharts' string-formula domain can't express"
  - "Obese threshold (30) intentionally excluded from the clamp — only 18.5 and 25 are floor/ceiling targets, per plan spec"

requirements-completed: [QUICK-260917-NBO]

coverage:
  - id: D1
    description: "getBmiYAxisDomain returns [18.5, 25] for in-range data, expands below 18.5 for Underweight data (upper bound held at 25), expands above 25 for Overweight/Obese data (lower bound held at 18.5), and returns [18.5, 25] for empty input"
    requirement: "QUICK-260917-NBO"
    verification:
      - kind: unit
        ref: "src/utils/chartDomain.test.ts#getBmiYAxisDomain"
        status: pass
    human_judgment: false
  - id: D2
    description: "BmiSection.tsx's YAxis domain prop is wired to getBmiYAxisDomain(bmiData.map(d => d.bmi)); the 18.5/25/30 ReferenceLine elements are unchanged"
    requirement: "QUICK-260917-NBO"
    verification:
      - kind: unit
        ref: "npm run typecheck && npx vitest run (35/35 passed)"
        status: pass
      - kind: manual_procedural
        ref: "Visual check that reference lines stay in frame across Underweight/Normal/Overweight BMI histories"
        status: unknown
    human_judgment: true
    rationale: "Automated tests cover the pure function and static wiring; actual visual rendering of the chart with real BMI history data was not screenshot-verified in this session"

duration: 13min
completed: 2026-09-17
status: complete
---

# Quick Task 260917-nbo: BMI Y-Axis Domain Fix Summary

**Added `getBmiYAxisDomain` to chartDomain.ts and wired it into BmiSection.tsx's YAxis, so the mini BMI chart scales to actual data while always keeping the 18.5/25 category threshold lines in frame.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-09-17T14:46:00Z
- **Completed:** 2026-09-17T14:59:01Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- New `getBmiYAxisDomain(bmiValues: number[]): [number, number]` pure function in `chartDomain.ts`, clamped so the lower bound never exceeds 18.5 and the upper bound never falls below 25
- Four new unit tests in `chartDomain.test.ts` covering in-range, Underweight, Overweight/Obese, and empty-array cases
- `BmiSection.tsx`'s `YAxis` now receives `domain={bmiDomain}`, fixing the same "0-anchored Y-axis" bug class already fixed for weight/heartRate/temperature (G-02-5), scoped to BMI's fixed-threshold requirement
- The three existing `ReferenceLine` elements (18.5, 25, 30) left untouched

## Task Commits

Each task was committed atomically (TDD RED/GREEN for Task 1):

1. **Task 1 (RED): failing getBmiYAxisDomain test cases** - `1d6036a` (test)
2. **Task 1 (GREEN): getBmiYAxisDomain implementation** - `9e13aa2` (feat)
3. **Task 2: wire getBmiYAxisDomain into BmiSection's YAxis** - `702c2d1` (feat)

_Note: Task 1 used TDD (test → feat); Task 2 was a straightforward wiring change with no separate test commit since it's covered by existing component-level behavior and the plan's grep-based verification._

## Files Created/Modified
- `src/utils/chartDomain.ts` - Added `BMI_PADDING` constant and `getBmiYAxisDomain` function
- `src/utils/chartDomain.test.ts` - Added `describe("getBmiYAxisDomain", ...)` block with 4 test cases
- `src/components/Charts/BmiSection.tsx` - Imported `getBmiYAxisDomain`, computed `bmiDomain`, passed `domain={bmiDomain}` to `YAxis`

## Decisions Made
- Kept `getBmiYAxisDomain` as a standalone function rather than extending `getYAxisDomain`/`MIN_MAX_SCALE_METRICS`, since BMI's fixed 18.5/25 thresholds require real numeric `Math.min`/`Math.max` arithmetic, not Recharts' `'dataMin - N'` string-formula domain used for weight/heartRate/temperature.
- Followed the plan exactly for padding (`BMI_PADDING = 1`) and threshold clamp logic; no deviation from spec.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

`npm run lint` reports 650 pre-existing errors across the repo (e.g., `ChartHeader.tsx`, `MetricChart.tsx`, `SleepForm.tsx`, `button.tsx`, `.claude/hooks/lib/cli-exit.js`). None of these are in `chartDomain.ts`, `chartDomain.test.ts`, or `BmiSection.tsx` — the files this task touched. Per the executor's scope-boundary rule, these are out of scope and were not fixed; they predate this task's changes and are logged here rather than fixed inline. `npm run typecheck` and `npx vitest run` (35/35 tests) both pass cleanly.

## Next Phase Readiness
- BMI mini chart now matches the Y-axis scaling behavior already applied to weight/heartRate/temperature charts, closing the last remaining chart-scaling gap.
- No blockers. Repo-wide lint errors (unrelated to this task) remain as pre-existing technical debt for a future cleanup pass.

---
*Phase: quick*
*Completed: 2026-09-17*

## Self-Check: PASSED

- FOUND: src/utils/chartDomain.ts
- FOUND: src/utils/chartDomain.test.ts
- FOUND: src/components/Charts/BmiSection.tsx
- FOUND commit: 1d6036a (test: add failing getBmiYAxisDomain cases)
- FOUND commit: 9e13aa2 (feat: add getBmiYAxisDomain to chartDomain)
- FOUND commit: 702c2d1 (feat: wire getBmiYAxisDomain into BmiSection YAxis)
