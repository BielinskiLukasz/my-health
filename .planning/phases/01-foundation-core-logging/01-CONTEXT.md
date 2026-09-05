# Phase 1: Foundation & Core Logging - Context

**Gathered:** 2026-09-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a working, installable PWA on GitHub Pages with logging for 5 core health metrics (weight, sleep, steps, water, resting heart rate) for any date, and a daily dashboard snapshot showing today's values. Establishes all foundational patterns — routing, DB schema, component structure, PWA setup — that all subsequent phases build upon.

</domain>

<decisions>
## Implementation Decisions

### App Navigation Structure

- **D-01:** Navigation model is a **3-tab bottom bar**: Home (dashboard) | Log | Settings. No per-metric tabs. — **Reversibility:** costly — changing nav structure after 5 phases of screens are built against it touches every route and screen component.
- **D-02:** The Log tab shows a **metric picker list** (list of the 5 metrics). Tapping a metric opens its dedicated form screen.
- **D-03:** Log form **defaults to today's date**. User can tap the date field to change it for backfilling past entries.
- **D-04:** Tapping a metric tile on the dashboard **navigates to the Log form pre-selected on that metric** (same as Log tab + picking the metric). No separate metric detail screen in Phase 1.

### Metric Entry UX

- **D-05:** Edit/delete happens **from the Log form**: when the user navigates to a date+metric that already has an entry, the form pre-fills with existing values and shows a Delete button (upsert pattern for one-per-day metrics; for multi-per-day, user edits a specific entry).
- **D-06:** Sleep form uses **two time pickers** (bedtime + wake time); sleep duration is auto-calculated and shown inline. Handles next-day wake times (e.g., 11 PM → 7 AM = 8h).
- **D-07:** After saving a new log entry: **stay on the Log screen** (show a success toast, return to the metric picker). Optimizes for users logging multiple metrics in one session.
- **D-08:** Numeric metrics (weight, steps, water, heart rate) use **native number input** (`input type="number"`) with appropriate step values (e.g., 0.1 for weight, 1 for steps/water/HR). Opens numeric keyboard on mobile.
- **D-09:** Date picker **blocks future dates** (max = today). Health logging is for recorded data, not future planning.

### Dashboard Tile Content

- **D-10:** When a metric **is logged today**: tile shows **value + unit only** (e.g., "73.2 kg", "7h 45m", "8,432 steps"). Clean and readable. Room for Phase 2 to add progress bars without redesign.
- **D-11:** When a metric **is NOT logged today**: tile shows **last known value + the date it was logged + "not logged today"** indicator (e.g., "73.2 kg (Sep 2) · Not logged today"). Shows meaningful data while clearly signalling the gap.
- **D-12:** Dashboard layout: **2-column card grid**. All 5 metric tiles visible above the fold on most phones.
- **D-13:** Dashboard **header shows the current date prominently** (e.g., "Wednesday, Sep 3"). Anchors the daily-snapshot concept.
- **D-14:** No explicit "log missing metrics" banner or badge. The tile state (last value + "not logged today") is sufficient indication.

### IndexedDB Schema Model (Dexie.js)

- **D-15:** Use **separate Dexie table per metric** (not a unified entries table). Tables: `weights`, `sleepEntries`, `stepEntries`, `waterEntries`, `heartRates`. Clean typed schemas, straightforward queries, no type-switching. — **Reversibility:** one-way — migrating from per-metric tables to a unified schema (or vice versa) in a later version requires a Dexie version upgrade and data migration script; exported user data structures also change.
- **D-16:** **Mixed cardinality per day**: weight, heart rate (and Phase 4 training sessions) allow **multiple entries per day** (auto-increment ID primary key + date index). Sleep, steps, and water are **one entry per day** (date as primary key, upsert on save). Rationale: "resting heart rate" and weight are measured multiple times a day; sleep and step count are daily totals.
- **D-17:** Dates stored as **ISO date string (YYYY-MM-DD)** as primary index (or indexed field for multi-per-day tables). Sleep bedtime/waketime stored as full ISO timestamps (e.g., "2026-09-02T23:00:00"). — **Reversibility:** one-way — changing the date storage format in production data requires a migration for all existing entries.
- **D-18:** For **dashboard display** when weight or heart rate has multiple readings for today: show the **daily average**. Same rule applies to Phase 2 charts (daily average plotted per day).
- **D-19:** Dexie schema versioned **incrementally**: Phase 1 starts at version 1 with Phase 1 tables only. Each phase that adds new tables bumps the version number. Standard Dexie `.version(N).stores({...})` migration pattern.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and requirements list (DEPL-01, PWA-01–04, WGHT-01–02, SLEP-01–02, STEP-01–02, WATR-01–02, HRTE-01–02, DASH-01, UX-01–04)
- `.planning/REQUIREMENTS.md` — Full requirement definitions with IDs and acceptance criteria; Phase 1 traceability table
- `.planning/PROJECT.md` — Core constraints (GitHub Pages, IndexedDB, React+Vite, Metric units), tech stack choices with rationale, key decisions table

### Technology Stack (from PROJECT.md / CLAUDE.md)
- React 18 + Vite 5 + TypeScript — build toolchain
- Dexie.js 4 — IndexedDB wrapper (schema versioning, typed tables)
- Zustand 4 — global state management
- Tailwind CSS 3 + shadcn/ui — styling
- vite-plugin-pwa — service worker + manifest generation
- date-fns 3 — date manipulation
- HashRouter — required for GitHub Pages (no server-side routing)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield project. No src/ directory exists.

### Established Patterns
- None yet — Phase 1 establishes all patterns.

### Integration Points
- `data/import/` directory exists — Samsung Health import data (for Phase 5 testing). No code touches this yet.
- GitHub Pages deployment: HashRouter is required (`BrowserRouter` causes 404 on page refresh). `vite.config.ts` must set `base` to the GitHub Pages path.
- PWA: `navigator.storage.persist()` must be called on first load to prevent IndexedDB data eviction by the browser.

</code_context>

<specifics>
## Specific Ideas

- Sleep time picker must handle overnight times correctly (bedtime before midnight, wake time after midnight). Duration = wake - bedtime, handling the date boundary.
- The 2-column grid on dashboard: 5 tiles means one row of 2 + one row of 2 + one full-width tile, or 2+2+1 layout — visual balance to decide during implementation.
- "Not logged today" tile variant (D-11): shows last known value dimmed or in a secondary style, date in a smaller label, and "Not logged today" in a muted tag.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Foundation & Core Logging*
*Context gathered: 2026-09-03*
