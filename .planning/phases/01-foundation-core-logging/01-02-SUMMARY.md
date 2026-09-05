---
phase: "01"
plan: "02"
plan_name: metric-forms-and-settings
subsystem: log-forms
status: complete
tags: [sleep-form, steps-form, water-form, heart-rate-form, settings, dark-mode, dexie, date-fns]
requirements_completed: [SLEP-01, SLEP-02, STEP-01, STEP-02, WATR-01, WATR-02, HRTE-01, HRTE-02, UX-02, UX-04]

depends_on: [01-01]
provides: [sleep-form, steps-form, water-form, heart-rate-form, settings-screen]
affects: [01-03]

tech_stack:
  added: []
  patterns:
    - SleepForm overnight detection (wakeHour < bedHour → wake date = currentDate + 1 day)
    - Upsert-via-put() for one-per-day tables (sleep, steps, water)
    - Add/update-by-id for multi-per-day table (heartRates)
    - localStorage auto-save for Settings (no save button — instant persist on change)
    - Native HTML toggle button with role="switch" for dark mode (no shadcn Switch needed)

key_files:
  created:
    - src/components/Log/SleepForm.tsx — sleep entry with time pickers, overnight detection, upsert/delete
    - src/components/Log/StepsForm.tsx — steps entry, numeric input, upsert/delete
    - src/components/Log/WaterForm.tsx — water intake in ml, numeric input, upsert/delete
    - src/components/Log/HeartRateForm.tsx — heart rate, multi-per-day add/update/delete
    - src/components/Settings/Settings.tsx — dark mode toggle + height input
  modified:
    - src/components/Log/LogScreen.tsx — routes all 5 metrics to their form components
    - src/App.tsx — replaced stub Settings div with real Settings component

key_decisions:
  - MetricTile was already fully implemented with all 5 metrics in Plan 01-01 — no changes needed (deviation from plan)
  - Native HTML toggle button (role="switch") used for dark mode instead of shadcn Switch — avoids adding new dependency
  - Height input auto-saves to localStorage on every keystroke (no save button) — matches system settings UX pattern
  - SleepForm uses hour comparison for overnight detection (wakeHour < bedHour) per D-06 and D-17

metrics:
  started: "2026-09-05"
  completed: "2026-09-05"
  duration_minutes: ~30
  tasks_completed: 2
  commits: 2
  files_created: 5
  files_modified: 2
  deviations: 1

actuals:
  tokens: 45000
  tasks: 2
  commits: 2
---

# Phase 01 Plan 02: Metric Forms and Settings Summary

**One-liner:** Four remaining metric forms (sleep with overnight detection, steps, water, heart rate) plus Settings screen with dark mode toggle and height input — all 5 metrics now fully loggable.

## Accomplishments

1. **SleepForm.tsx (SLEP-01, SLEP-02):** Full upsert/delete form with `input[type="time"]` for bedtime and wake time. Overnight detection: if `wakeHour < bedHour`, wake ISO timestamp uses next calendar day as date prefix (D-06, D-17). Duration auto-calculates using date-fns `differenceInHours`/`differenceInMinutes`, wrapped in try/catch per T-02-04. `db.sleepEntries.put()` for upsert (one per day, date is primary key).
2. **StepsForm.tsx (STEP-01, STEP-02):** Numeric input with `step="1" min="0" max="999999"`. `db.stepEntries.put()` for upsert. Delete with confirm dialog.
3. **WaterForm.tsx (WATR-01, WATR-02):** Numeric input with `step="50" min="0" max="10000"`. `db.waterEntries.put()` for upsert. Delete with confirm dialog.
4. **HeartRateForm.tsx (HRTE-01, HRTE-02):** Numeric input with `step="1" min="20" max="300"`. Multi-per-day table — `db.heartRates.add()` for new entries, `db.heartRates.update()` for editing most recent. Delete targets specific entry by id.
5. **LogScreen.tsx updated:** Routes `/log/sleep` → SleepForm, `/log/steps` → StepsForm, `/log/water` → WaterForm, `/log/heartRate` → HeartRateForm. All 5 metrics now route to their form components.
6. **Settings.tsx (UX-02, UX-04):** Dark mode toggle calls `useAppStore.toggleDarkMode()` which syncs all three: Zustand state, `localStorage['myhealth-darkmode']`, `document.documentElement.classList`. Height input auto-saves to `localStorage['myhealth-height']` on every change. Both settings load on mount.
7. **App.tsx updated:** Real Settings component replaces the stub div.
8. **Build verified:** `npm run build` exits 0 with no TypeScript errors.

## Task Commits

| Task | Description | Hash |
|------|-------------|------|
| 1 (auto) | Four metric forms + LogScreen routing | 1a47a95 |
| 2 (auto) | Settings screen with dark mode + height | 6430704 |

## Deviations from Plan

### Auto-fixed Issues

None — both tasks executed exactly as planned.

### Pre-completed Work (from Plan 01-01)

**1. MetricTile already had all 5 metrics implemented**
- **Found during:** Task 1 read phase
- **What happened:** The Plan 01-01 executor implemented all 5 metric queries in MetricTile.tsx (sleep, steps, water, heartRate including daily average for heartRate per D-18) as part of the tracer task. Plan 01-02 called for "completing" MetricTile but it was already complete.
- **Action taken:** Verified existing implementation was correct per plan specs — no changes needed.
- **Files modified:** None (MetricTile left unchanged)

## Known Stubs

None — all plan artifacts are fully wired. The only remaining stubs from Plan 01-01 (PWA icons) are tracked there and carry forward to Plan 01-03.

## Self-Check

- [x] src/components/Log/SleepForm.tsx exists, uses input[type="time"], calls db.sleepEntries.put()
- [x] SleepForm overnight detection: wakeHour < bedHour → wake ISO uses next-day date prefix
- [x] src/components/Log/StepsForm.tsx exists, uses input[type="number"] step="1"
- [x] src/components/Log/WaterForm.tsx exists, uses input[type="number"] step="50"
- [x] src/components/Log/HeartRateForm.tsx exists, calls db.heartRates.add() for new, update() for edit
- [x] src/components/Log/LogScreen.tsx routes all 5 metrics (verified: 8 occurrences of form names)
- [x] src/components/Settings/Settings.tsx exists with toggleDarkMode and myhealth-height
- [x] src/App.tsx imports real Settings component (stub removed)
- [x] All delete dialogs use correct copywriting ("Delete this [metric] entry? This cannot be undone.")
- [x] All forms navigate to '/log' after save or delete (D-07)
- [x] npm run build exits 0

## Self-Check: PASSED

## Next Phase Readiness

All 5 metric forms are live. Plan 01-03 (GitHub Pages deployment) is unblocked.
