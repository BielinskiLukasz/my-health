# MyHealth

## What This Is

A personal health tracking Progressive Web App that lives entirely in the browser — no account, no server, no lock-in. Track weight, sleep, steps, water intake, heart rate, and fully configurable training sessions. See rich weekly/monthly/yearly charts, activity heatmaps, and progress toward personal targets with deadlines. Import years of history from Samsung Health and export any time as JSON or CSV.

## Core Value

Clear, honest charts of your own health history — something Samsung Health never gave you — with full data ownership and the ability to track any exercise you actually do.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Metrics & Logging**
- [ ] User can log weight (kg) for any date (backfill supported)
- [ ] User can log sleep as bedtime + wake time; duration auto-calculated
- [ ] User can log daily step count for any date
- [ ] User can log daily water intake (ml) for any date
- [ ] User can log resting heart rate for any date
- [ ] User can write an optional free-text journal note for any date
- [ ] User can log a training session (multi-exercise) for any date
- [ ] Each exercise in a session captures: reps/sets, duration, and intensity/effort level
- [ ] Squash sessions additionally capture: match result (win/loss), opponent name, score

**Exercise Configuration**
- [ ] User can create, edit, and delete custom exercise types
- [ ] Default exercises: warm-up, stretching, push-ups, sit-ups, squats, squash

**Targets**
- [ ] User can set a target value + target date for each metric (weight, sleep, steps, water, exercise frequency)
- [ ] App shows projected pace vs target deadline
- [ ] Dashboard shows progress bar, color coding (red/yellow/green), and streak per metric

**Views & Charts**
- [ ] Dashboard shows today's snapshot across all metrics
- [ ] Weekly / monthly / yearly chart view per metric (line/bar charts via Recharts)
- [ ] Activity heatmap (GitHub-style) showing training and target-hit days
- [ ] History list: scrollable log of past entries, filterable by metric type, date range, exercise

**Personal Bests**
- [ ] App detects and flags personal records (most reps, longest session, etc.)
- [ ] PBs visible in history and on exercise detail views

**BMI**
- [ ] User enters height once (settings); BMI auto-calculated from weight entries and charted alongside weight

**Data**
- [ ] Import Samsung Health export ZIP (parses CSVs for steps, sleep, weight, heart rate, exercise)
- [ ] Export all data as JSON (full backup/restore)
- [ ] Export all data as CSV (for Excel / Google Sheets)
- [ ] All data stored in browser (IndexedDB); no server required

**PWA**
- [ ] Installable on phone homescreen (PWA manifest + service worker)
- [ ] Works fully offline after first load
- [ ] Push notification reminder if user hasn't logged by end of day (configurable time)

**UX**
- [ ] Mobile-first responsive design
- [ ] Dark mode with manual toggle (remembers preference)
- [ ] Metric units throughout (kg, km, ml, cm)

**Deployment**
- [ ] Deployed and functional on GitHub Pages (first milestone deliverable)

### Out of Scope

- Multi-user / profile switching — single user only
- Backend / cloud sync — browser storage + manual export is the model
- Imperial units — metric only
- Calorie / nutrition tracking — separate concern, not in v1
- Real-time GPS tracking — step count entered manually or imported
- Social sharing of achievements — private app

## Context

- Owner builds for personal use; data privacy is a core constraint (no accounts, no external services)
- Samsung Health export available for testing the importer against real data
- GitHub Pages deployment must work from day one — used as the test environment
- Squash is a recurring sport session with match context beyond a simple workout

## Constraints

- **Hosting**: GitHub Pages (static only) — no server-side code, no databases, no auth services
- **Storage**: IndexedDB in browser — all data local to device; export is the backup strategy
- **Tech stack**: React + Vite — chosen for charting ecosystem (Recharts) and GitHub Pages deployment
- **Units**: Metric only (kg, km, ml) — no toggle needed

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Browser-only storage (IndexedDB) | No account friction; full data ownership; works offline | — Pending |
| React + Vite | Recharts ecosystem; clean GitHub Pages deploy via `vite build` | — Pending |
| PWA with service worker | Mobile-first; offline logging at gym; homescreen install | — Pending |
| Squash as special exercise type | Match context (win/loss, opponent, score) differs from rep-based exercises | — Pending |
| Targets have deadlines | Projected pace adds motivation vs open-ended goals | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-02 after initialization*
