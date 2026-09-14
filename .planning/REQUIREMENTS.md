# Requirements: MyHealth

**Defined:** 2026-09-02
**Core Value:** Clear, honest charts of your own health history — with full data ownership and the ability to track any exercise you actually do

## v1 Requirements

### Dashboard

- [ ] **DASH-01**: User sees today's snapshot across all tracked metrics on the home screen
- [x] **DASH-02**: Each metric tile shows current value, target progress bar, and color indicator (red/yellow/green)
- [ ] **DASH-03**: Dashboard shows active streak count for each metric with a target

### Metrics — Core Logging

- [ ] **WGHT-01**: User can log weight (kg) for any date, including past dates
- [ ] **WGHT-02**: User can edit or delete any weight entry
- [x] **SLEP-01**: User can log sleep as bedtime + wake time for any date; duration auto-calculated
- [x] **SLEP-02**: User can edit or delete any sleep entry
- [x] **STEP-01**: User can log daily step count (numeric) for any date
- [x] **STEP-02**: User can edit or delete any step entry
- [x] **WATR-01**: User can log daily water intake (ml) for any date
- [x] **WATR-02**: User can edit or delete any water entry
- [x] **HRTE-01**: User can log resting heart rate (bpm) for any date
- [x] **HRTE-02**: User can edit or delete any heart rate entry
- [x] **TEMP-01**: User can log body temperature (°C) for any date and time; multiple entries per day are allowed
- [x] **TEMP-02**: User can edit or delete any temperature entry
- [ ] **BMI-01**: User stores height once in settings; BMI auto-calculated from weight entries
- [ ] **BMI-02**: BMI is charted alongside weight in the weight view
- [ ] **JRNL-01**: User can write an optional free-text journal note for any date
- [ ] **JRNL-02**: User can edit or delete journal notes

### Metrics — Training Sessions

- [ ] **EXRC-01**: User can create, edit, and delete custom exercise types
- [ ] **EXRC-02**: App ships with default exercises: warm-up, stretching, push-ups, sit-ups, squats, squash
- [ ] **SESS-01**: User can log a training session for any date containing one or more exercises
- [ ] **SESS-02**: Each exercise in a session captures: reps/sets, duration, and intensity/effort level
- [ ] **SESS-03**: Squash sessions additionally capture: match result (win/loss), opponent name, score
- [ ] **SESS-04**: User can edit or delete any training session

### Targets

- [ ] **TARG-01**: User can set a target value and target date for each metric (weight, sleep, steps, water, heart rate, exercise frequency)
- [ ] **TARG-02**: App calculates and displays projected pace vs target deadline
- [ ] **TARG-03**: Target progress shown as progress bar with percentage
- [ ] **TARG-04**: Metrics color-coded red/yellow/green based on proximity to target
- [ ] **TARG-05**: Streak shows consecutive days the target was met

### Personal Bests

- [ ] **PB-01**: App automatically detects and records personal bests (most reps, heaviest weight, longest session, most steps, etc.)
- [ ] **PB-02**: Personal best entries are flagged in history and exercise detail views

### Charts & History

- [x] **CHRT-01**: User can view a weekly chart for any metric
- [x] **CHRT-02**: User can view a monthly chart for any metric
- [x] **CHRT-03**: User can view a yearly chart for any metric
- [x] **CHRT-04**: Activity heatmap shows training days and target-hit days (GitHub-style grid)
- [ ] **HIST-01**: User can browse a scrollable history list of all logged entries
- [ ] **HIST-02**: History list is filterable by metric type, date range, and exercise type

### Data

- [ ] **DATA-01**: User can import a Samsung Health export ZIP (parses CSV files for steps, sleep, weight, heart rate, exercise)
- [ ] **DATA-02**: Import shows a dry-run preview with error reporting before committing
- [ ] **DATA-03**: Import detects and skips duplicate entries
- [ ] **DATA-04**: User can export all data as JSON (full backup/restore)
- [ ] **DATA-05**: User can export all data as CSV (for Excel / Google Sheets)
- [ ] **DATA-06**: All data stored in browser IndexedDB — no server required

### PWA & Offline

- [ ] **PWA-01**: App is installable on phone homescreen (PWA manifest)
- [ ] **PWA-02**: App works fully offline after first load (service worker)
- [ ] **PWA-03**: Browser prompted for persistent storage on first load (prevents eviction data loss)
- [ ] **PWA-04**: App shows an "update available" prompt when a new version is deployed
- [ ] **PWA-05**: User can enable an optional push notification reminder if they haven't logged by a configurable time of day

### UX & Settings

- [ ] **UX-01**: Mobile-first responsive design — primary target is phone
- [x] **UX-02**: Dark mode with manual toggle; preference persisted
- [ ] **UX-03**: All units in metric (kg, km, ml, cm)
- [x] **UX-04**: User can enter their height in settings (used for BMI calculation)

### Deployment

- [ ] **DEPL-01**: App is deployed and functional on GitHub Pages from Phase 1

## v2 Requirements

### Potential Future Additions

- **BODY-01**: Body measurements tracking (waist, chest, hips in cm)
- **CHRT-V2-01**: Multi-metric overlay charts (e.g., weight + steps on same chart)
- **NOTF-V2-01**: Notification scheduling per metric (different times for different reminders)
- **IMP-V2-01**: Import from Apple Health export format
- **GOAL-V2-01**: Stretch goals / multiple targets per metric (e.g., minimum + ideal)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user / profile switching | Single user only; adds schema complexity |
| Cloud sync / accounts | Core value is no server, no lock-in |
| Imperial units | Metric only; deliberate simplification |
| Calorie / nutrition tracking | Separate concern; out of scope for v1 |
| Real-time GPS tracking | Step count entered manually or imported |
| Social features, leaderboards, challenges | Contradicts private-app positioning |
| Wearable / Apple Health / Google Fit direct sync | OAuth complexity; Samsung Health ZIP covers recovery |
| AI coaching / ML insights | Cloud dependency; premature complexity |
| Workout plans / prescribed programs | Tracking only, not prescribing |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPL-01 | Phase 1 | Pending |
| PWA-01 | Phase 1 | Pending |
| PWA-02 | Phase 1 | Pending |
| PWA-03 | Phase 1 | Pending |
| PWA-04 | Phase 1 | Pending |
| PWA-05 | Phase 5 | Pending |
| DASH-01 | Phase 1 | Pending |
| DASH-02 | Phase 2 | Complete |
| DASH-03 | Phase 3 | Pending |
| WGHT-01 | Phase 1 | Pending |
| WGHT-02 | Phase 1 | Pending |
| SLEP-01 | Phase 1 | Complete |
| SLEP-02 | Phase 1 | Complete |
| STEP-01 | Phase 1 | Complete |
| STEP-02 | Phase 1 | Complete |
| WATR-01 | Phase 1 | Complete |
| WATR-02 | Phase 1 | Complete |
| HRTE-01 | Phase 1 | Complete |
| HRTE-02 | Phase 1 | Complete |
| TEMP-01 | Phase 1 | Complete |
| TEMP-02 | Phase 1 | Complete |
| BMI-01 | Phase 2 | Pending |
| BMI-02 | Phase 2 | Pending |
| JRNL-01 | Phase 4 | Pending |
| JRNL-02 | Phase 4 | Pending |
| EXRC-01 | Phase 4 | Pending |
| EXRC-02 | Phase 4 | Pending |
| SESS-01 | Phase 4 | Pending |
| SESS-02 | Phase 4 | Pending |
| SESS-03 | Phase 4 | Pending |
| SESS-04 | Phase 4 | Pending |
| TARG-01 | Phase 3 | Pending |
| TARG-02 | Phase 3 | Pending |
| TARG-03 | Phase 3 | Pending |
| TARG-04 | Phase 3 | Pending |
| TARG-05 | Phase 3 | Pending |
| PB-01 | Phase 3 | Pending |
| PB-02 | Phase 3 | Pending |
| CHRT-01 | Phase 2 | Complete |
| CHRT-02 | Phase 2 | Complete |
| CHRT-03 | Phase 2 | Complete |
| CHRT-04 | Phase 2 | Complete |
| HIST-01 | Phase 5 | Pending |
| HIST-02 | Phase 5 | Pending |
| DATA-01 | Phase 5 | Pending |
| DATA-02 | Phase 5 | Pending |
| DATA-03 | Phase 5 | Pending |
| DATA-04 | Phase 5 | Pending |
| DATA-05 | Phase 5 | Pending |
| DATA-06 | Phase 5 | Pending |
| UX-01 | Phase 1 | Pending |
| UX-02 | Phase 1 | Complete |
| UX-03 | Phase 1 | Pending |
| UX-04 | Phase 1 | Complete |

**Coverage:**

- v1 requirements: 54 total
- Mapped to phases: 54/54
- Unmapped: 0

---
*Requirements defined: 2026-09-02*
*Last updated: 2026-09-03 — traceability finalized after roadmap creation*
