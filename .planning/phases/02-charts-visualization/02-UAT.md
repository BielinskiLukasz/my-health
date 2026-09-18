---
status: partial
phase: 02-charts-visualization
source: [02-VERIFICATION.md]
started: 2026-09-16T16:14:21Z
updated: 2026-09-18T09:10:00Z
---

## Current Test

[testing paused — 5 items outstanding: tests 1-5 pending, plus test 6 awaiting re-verification of the G-02-6 fix (commit 9128812)]

## Tests

### 1. D2 — W/M/Y chart rendering for all 6 metrics
expected: Each metric renders a chart with real data visible. Weight, sleep, steps, heartRate, and temperature render as a line chart in all three periods (W/M/Y); steps and water render as a bar chart in every period (D-06 narrowed to discrete/count metrics only). The period switch reloads chart data and Y-axis ticks show at most 1 decimal place.
result: [pending]
note: "Re-tested fresh at user request on 2026-09-18 — all 3 gaps from the prior pass (G-02-3, G-02-4, G-02-5) are fixed and committed. Expected text corrected: the original wording ('bar for yearly and temperature') is stale — commit a94856c narrowed D-06 so only steps/water stay bar; weight/sleep/heartRate/temperature are line in Y too. Prior result/reported/severity superseded by this re-test."

### 2. D4 — ChartHeader recomputes on period switch
expected: All three stat values (average, range, trend direction arrow) update correctly for each period.
result: [pending]

### 3. H1 — GitHub-style heatmap layout on Dashboard
expected: A 52-column x 7-row heatmap renders horizontally, resembling a GitHub contribution graph, with month labels above. On a narrow phone screen it scrolls horizontally.
result: [pending]

### 4. H2 — Heatmap cell tap tooltip
expected: A tooltip appears showing the formatted date and the names of the metrics logged that day (e.g., "Weight, Steps").
result: [pending]
note: "Quick task 260917-i9a fixed a previously-undiscovered bug where the tooltip could render under/behind the fixed bottom nav for taps near the bottom of the viewport (raised z-index + vertical clamp/flip in ActivityHeatmap.tsx). This test still needs a human UAT pass to visually confirm the tooltip renders correctly."

### 5. BMI-02 — BMI section below weight chart
expected: On the weight metric's chart screen only, a BMI section appears below the main chart showing current BMI value, color-coded category (blue=Underweight, emerald=Normal, yellow=Overweight, red=Obese), and a mini trend line chart with reference lines at BMI 18.5/25/30. The Y-axis domain always includes the 18.5-25 normal range even if actual BMI data falls outside it, and ticks show at most 1 decimal place. No BMI section appears on other metrics' chart screens.
result: [pending]
note: "Never had a UAT checkpoint — 02-04-SUMMARY.md's BMI-02 coverage entry (human_judgment: true) was missed when the original 4-test UAT file was created. Also covers ad-hoc fixes: BMI Y-axis domain clamp (commit 9e13aa2) and tick decimal formatting (commit 7830271)."

### 6. DASH-02 — Dashboard sparklines + tile layout
expected: Every Dashboard metric tile shows a 14-day mini sparkline. For weight/heartRate/temperature, the sparkline's Y-axis scales to the min/max of that 14-day window (not from 0), so trends are visible rather than flattened. Tiles no longer show a "last logged date" line or "Not logged today" badge — that space is used to render the sparkline taller. Metrics with no recent data show "Start logging to see trends" instead of a blank chart.
result: issue
reported: "the not logged message and date of log are not visible in home page now"
severity: major
note: "This is the exact behavior the ad-hoc decluttering commit (8d38c9f, quick task 260917-h77) intentionally changed — it dropped the lastDate line and 'Not logged today' badge from MetricTile variant B to make room for a taller sparkline. User is flagging that removal as a regression, not confirming it. Never had a UAT checkpoint — 02-03-SUMMARY.md (sparklines) has no coverage: block at all, so it fell through legacy extraction and no test was generated until now. Fix landed in commit 9128812 (restoring the last-logged-date line and \"Not logged today\" badge as one compact row alongside the taller Y-axis-scaled sparkline from commit 8d38c9f) and is awaiting human re-verification."

## Summary

total: 6
passed: 0
issues: 1
pending: 5
skipped: 0
blocked: 0

## Gaps

- gap_id: G-02-6
  truth: "Tiles no longer show a \"last logged date\" line or \"Not logged today\" badge — that space is used to render the sparkline taller."
  status: failed
  reason: "User reported: the not logged message and date of log are not visible in home page now"
  severity: major
  test: 6
  root_cause: ""
  artifacts: []
  missing: []
  resolved_by: "commit 9128812 (fix: restore last-logged-date and not-logged badge to dashboard tile)"
  resolved_at: 2026-09-18
  fix_committed: true

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
  refinement: "The most-recently-logged-value prefill was found to incorrectly apply to any date with no entry, including historic backfill dates. Narrowed to only apply when the selected date equals today (todayISO()) — historic dates with no entry now leave the field(s) empty instead of being prefilled."
  refinement_resolved_by: "commit b436efa (fix: gate G-02-3 fallback prefill on today only)"

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
