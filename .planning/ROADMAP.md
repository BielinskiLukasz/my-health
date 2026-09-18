# Roadmap: MyHealth

## Overview

MyHealth is a privacy-first personal health tracking PWA. The roadmap moves from a working, installable app with core metric logging, through visualization and goal-setting, to full training session management and data portability. Each phase ships something useful in isolation — the user gets a functional tracker at Phase 1, richer insights at Phase 2, motivation tools at Phase 3, custom workout tracking at Phase 4, and complete data control at Phase 5.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Core Logging** - Installable PWA on GitHub Pages with all five core metrics logged and a daily dashboard snapshot
- [ ] **Phase 2: Charts & Visualization** - Weekly/monthly/yearly charts per metric, activity heatmap, and BMI overlay
- [ ] **Phase 3: Targets & Goals** - Deadlined targets with projected pace, streaks, color coding, and personal bests
- [ ] **Phase 4: Training Sessions** - Custom exercise library, multi-exercise session logging, and free-text journal notes
- [ ] **Phase 5: History & Data** - Filterable history list, JSON/CSV export, Samsung Health ZIP import, and push notifications

## Phase Details

### Phase 1: Foundation & Core Logging

**Goal**: Users can install the app, log any of the six core health metrics for any date, and see today's snapshot on the dashboard
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: DEPL-01, PWA-01, PWA-02, PWA-03, PWA-04, WGHT-01, WGHT-02, SLEP-01, SLEP-02, STEP-01, STEP-02, WATR-01, WATR-02, HRTE-01, HRTE-02, TEMP-01, TEMP-02, DASH-01, UX-01, UX-02, UX-03, UX-04
**Success Criteria** (what must be TRUE):

  1. User can open the app on a phone browser, install it to the homescreen, and reopen it from the homescreen — all without a login
  2. User can log weight, sleep (bedtime + wake time), steps, water, heart rate, and body temperature for today or any past date; each entry can be edited or deleted
  3. The dashboard shows today's values for every metric the user has logged
  4. The app works fully offline after the first load; data survives browser restarts
  5. App is live and accessible at the GitHub Pages URL

**Plans**: 4/4 plans executed

Plans:

- [x] 01-01-PLAN.md — Walking Skeleton: install deps, Dexie schema, HashRouter, 3-tab layout, WeightForm, Dashboard, PWA manifest + service worker + update prompt
- [x] 01-02-PLAN.md — Remaining 4 metric forms (sleep, steps, water, heart rate) + Settings (dark mode, height input)
- [x] 01-03-PLAN.md — GitHub Pages deployment workflow + live URL human verification
- [x] 01-04-PLAN.md — Body temperature form (multi-per-day, °C) + Dexie schema v2 migration

**UI hint**: yes

### Phase 2: Charts & Visualization

**Goal**: Users can see their health trends over time through weekly, monthly, and yearly charts per metric, a GitHub-style activity heatmap, and auto-calculated BMI
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: CHRT-01, CHRT-02, CHRT-03, CHRT-04, DASH-02, BMI-01, BMI-02
**Success Criteria** (what must be TRUE):

  1. User can tap any metric and switch between weekly, monthly, and yearly chart views rendered as line or bar charts
  2. User can view a year-view activity heatmap showing which days had training sessions and which days a metric target was met
  3. Each metric tile on the dashboard shows a target progress bar and a red/yellow/green color indicator
  4. User enters height once in settings; BMI is auto-calculated from all weight entries and shown as an overlay on the weight chart

**Plans**: 4/4 plans executed

Plans:

- [x] 02-01-PLAN.md — Recharts install + chart infrastructure (chartColors.ts, aggregation.ts TDD, useChartData) + complete MetricChart screen (W/M/Y, all metrics, FAB, summary stat)
- [x] 02-02-PLAN.md — Activity heatmap (useHeatmapData, ActivityHeatmap CSS Grid 52×7, Dashboard integration, cell tooltip D-13)
- [x] 02-03-PLAN.md — Dashboard sparklines (Sparkline.tsx, MetricTile embed, empty state D-15)
- [x] 02-04-PLAN.md — BMI section (bmi.ts TDD, useBmiData hook, BmiSection component below weight chart D-09)

**UI hint**: yes

### Phase 3: Targets & Goals

**Goal**: Users can set deadlined targets per metric, see projected pace toward each target, track streaks, and spot personal bests
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: TARG-01, TARG-02, TARG-03, TARG-04, TARG-05, DASH-03, PB-01, PB-02
**Success Criteria** (what must be TRUE):

  1. User can set a target value and a target date for each metric; the app shows projected pace and whether they are on track
  2. Target progress bars and red/yellow/green color coding are visible on both the dashboard and the chart views
  3. Dashboard shows the current consecutive-day streak for each metric that has an active target
  4. App automatically detects personal bests (heaviest weight, most steps, longest sleep, etc.) and flags them in history and exercise detail views

**Plans**: 4/5 plans executed (3 original + 2 gap-closure)

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Target engine tracer: Dexie v3 `targets` table, pace/status calc engine (TDD), TargetModal, chart reference line + badge, Dashboard progress bar

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — Streaks + personal bests: streak/PB calc engines (TDD), Dexie v4 `personalBests`, Dashboard/chart streak + PB badge wiring

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03-PLAN.md — Exercise-frequency proxy: Dexie v5 `exerciseLog`, 7th Dashboard tile with weekly target, toggle, status, and week-streak

**Gap Closure Wave 1** *(from 03-VERIFICATION.md — 4 Critical bugs found post-execution)*

- [x] 03-04-PLAN.md — Fix CR-01/CR-02/WR-01/WR-02: personal-best zero-fallback cache poisoning + MetricChart Rules-of-Hooks crash
- [ ] 03-05-PLAN.md — Fix CR-03/CR-04/WR-04: weight target direction backfill + exercise weekly-streak snapshot

### Phase 4: Training Sessions

**Goal**: Users can define custom exercises and log multi-exercise training sessions with reps, sets, duration, intensity, and squash match context; free-text journal notes attach to any date
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: EXRC-01, EXRC-02, SESS-01, SESS-02, SESS-03, SESS-04, JRNL-01, JRNL-02
**Success Criteria** (what must be TRUE):

  1. User can create, rename, and delete custom exercise types; default exercises (warm-up, stretching, push-ups, sit-ups, squats, squash) are pre-loaded
  2. User can log a training session containing one or more exercises, capturing reps/sets, duration, and intensity per exercise
  3. Squash sessions additionally capture match result (win/loss), opponent name, and score
  4. User can write, edit, and delete a free-text journal note for any date

**Plans**: TBD
**UI hint**: yes

### Phase 5: History & Data

**Goal**: Users can browse and filter their full log history, export all data as JSON or CSV, import years of Samsung Health history, and optionally enable a daily logging reminder
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: HIST-01, HIST-02, DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, PWA-05
**Success Criteria** (what must be TRUE):

  1. User can browse a scrollable history list of all logged entries and filter by metric type, date range, and exercise type
  2. User can export all data as a JSON file (full backup) and as a CSV file (for use in spreadsheet apps)
  3. User can import a Samsung Health ZIP export; the app shows a dry-run preview with row counts and errors before committing; duplicate entries are detected and skipped
  4. User can opt in to a daily push notification reminder at a configurable time; the notification fires if they have not logged anything that day

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Core Logging | 4/4 | Complete | 2026-09-14 |
| 2. Charts & Visualization | 4/4 | In Progress|  |
| 3. Targets & Goals | 4/5 | In Progress|  |
| 4. Training Sessions | 0/TBD | Not started | - |
| 5. History & Data | 0/TBD | Not started | - |
