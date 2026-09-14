---
phase: 02-charts-visualization
plan: 02
subsystem: ui
tags: [heatmap, css-grid, react, typescript, dashboard]

requires:
  - phase: 02-charts-visualization
    plan: 01
    provides: useChartData, METRIC_CONFIG from constants.ts, Dashboard.tsx

provides:
  - useHeatmapData hook querying all 6 Dexie tables for 365-day rolling window
  - ActivityHeatmap component (52x7 CSS Grid, column-major, intensity-colored cells)
  - Cell tap tooltip showing date and logged metric labels (human-readable from METRIC_CONFIG)
  - Dashboard.tsx updated to render ActivityHeatmap below metric tile grid

affects: [02-03-sparklines, 02-04-bmi]

actuals:
  tokens: 42000
  tasks: 2
  commits: 2

tech-stack:
  patterns: [CSS Grid column-major layout, Promise.all parallel Dexie queries, fixed-position tooltip with overlay dismiss]

key-files:
  created:
    - src/hooks/useHeatmapData.ts
    - src/components/Charts/ActivityHeatmap.tsx
  modified:
    - src/components/Dashboard/Dashboard.tsx

key-decisions:
  - "Metric names in HeatmapCell.metrics come from hardcoded allowlist strings, not raw Dexie data (T-02-04 mitigation)"
  - "overflow-x-auto + minWidth 600px prevents viewport overflow on 375px phones (RESEARCH Pitfall 6)"
  - "gridAutoFlow: column creates correct week-column/day-row orientation (52 cols x 7 rows)"
  - "Month labels use absolute positioning at col*12px offsets for pixel-perfect alignment with grid"
  - "Dashboard uses mt-6 (not mt-6 px-4) since outer container already has px-4 padding"

requirements-completed: [CHRT-04]

coverage:
  - id: H1
    description: "Dashboard shows GitHub-style 52x7 CSS Grid heatmap below metric tile grid"
    requirement: "CHRT-04"
    verification:
      - kind: integration
        ref: "npm run build exits 0"
        status: pass
    human_judgment: true
    rationale: "Visual layout of heatmap grid requires browser verification"
  - id: H2
    description: "Cell tap shows tooltip with date and metric labels from METRIC_CONFIG"
    requirement: "CHRT-04"
    verification:
      - kind: integration
        ref: "npm run build exits 0"
        status: pass
    human_judgment: true
    rationale: "Tooltip interaction requires browser tap testing"
  - id: H3
    description: "Heatmap horizontally scrollable on mobile — overflow-x-auto + minWidth 600px"
    requirement: "CHRT-04"
    verification:
      - kind: unit
        ref: "grep -c overflow-x-auto src/components/Charts/ActivityHeatmap.tsx → 2"
        status: pass
    human_judgment: false

duration: ~4 minutes
completed: "2026-09-14T21:02:00Z"
status: complete
---

# Phase 2 Plan 02: Activity Heatmap Summary

GitHub-style 52x7 CSS Grid heatmap on Dashboard with 365-day rolling window, emerald intensity cells, and tap tooltip showing date and metric labels from METRIC_CONFIG.

## Performance
- **Duration:** ~4 minutes
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- Created `useHeatmapData` hook: Promise.all across all 6 Dexie tables simultaneously, 365-day rolling window, hardcoded metric name strings for T-02-04 security mitigation
- Created `ActivityHeatmap` component: CSS Grid column-major 52x7 layout, emerald intensity cells (0=grey, 1-2=dark, 3-4=medium, 5-6=bright), month labels, overflow-x-auto mobile scroll
- Added cell tap tooltip: formatted date, metric labels from METRIC_CONFIG (human-readable), overlay dismiss, viewport right-edge guard
- Updated Dashboard.tsx: ActivityHeatmap rendered below metric tile grid with mt-6 spacing (D-12)
- npm run build exits 0 — no TypeScript errors

## Task Commits
1. **Task 1: Heatmap data hook + CSS Grid component + Dashboard integration** - `a065061` (feat)
2. **Task 2: Cell tap tooltip showing date and which metrics were logged** - `cb202c2` (feat)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed verbatimModuleSyntax type import error**
- **Found during:** Task 1 build
- **Issue:** `import { useHeatmapData, HeatmapCell }` caused TS1484 — HeatmapCell is a type and requires `import type` when verbatimModuleSyntax is enabled
- **Fix:** Split into `import { useHeatmapData }` and `import type { HeatmapCell }` on separate lines
- **Files modified:** src/components/Charts/ActivityHeatmap.tsx
- **Commit:** a065061

### Minor Plan Adjustments (no impact)

**1. Dashboard wrapper uses `mt-6` not `mt-6 px-4`**
- Plan specified `div className="mt-6 px-4"` but the outer Dashboard container already has `px-4`. Adding another `px-4` inside would double the horizontal padding. Used `mt-6` only to maintain correct spacing.

## Self-Check: PASSED

Files verified present:
- src/hooks/useHeatmapData.ts — FOUND
- src/components/Charts/ActivityHeatmap.tsx — FOUND
- src/components/Dashboard/Dashboard.tsx — FOUND (modified)

Commits verified in git log:
- a065061 — FOUND
- cb202c2 — FOUND
