# Phase 1: Foundation & Core Logging - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-03
**Phase:** 1-Foundation & Core Logging
**Areas discussed:** App navigation structure, Metric entry UX, Dashboard tile content, IndexedDB schema model

---

## App Navigation Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal 3-tab bar | Home / Log / Settings. Log tab opens a metric picker. Scales cleanly into all future phases. | ✓ |
| Per-metric bottom tabs | One tab per metric (6+ tabs). Crowded on mobile. | |
| Dashboard-centric, no persistent nav | No bottom bar; drill into metrics from dashboard tiles. | |

**Q: What does the Log tab show?**

| Option | Description | Selected |
|--------|-------------|----------|
| Metric picker list | List of 5 metrics; tap one → form screen. | ✓ |
| Inline quick-entry forms | All 5 forms stacked on one screen. Cluttered for sleep (two time pickers). | |
| Today's date context first | Shows which metrics are already logged + quick-add buttons. | |

**Q: How should the date default work on the Log form?**

| Option | Description | Selected |
|--------|-------------|----------|
| Always default to today | Today pre-filled; tap date to change for backfill. | ✓ |
| Show the last-logged date | Pre-fill last entry's date. Useful for yesterday but confusing. | |
| Always open blank | User must always set date. Extra friction. | |

**Q: What does tapping a dashboard metric tile do in Phase 1?**

| Option | Description | Selected |
|--------|-------------|----------|
| Go to metric log form | Opens Log form pre-selected on that metric. | ✓ |
| Open a metric detail screen | Dedicated screen with entry list + Add button. Bare in Phase 1. | |
| No tap action in Phase 1 | Read-only tiles, log via Log tab only. | |

---

## Metric Entry UX

**Q: How does a user edit or delete a past entry?**

| Option | Description | Selected |
|--------|-------------|----------|
| Edit/delete from the Log form | Form pre-fills when navigating to existing date+metric; Delete button shown. | ✓ |
| Dedicated recent entries list | Last 5-7 entries below metric picker with edit/delete icons. | |
| Defer to Phase 5 history | Phase 1 add-only. Contradicts WGHT-02 etc. requirements. | |

**Q: How does the sleep form collect bedtime + wake time?**

| Option | Description | Selected |
|--------|-------------|----------|
| Two time pickers | Bedtime + Wake time pickers; duration auto-calculated. Handles overnight. | ✓ |
| Duration input only | User enters hours directly. Contradicts SLEP-01. | |
| Text input with smart parsing | Natural language parsing. Unreliable. | |

**Q: What happens after saving a log entry?**

| Option | Description | Selected |
|--------|-------------|----------|
| Return to dashboard | Navigate to Home tab; see updated tile immediately. | |
| Stay on the Log screen | Success toast; stay on metric picker for next log. | ✓ |
| Show a confirmation screen | Flash 'Logged!' then auto-navigate back. | |

**User's choice:** Stay on Log screen — optimizes for logging multiple metrics in one session.

**Q: What input type for numeric metrics?**

| Option | Description | Selected |
|--------|-------------|----------|
| Native number input | input type="number" with step; opens numeric keyboard on mobile. | ✓ |
| Stepper with +/- buttons | Touch-friendly but slow for large numbers (e.g., 10,000 steps). | |
| Slider + number input combo | Overkill for Phase 1. | |

**Q: Should date picker allow future dates?**

| Option | Description | Selected |
|--------|-------------|----------|
| No — today and past only | max=today on date picker. | ✓ |
| Yes — any date | Allows logging future data. No valid use case. | |

---

## Dashboard Tile Content

**Q: What does a tile show when logged today?**

| Option | Description | Selected |
|--------|-------------|----------|
| Value + unit only | e.g., "73.2 kg" / "7h 45m" / "8,432 steps". | ✓ |
| Value + last logged time | e.g., "73.2 kg · logged 8:32 AM". | |
| Value + streak placeholder | e.g., "73.2 kg · 🔥 3 days" (Phase 3 placeholder). | |

**Q: What does a tile show when NOT logged today?**

**User's choice (freeform):** Last known value + date it was logged + indicator that today is not logged.
**Notes:** e.g., "73.2 kg (Sep 2) · Not logged today". Combines meaningful data with clear gap signal. More informative than just "— not logged".

**Q: What tile layout on the dashboard?**

| Option | Description | Selected |
|--------|-------------|----------|
| 2-column card grid | 5 tiles in 2-column grid; all visible above fold on phones. | ✓ |
| Single-column vertical list | Full-width cards; more space per tile but requires scrolling. | |
| Horizontal scroll row | Cards scroll left-right; hides off-screen content. | |

**Q: What date shown in dashboard header?**

| Option | Description | Selected |
|--------|-------------|----------|
| Prominent header with date | e.g., "Wednesday, Sep 3". Anchors daily-snapshot concept. | ✓ |
| No date shown | Cleaner but loses the daily framing. | |
| Greeting + date | e.g., "Good morning — Sep 3". Feels too much like a weather app. | |

**Q: Should dashboard show a "log missing metrics" prompt?**

| Option | Description | Selected |
|--------|-------------|----------|
| No — tile state is enough | The "not logged today" tile indicator is sufficient. | ✓ |
| Summary banner at the top | e.g., "3 of 5 metrics logged today". Adds visual clutter. | |
| Badge on Log tab | Unread-count-style badge. Feels anxiety-inducing. | |

---

## IndexedDB Schema Model

**Q: How to store 5 metrics in Dexie?**

| Option | Description | Selected |
|--------|-------------|----------|
| Separate table per metric | weights, sleepEntries, stepEntries, waterEntries, heartRates. Typed, clean queries. | ✓ |
| Unified entries table | One table with type discriminator. Flexible but loses type safety. | |

**Q: How to store dates in Dexie?**

| Option | Description | Selected |
|--------|-------------|----------|
| ISO date string YYYY-MM-DD | Human-readable; Dexie indexes strings correctly for ranges. | ✓ |
| Unix timestamp | Fast comparisons but cryptic in DevTools. | |
| JavaScript Date object | Not indexable in IndexedDB. Ruled out. | |

**Q: One entry per day or multiple?**

**User's choice (freeform):** Mixed. Sleep, steps, water: one per day. Weight, heart rate: multiple per day allowed. Training sessions (Phase 4): also multiple per day.
**Notes:** "resting heart rate" and weight can be measured multiple times daily. Sleep/steps/water are daily totals.

**Q: Dashboard display for multi-per-day metrics (weight, HR)?**

| Option | Description | Selected |
|--------|-------------|----------|
| Daily average | Average of all readings for the day. | ✓ |
| Most recent entry | Last logged for that day. | |
| Let user configure | Per-metric setting. Too complex for Phase 1. | |

**Q: Charts (Phase 2) for multi-per-day metrics?**

| Option | Description | Selected |
|--------|-------------|----------|
| Daily average | Consistent with dashboard. Smooth trend line. | ✓ |
| First reading of the day | Morning weight/HR. Inconsistent with dashboard average. | |
| Most recent reading | Inconsistent with dashboard average. | |

**Q: Dexie schema versioning strategy?**

| Option | Description | Selected |
|--------|-------------|----------|
| Incremental versioning | Start v1 with Phase 1 tables; each new phase bumps version. Standard Dexie pattern. | ✓ |
| All tables upfront | Define all future tables in v1. Premature. | |

---

## Claude's Discretion

None — all areas had explicit user decisions.

## Deferred Ideas

None — discussion stayed within Phase 1 scope.
