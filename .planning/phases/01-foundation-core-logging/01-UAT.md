---
status: testing
phase: 01-foundation-core-logging
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md]
started: 2026-09-18T00:00:00Z
updated: 2026-09-18T00:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 2
name: Install App to Homescreen (PWA)
expected: |
  On a phone browser, open the GitHub Pages URL, tap "Add to Home Screen", close the browser, reopen from the homescreen icon. App opens standalone (no browser chrome), no login prompt.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Stop the dev server, clear ephemeral state, start fresh (`npm run dev`). App boots with no console errors, dashboard loads, and existing data (if any) still shows.
result: pass

### 2. Install App to Homescreen (PWA)
expected: On a phone browser, open the GitHub Pages URL, tap "Add to Home Screen", close the browser, reopen from the homescreen icon. App opens standalone (no browser chrome), no login prompt.
result: [pending]

### 3. Offline Mode & Data Persistence
expected: Load the app once, enable airplane mode / DevTools offline, reload — app still loads from cache. Log an entry, close the browser, reopen — entry still there.
result: [pending]

### 4. Log a Weight Entry
expected: From Log tab, pick Weight, enter a value for today, save — toast confirms, entry appears on Dashboard. Reopen the form for the same date — value pre-fills. Delete via confirm dialog removes it.
result: [pending]

### 5. Log a Sleep Entry (overnight detection)
expected: Enter a bedtime later than wake time (e.g. bed 23:00, wake 07:00) — duration computes correctly across midnight. Entry saves, edits, and deletes correctly.
result: [pending]

### 6. Log a Steps Entry
expected: Enter a step count for today, save — appears on Dashboard. Edit and delete work.
result: [pending]

### 7. Log a Water Entry
expected: Enter water intake (ml) for today, save — appears on Dashboard. Edit and delete work.
result: [pending]

### 8. Log a Heart Rate Entry (multi-per-day)
expected: Add multiple heart rate readings for the same day — each saved separately, most recent editable/deletable individually.
result: [pending]

### 9. Log a Temperature Entry (pre-fill & delete)
expected: Add a temperature reading (e.g. 36.5) for today. Reopening the form for that date pre-fills the value and shows a Delete button. Delete removes it with confirmation.
result: [pending]

### 10. Dashboard Shows All 6 Metric Tiles
expected: Dashboard shows tiles for weight, sleep, steps, water, heart rate, and temperature. Each tile shows today's value if logged (Variant A), last known value dimmed if not logged today (Variant B), or "no data" if never logged (Variant C). Temperature tile specifically must be present (this was a known gap, fixed in commit 2dfbc35).
result: [pending]

### 11. Settings: Dark Mode & Height
expected: Toggling dark mode switches the whole app theme instantly and persists across reloads. Entering a height value auto-saves (no save button) and persists across reloads.
result: [pending]

### 12. GitHub Pages Live Deployment
expected: The live GitHub Pages URL loads the app with the full Phase 01 feature set — all 6 metric forms accessible, dashboard shows 6 tiles including temperature, PWA installable.
result: [pending]

## Summary

total: 12
passed: 1
issues: 0
pending: 11
skipped: 0
blocked: 0

## Gaps

[none yet]

## Notes

- Prior `01-VERIFICATION.md` (2026-09-14) reported `gaps_found` (temperature tile missing from Dashboard). That gap was fixed same-day in commit `2dfbc35`. This UAT re-confirms it live (Test 10).
- `01-03-SUMMARY.md` states the live GitHub Pages URL was already user-verified on 2026-09-14, but `01-VERIFICATION.md` still lists it as unresolved. Test 12 re-confirms to settle the discrepancy.
