---
phase: quick
plan: 260917-dzj
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/Charts/MetricChart.tsx
  - .planning/phases/02-charts-visualization/02-UAT.md
autonomous: true
requirements: [G-02-2]

estimate:
  tokens: 20000
  raw_tokens: 20000
  tasks: 2
  confidence: low

must_haves:
  truths:
    - "The chart screen's Log (FAB) button is fully visible and clickable above the bottom nav bar on every metric chart screen."
    - "02-UAT.md records G-02-2 as resolved with the fix commit reference, matching the pattern used for G-02-1."
  artifacts:
    - src/components/Charts/MetricChart.tsx
    - .planning/phases/02-charts-visualization/02-UAT.md
  key_links:
    - "MetricChart FAB `bottom-*` offset clears the fixed bottom nav's rendered height (Layout.tsx `<nav>`, reserved via `pb-16` in main)"
---

<objective>
Fix gap G-02-2: on the chart screen (`/chart/:metric`), the floating "Log" (+) button is positioned at `bottom-6` (24px from viewport bottom), which is inside the 64px-tall fixed bottom nav bar (`Layout.tsx`, `z-50`). Because the nav bar sits at a higher z-index and physically overlaps that 24px band, the Log button is hidden/unclickable. Reposition the button so it clears the nav bar entirely, then mark G-02-2 resolved in 02-UAT.md following the exact pattern already used for G-02-1.

Purpose: Unblock UAT test 1 (D2 gap) so Phase 02 verification can proceed past the one remaining "major" severity issue.
Output: Updated `MetricChart.tsx` FAB positioning; updated `02-UAT.md` gap entry for G-02-2 marked resolved.
</objective>

<execution_context>
@C:/my-code/vibe-coding/my-health/.claude/gsd-core/workflows/execute-plan.md
@C:/my-code/vibe-coding/my-health/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@C:/my-code/vibe-coding/my-health/.planning/STATE.md
@C:/my-code/vibe-coding/my-health/.planning/phases/02-charts-visualization/02-UAT.md
@C:/my-code/vibe-coding/my-health/src/components/Charts/MetricChart.tsx
@C:/my-code/vibe-coding/my-health/src/components/Layout.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Reposition chart screen Log FAB to clear the bottom nav</name>
  <files>src/components/Charts/MetricChart.tsx</files>
  <action>
  In `MetricChart.tsx`, the Log FAB button (`aria-label={\`Log ${config.label}\`}`, around line 169-175) uses className `fixed bottom-6 right-6 z-10 ...`. `Layout.tsx` renders a fixed, full-width bottom nav (`fixed bottom-0 left-0 right-0 ... z-50`) whose rendered content is ~64px tall (matches the `pb-16` reserve on `<main>` in Layout.tsx, and matches `UpdatePrompt.tsx`'s existing `bottom-16` offset used for the same clearance problem). `bottom-6` (24px) sits well inside that 64px band, so the nav (`z-50`, painted after/above in the layout) visually covers and intercepts clicks on the FAB (`z-10`).

  Change the FAB's Tailwind class from `bottom-6` to `bottom-24` (96px — clears the 64px nav with a 32px visual gap, consistent spacing with the original 24px edge gap the button used pre-nav-overlap). Do not change `right-6`. Also bump `z-10` to `z-40` on the same button as a defensive measure so it never re-lands beneath the nav's `z-50` stacking context if spacing assumptions change later — the nav remains topmost. Do not touch any other class on this button, do not touch BmiSection, ChartHeader, or PeriodSelector, and do not introduce new dependencies or a safe-area-inset pattern (none exists elsewhere in the codebase; out of scope for this fix).
  </action>
  <verify>
    <automated>grep -c "bottom-24 right-6 z-40" "C:/my-code/vibe-coding/my-health/src/components/Charts/MetricChart.tsx"</automated>
  </verify>
  <done>MetricChart.tsx's Log FAB uses `bottom-24 right-6 z-40` instead of `bottom-6 right-6 z-10`; `npm run build` exits 0 with no TypeScript errors.</done>
</task>

<task type="auto">
  <name>Task 2: Mark G-02-2 resolved in 02-UAT.md</name>
  <files>.planning/phases/02-charts-visualization/02-UAT.md</files>
  <action>
  In `02-UAT.md`, the G-02-2 gap entry (`status: failed`, reason "User reported: Log button in chart is hidden under bottom nav...") needs to be updated to mirror exactly how the G-02-1 entry above it (in the same `## Gaps` section) records resolution: change `status: failed` to `status: resolved`, and add `root_cause`, `resolved_by`, `resolved_at`, and `debug_session` (omit `debug_session` if no debug session file was created for this fix, since G-02-1's value points to an actual `.planning/debug/` file — only include fields that have real content). Set `root_cause` to describe the FAB's `bottom-6` offset sitting inside the fixed bottom nav's 64px rendered height, with the nav's higher z-index (`z-50` vs `z-10`) painting over/intercepting the click target. Set `resolved_by` to reference this fix's commit using the same phrasing style as G-02-1 (`"commit {SHORT_SHA} (fix(charts): ...)"`) — the executor must fill in the actual short commit SHA of the commit created for Task 1's change (use `git log -1 --format=%h` after committing, or defer this exact line's `{SHORT_SHA}` substitution to immediately after the commit is made in this same plan's execution). Set `resolved_at` to today's date (2026-09-17). Do not alter the G-02-1 entry, the `## Current Test`, `## Tests`, or `## Summary` sections, and do not renumber or reorder gap entries.
  </action>
  <verify>
    <automated>grep -A6 "gap_id: G-02-2" "C:/my-code/vibe-coding/my-health/.planning/phases/02-charts-visualization/02-UAT.md" | grep -c "status: resolved"</automated>
  </verify>
  <done>G-02-2 entry in 02-UAT.md has `status: resolved`, `root_cause`, `resolved_by` (with real commit SHA, not a placeholder), and `resolved_at: 2026-09-17`, matching the structure of the G-02-1 entry.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| None new | Pure client-side CSS/layout fix; no new trust boundary, no user input, no new dependency |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-QUICK-01 | N/A | N/A | low | accept | No security-relevant surface touched — Tailwind class value change and a markdown status update only. |
</threat_model>

<verification>
- `npm run build` exits 0 (TypeScript + Vite build clean)
- `grep -c "bottom-24 right-6 z-40" src/components/Charts/MetricChart.tsx` returns 1
- `grep -A6 "gap_id: G-02-2" .planning/phases/02-charts-visualization/02-UAT.md | grep -c "status: resolved"` returns 1
- Manual/visual: open `/chart/weight` (or any metric) on a narrow viewport, confirm the white circular Log (+) button is fully visible above the bottom nav bar and clicking it navigates to `/log/weight`
</verification>

<success_criteria>
- Log FAB on the chart screen is positioned entirely above the bottom nav bar, fully visible and clickable, on all six metric chart screens
- 02-UAT.md's G-02-2 gap entry is marked `resolved` with a real fix commit reference, following the G-02-1 pattern exactly
- No regression to other chart screen elements (ChartHeader, PeriodSelector, BmiSection, back button)
</success_criteria>

<output>
Create `.planning/quick/260917-dzj-fix-gap-g-02-2-chart-screen-log-button-h/260917-dzj-SUMMARY.md` when done
</output>
