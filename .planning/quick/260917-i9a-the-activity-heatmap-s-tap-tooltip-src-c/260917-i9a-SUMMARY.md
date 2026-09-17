---
phase: quick
plan: 260917-i9a
subsystem: ui
tags: [react, tailwind, z-index, positioning, heatmap]

requires: []
provides:
  - Activity heatmap tap tooltip that never renders under/behind the fixed bottom nav
affects: [02-charts-visualization]

actuals:
  tokens: 1000
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Vertical clamp/flip helper (getTooltipTop) for viewport-edge-aware tooltip positioning, paired with a raised z-index literal to break DOM-order stacking ties against a fixed nav"

key-files:
  created: []
  modified:
    - src/components/Charts/ActivityHeatmap.tsx
    - .planning/phases/02-charts-visualization/02-UAT.md

key-decisions:
  - "Used a conservative estimated tooltip height (TOOLTIP_BASE_HEIGHT + per-line TOOLTIP_LINE_HEIGHT) instead of a ref/useLayoutEffect measurement round-trip, to keep the fix a pure synchronous calculation"
  - "z-[60] (arbitrary Tailwind value) chosen over bumping the nav's z-50 down, since the nav's stacking tier is shared with other fixed UI and only the tooltip needed to win this specific tie"

requirements-completed: [QUICK-260917-I9A]

coverage:
  - id: D1
    description: "Heatmap tap tooltip clamps/flips vertically so it never renders under the fixed bottom nav, and its z-index (z-[60]) unconditionally wins the stacking tie against the nav (z-50)"
    requirement: QUICK-260917-I9A
    verification:
      - kind: unit
        ref: "npm test (31 tests passed, no regressions)"
        status: pass
      - kind: manual_procedural
        ref: "Tap a heatmap cell near the bottom of the viewport on the Dashboard; tooltip must render fully above the nav"
        status: unknown
    human_judgment: true
    rationale: "Visual/positioning correctness of a tooltip near the viewport edge is a rendering judgment call that automated tests can't fully substitute for; this is also the existing pending H2 UAT test in 02-UAT.md."
  - id: D2
    description: "H2 UAT test entry annotated with a note referencing this fix, without altering its pending result"
    verification:
      - kind: other
        ref: "grep -q '260917-i9a' .planning/phases/02-charts-visualization/02-UAT.md"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-09-17
status: complete
---

# Quick Task 260917-i9a: Heatmap tooltip nav-clipping fix Summary

**Heatmap tap tooltip now clamps/flips vertically against the fixed bottom nav and carries a raised z-index (z-[60]) so it can never render under or behind the nav, regardless of tap position or DOM paint order.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-17T13:15:00Z
- **Completed:** 2026-09-17T13:27:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `NAV_HEIGHT`, `TOOLTIP_BASE_HEIGHT`, `TOOLTIP_LINE_HEIGHT` constants and a `getTooltipTop()` helper in `ActivityHeatmap.tsx` that clamps the tooltip's `top` between 8px from the viewport top and the lowest position that keeps its bottom edge clear of the 64px reserved nav band — flipping the tooltip above the tap point when the default below-tap offset would collide with the nav.
- Raised the tooltip's className from `z-50` to `z-[60]`, breaking the DOM-order stacking tie with `Layout.tsx`'s fixed bottom nav (also `z-50`) so the tooltip always paints on top.
- Left the horizontal `left` clamp, the overlay's `z-40`, and every other line of the component untouched, per the plan's scope boundary.
- Annotated the still-pending H2 UAT test ("Heatmap cell tap tooltip") in `02-UAT.md` with a note describing the fix, without marking the test passed/failed — that remains a human UAT judgment call.

## Task Commits

1. **Task 1: Clamp tooltip vertical position and raise its z-index above the bottom nav** - `3d38ebd` (fix)
2. **Task 2: Note the nav-clipping fix on the pending H2 UAT test** - `6125b6b` (docs)

_Note: this is a quick task — no separate plan-metadata commit; the orchestrator handles the docs (SUMMARY/STATE) commit separately._

## Files Created/Modified
- `src/components/Charts/ActivityHeatmap.tsx` - Added NAV_HEIGHT/TOOLTIP_BASE_HEIGHT/TOOLTIP_LINE_HEIGHT constants, `getTooltipTop()` vertical clamp/flip helper, wired into the tooltip's inline `top` style; raised tooltip z-index from `z-50` to `z-[60]`
- `.planning/phases/02-charts-visualization/02-UAT.md` - Added a `note:` line on test 4 (H2) referencing this fix; `result:` left at `[pending]`

## Decisions Made
- Estimated tooltip height via constants rather than measuring the rendered DOM node (ref + `useLayoutEffect`), keeping the positioning calculation synchronous and avoiding a render-then-reposition flicker. The estimate deliberately errs high (48px base + 18px/line) so the clamp never under-reserves space.
- Used Tailwind's arbitrary-value syntax `z-[60]` rather than changing the nav's `z-50`, since the nav's stacking tier may be shared by other fixed elements (e.g., the Log FAB raised in commit 2d12acf) and only the tooltip needed strict priority over it.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The fix closes the two root causes identified in Phase 02's H2 gap report (shared z-index tier + unclamped vertical position). H2 in `02-UAT.md` remains `[pending]` and needs a human UAT pass (tap a heatmap cell near the bottom of the viewport on the Dashboard) to visually confirm.
- No blockers for subsequent Phase 02 work.

---
*Phase: quick*
*Completed: 2026-09-17*

## Self-Check: PASSED

- FOUND: src/components/Charts/ActivityHeatmap.tsx
- FOUND: .planning/phases/02-charts-visualization/02-UAT.md
- FOUND: .planning/quick/260917-i9a-the-activity-heatmap-s-tap-tooltip-src-c/260917-i9a-SUMMARY.md
- FOUND commit: 3d38ebd
- FOUND commit: 6125b6b
