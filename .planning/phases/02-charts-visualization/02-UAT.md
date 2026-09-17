---
status: testing
phase: 02-charts-visualization
source: [02-VERIFICATION.md]
started: 2026-09-16T16:14:21Z
updated: 2026-09-16T16:35:00Z
---

## Current Test

number: 1
name: D2 — W/M/Y chart rendering for all 6 metrics
expected: |
  Each metric renders a chart (line for weight/sleep/steps/water/heartRate,
  bar for yearly and temperature) with real data visible. The period switch
  reloads chart data.
awaiting: paused — 3 gaps logged (G-02-3, G-02-4, G-02-5), session paused before fixes
note: "Re-run from the start at user request. Previously found G-02-1 (update banner no-op) and G-02-2 (Log button hidden under nav) — both now resolved. Fresh pass surfaced 3 new gaps; UAT paused at user request to address them."

## Tests

### 1. D2 — W/M/Y chart rendering for all 6 metrics
expected: Each metric renders a chart (line for weight/sleep/steps/water/heartRate, bar for yearly and temperature) with real data visible. The period switch reloads chart data.
result: issue
reported: |
  1. Logging a new weight value doesn't display/prefill the last logged value.
  2. Logging for a previous date doesn't check whether a value is already logged for
     that date — date selection should fetch and display any existing value in an
     editable text box (currently allows silent duplicate/overwrite without showing prior value).
  3. Charts for weight, heart rate, and temperature start the Y-axis at 0 instead of
     scaling to the min/max of the selected period — flattens trends and makes charts
     hard to read.
severity: major

### 2. D4 — ChartHeader recomputes on period switch
expected: All three stat values (average, range, trend direction arrow) update correctly for each period.
result: [pending]

### 3. H1 — GitHub-style heatmap layout on Dashboard
expected: A 52-column x 7-row heatmap renders horizontally, resembling a GitHub contribution graph, with month labels above. On a narrow phone screen it scrolls horizontally.
result: [pending]

### 4. H2 — Heatmap cell tap tooltip
expected: A tooltip appears showing the formatted date and the names of the metrics logged that day (e.g., "Weight, Steps").
result: [pending]

## Summary

total: 4
passed: 0
issues: 1
pending: 3
skipped: 0
blocked: 0

## Gaps

- gap_id: G-02-5
  truth: "Charts for weight, heart rate, and temperature scale their Y-axis to the min/max of the selected period, not from 0."
  status: resolved
  reason: "User reported: Charts for weight, heart rate and temperature shouldn't start at 0, rather it should be min and max value for selected period of time."
  severity: major
  test: 1
  root_cause: "Every metric chart's Recharts YAxis had no domain prop set, so Recharts computed a default range that always included 0 regardless of the actual data range, flattening trend visibility for weight/heart-rate/temperature whose real values never approach 0."
  artifacts: []
  missing: []
  resolved_by: "commit 6dc699a (feat(charts): scale Y-axis to data range for weight/HR/temp)"
  resolved_at: 2026-09-17

- gap_id: G-02-4
  truth: "Logging a value for a date that already has an entry loads the existing value into an editable field instead of allowing a silent duplicate/overwrite."
  status: resolved
  reason: "User reported: When logging for previous days it should check if value is already logged (date selection should fetch data and display it in editable value text box)."
  severity: major
  test: 1
  root_cause: "The per-date existing-entry lookup (query by date, load into the editable field, mark the form as editing so Save updates rather than duplicates) was already correctly implemented in all six Log forms at the time this gap was reported; this fix commit adds the companion \"no entry for this date\" fallback and re-verifies the existing-entry path end-to-end alongside it, closing out the gap."
  artifacts: []
  missing: []
  resolved_by: "commit 74466eb (fix(log): prefill last logged value when no entry exists for date)"
  resolved_at: 2026-09-17

- gap_id: G-02-3
  truth: "The weight logging form displays/prefills the last logged value."
  status: resolved
  reason: "User reported: When logging new value for weight it should display last value."
  severity: minor
  test: 1
  root_cause: "The load effect in every metric log form only handled the case where an entry already existed for the selected date — when no entry existed it cleared the field(s) to empty instead of prefilling the metric's most recently logged value."
  artifacts: []
  missing: []
  resolved_by: "commit 74466eb (fix(log): prefill last logged value when no entry exists for date)"
  resolved_at: 2026-09-17

- gap_id: G-02-2
  truth: "The chart's Log button is reachable and clickable, not obscured by the bottom nav."
  status: resolved
  reason: "User reported: Log button in chart is hidden under bottom nav. Move it higher or before bottom nav."
  severity: major
  test: 1
  root_cause: "Log FAB used bottom-6 (24px), placing it inside the fixed bottom nav's 64px rendered height; the nav's higher z-index (z-50 vs the FAB's z-10) painted over and intercepted clicks on the button."
  artifacts:
    - path: "src/components/Charts/MetricChart.tsx"
      issue: "FAB positioned bottom-6 right-6 z-10, overlapped by bottom nav"
  missing: []
  resolved_by: "commit 2d12acf (fix(charts): raise log FAB above bottom nav on chart screen)"
  resolved_at: 2026-09-17

- gap_id: G-02-1
  truth: "Each metric renders a chart with real data; the period switch reloads chart data."
  status: resolved
  reason: "User reported: There is some problem with update available banner. Button is not working"
  severity: major
  test: 1
  root_cause: "useRegisterSW() needRefresh destructured as boolean instead of [value, setter] tuple; registerType 'autoUpdate' disabled the skip-waiting message, making the update button a no-op."
  artifacts:
    - path: "src/components/UpdatePrompt.tsx"
      issue: "Tuple destructured as boolean, always truthy"
    - path: "vite.config.ts"
      issue: "registerType: autoUpdate disabled manual update flow"
  missing: []
  resolved_by: "commit 6eef7b9 (fix(pwa): fix update banner no-op and false-positive display)"
  resolved_at: 2026-09-16
  debug_session: ".planning/debug/update-available-banner-button.md"
