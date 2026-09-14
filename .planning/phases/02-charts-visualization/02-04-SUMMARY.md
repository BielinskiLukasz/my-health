---
phase: 02-charts-visualization
plan: 04
subsystem: ui
tags: [bmi, recharts, vitest, tdd, react, typescript, hooks]

requires:
  - phase: 02-charts-visualization
    plan: 01
    provides: aggregation.ts groupByDay, useChartData hook pattern, MetricChart.tsx, CustomTooltip

provides:
  - calcBmi + bmiCategory pure math utilities (bmi.ts)
  - useBmiData hook with height guard (T-02-08) and full weight history scan
  - BmiSection component with mini LineChart + ReferenceLine thresholds
  - MetricChart.tsx updated to show BmiSection below weight chart only (D-09)

affects: [03-targets-settings]

actuals:
  tokens: 42000
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - TDD RED/GREEN/REFACTOR for pure math utilities
    - useBmiData: useEffect+async+cancelled pattern for Dexie query
    - localStorage height read + guard before arithmetic (T-02-08)
    - ReferenceLine from recharts@3 for BMI threshold display
    - Separate section below chart (not dual Y-axis) per D-09

key-files:
  created:
    - src/utils/bmi.ts
    - src/utils/bmi.test.ts
    - src/hooks/useBmiData.ts
    - src/components/Charts/BmiSection.tsx
  modified:
    - src/components/Charts/MetricChart.tsx

key-decisions:
  - "calcBmi has no zero guard — input validation is the caller's responsibility (useBmiData, T-02-08)"
  - "useBmiData queries all weight entries with orderBy('date').toArray() — no date range filter for full BMI history"
  - "BmiSection is a separate section below weight chart, not overlaid as second Y-axis line (D-09)"
  - "Security comment mentioning 'dangerouslySetInnerHTML' triggered grep verification check 8 — replaced with equivalent wording"

requirements-completed: [BMI-01, BMI-02]

coverage:
  - id: BMI-01
    description: "BMI auto-calculated from weight entries using height from localStorage"
    requirement: "BMI-01"
    verification:
      - kind: unit
        ref: "npm test exits 0 — 15 BMI unit tests pass (calcBmi, bmiCategory all boundary values)"
        status: pass
    human_judgment: false
  - id: BMI-02
    description: "BMI section below weight chart with mini trend chart and reference lines"
    requirement: "BMI-02"
    verification:
      - kind: integration
        ref: "npm run build exits 0; grep checks 5-7 pass"
        status: pass
    human_judgment: true
    rationale: "Visual rendering with real Dexie data requires browser verification"

duration: 9 minutes
completed: "2026-09-14T23:27:00Z"
status: complete
---

# Phase 2 Plan 04: BMI Section Summary

TDD-driven BMI utilities (calcBmi + bmiCategory) and useBmiData hook; BmiSection mini chart with color-coded category display and WHO threshold reference lines rendered below the weight chart only (D-09).

## Performance
- **Duration:** ~9 minutes
- **Started:** 2026-09-14T23:18:00Z
- **Completed:** 2026-09-14T23:27:00Z
- **Tasks:** 2
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments
- TDD RED/GREEN/REFACTOR cycle: bmi.test.ts (15 cases) failing first, bmi.ts making all pass
- calcBmi(weightKg, heightCm) — pure math, no zero guard by design
- bmiCategory(bmi) — exact WHO thresholds: <18.5 Underweight, <25 Normal, <30 Overweight, >=30 Obese
- useBmiData hook: reads height from localStorage, guards T-02-08 (NaN/zero/missing), queries all weight entries, maps to BmiPoint series
- BmiSection: no-height state shows safe message; normal state shows current BMI, colored category (blue/emerald/yellow/red), 120px mini LineChart with ReferenceLine at 18.5/25/30
- MetricChart.tsx: {metric === 'weight' && <BmiSection />} — BMI section only for weight chart
- All 8 plan verification checks pass; npm run build exits 0; npm test 24/24 pass

## Task Commits
1. **Task 1: TDD BMI utils + useBmiData hook** - `93e55a7` (feat)
2. **Task 2: BmiSection + MetricChart wiring** - `c0bd329` (feat)
3. **Fix: security comment false positive** - `e7a23a2` (fix)

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| src/utils/bmi.ts | Created | calcBmi + bmiCategory pure math, no dependencies |
| src/utils/bmi.test.ts | Created | 15 Vitest unit tests, all boundary values |
| src/hooks/useBmiData.ts | Created | Height guard, full weight scan, BmiPoint series |
| src/components/Charts/BmiSection.tsx | Created | Mini LineChart + ReferenceLine + category color hints |
| src/components/Charts/MetricChart.tsx | Modified | Import + conditional {metric==='weight' && BmiSection} |

## Decisions Made
- calcBmi has no zero guard: pure math function, caller validates (useBmiData). Security separation of concerns is explicit design choice.
- useBmiData queries all weight entries with no date range: full BMI history needed for the mini trend chart.
- BmiSection is separate section (not dual Y-axis): per D-09, avoids dual-Y complexity; simpler and more readable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Security comment triggered XSS grep check (check 8)**
- **Found during:** Plan-level verification
- **Issue:** The comment `// Security: no dangerouslySetInnerHTML — ...` contained the literal string `dangerouslySetInnerHTML`, causing check 8 (`grep -c "dangerouslySetInnerHTML" BmiSection.tsx` must return 0) to return 1.
- **Fix:** Replaced comment with equivalent wording: `// Security: all values are React JSX — no XSS vectors (T-02-09)`
- **Files modified:** src/components/Charts/BmiSection.tsx
- **Commit:** e7a23a2

## Known Stubs
None — BMI section is fully wired to Dexie weight data via useBmiData.

## Threat Flags
None — no new trust boundaries introduced beyond those in the plan's threat model (T-02-08, T-02-09, T-02-10 all addressed).

## Self-Check: PASSED

Files verified present:
- src/utils/bmi.ts: FOUND
- src/utils/bmi.test.ts: FOUND
- src/hooks/useBmiData.ts: FOUND
- src/components/Charts/BmiSection.tsx: FOUND
- src/components/Charts/MetricChart.tsx: FOUND (modified)

Commits verified in git log:
- 93e55a7: FOUND
- c0bd329: FOUND
- e7a23a2: FOUND
