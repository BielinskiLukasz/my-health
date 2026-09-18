# Phase 3: Targets & Goals - Context

**Gathered:** 2026-09-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver deadlined targets per metric (weight, sleep, steps, water, heart rate) plus a lightweight exercise-frequency proxy, with projected pace toward each target, red/yellow/green on-track color coding on both Dashboard and chart views, per-metric consecutive-day/week streaks, and automatic personal-best detection across all six existing metrics. This is the first phase where a metric's Dashboard tile and chart screen carry a *goal*, not just a *value* — everything here builds directly on Phase 2's chart/sparkline/tile infrastructure.

</domain>

<decisions>
## Implementation Decisions

### Target Scope & Direction

- **D-01:** TARG-01's "exercise frequency" target is implemented now as a **lightweight proxy**, not deferred to Phase 4. A new minimal Dexie table (one row per day, boolean "did I exercise") backs a weekly session-count target. This is explicitly a placeholder — full Training Sessions data (Phase 4) will eventually replace/enrich it. — **Reversibility:** costly — the proxy table's data model should carry forward or migrate cleanly into Phase 4's real session schema; a mismatched shape means a migration script later.
- **D-02:** Weight target direction is **inferred, not fixed to loss-only**: user picks a target value and date; whether that means "lose" or "gain" is derived by comparing target to current weight.
- **D-03:** Heart rate target is a **ceiling** ("get resting HR under X bpm") — lower is better, matches common fitness-goal framing. Not a min-max range.
- **D-04:** Sleep target is a **range** ("around X hours") — both under- and oversleeping count against on-track status, unlike steps/water which are simple floors.
- **D-05:** Metrics with **no target set** show Dashboard tiles **unchanged from Phase 2** (value + sparkline only) — setting a target is fully opt-in, no new empty-state UI.
- **D-06:** Targets are **set and edited per-metric from the `/chart/:metric` screen** (Phase 2 D-01/D-02), not from a centralized Settings list.
- **D-07:** The exercise-frequency proxy gets its **own 7th Dashboard tile** (consistent with how the other 6 target-bearing metrics are shown), with a toggle/checkbox to mark today and this-week's count vs. weekly target.
- **D-08:** Changing a target's value or date **does not reset the streak** — the streak persists across edits, tracking consistency of logging/hitting-target rather than being tied to one exact target snapshot.

### Pace & On-Track Calculation

- **D-09:** Projected pace uses a **linear trend over a recent window** (see D-11 for window size), extrapolated to the target date, compared against the target value. Matches the existing trend-arrow logic style from Phase 2 D-04.
- **D-10:** Red/yellow/green (TARG-04) is driven by **thresholds on the projected-vs-target gap**: green = projection lands within tolerance of target; yellow = off-track but recoverable; red = far off or trending the wrong direction.
- **D-11:** A target needs **7 days** of logged entries (one full week, matching the existing W chart period) before pace/color leaves a **neutral/grey "Not enough data yet"** state. No red/yellow/green guess is shown before that.
- **D-12:** For **range targets (sleep)** and **ceiling targets (heart rate)**, the gap for red/yellow/green purposes is **distance from the nearest edge** of the range/ceiling (0 or negative = green), reusing the same threshold logic as point targets (weight, steps, water) rather than a separate formula.
- **D-13:** On the `/chart/:metric` screen, on-track status is shown as a **reference line at the target value** (reusing BmiSection's `ReferenceLine` pattern from Phase 2 D-09) **plus a red/yellow/green status badge** near the chart header (alongside the existing D-04 Avg/min-max/trend stat).

### Streak Definition

- **D-14:** A day counts toward the streak only if the user **logged an entry AND it met the target that day** — not just "logged at all". Matches the roadmap's literal wording ("streak... target was met").
- **D-15:** **Weight's** daily "met target" signal (since weight is a trend goal, not a daily floor/ceiling) is **"moved toward the goal direction vs. the previous logged value"** (or held steady within a small tolerance) — a distinct, simpler daily check than the 7-day pace/color logic in D-09–D-13.
- **D-16:** Any day with **no qualifying entry breaks the streak immediately** to 0 — no grace-day allowance.
- **D-17:** The exercise proxy's streak counts **consecutive weeks** that hit the weekly session target, not consecutive days — matches its natural weekly cadence (D-01).
- **D-18:** Streaks are **per-metric only** — each metric-with-a-target shows its own independent streak. No combined "all-targets" streak.
- **D-19:** On the **first day** after setting a new target, the streak shows **1 immediately** if that day's entry already qualifies — it doesn't wait for a full day to "complete" first.

### Personal Bests Scope

- **D-20:** PB-01/02's requirement to flag PBs in "history and exercise detail views" can't be fulfilled literally — neither view exists yet (history is Phase 5, exercise detail is Phase 4). Phase 3 surfaces PBs instead on the **`/chart/:metric` screen and the Dashboard tile** (a "🏆 Personal best!" badge) — the same underlying PB data will naturally extend into history/exercise-detail views once those phases build them.
- **D-21:** **All 6 existing metrics** get PB detection, direction chosen per metric's meaning: weight (both lowest AND highest ever, both are "records"), sleep (longest duration), steps (most in a day), water (most in a day), heart rate (lowest resting HR). **Temperature is excluded** — a "personal best fever" doesn't make sense. PB detection is independent of whether a target is set for that metric.
- **D-22:** PB detection scans **full historical data retroactively** (on first use of the feature, and after any Samsung Health import) to establish the current best per metric, then continues detecting new PBs going forward. A user with months of pre-existing data must not have a real PB hidden just because it predates this feature.

### Claude's Discretion

- Exact Dexie schema/version bump for the new targets table and the exercise-proxy table (additive migration per D-19 from Phase 1's context, i.e. version bump, never altering existing tables).
- Precise numeric tolerance bands for "green" in D-10/D-12 (e.g. how close to target counts as on-track) — planner/researcher to propose sensible defaults per metric unit.
- Exact linear-regression method for D-09's trend fit (simple least-squares over the 7-day window is expected to be sufficient; no need for anything more sophisticated).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, and requirements list (TARG-01–05, DASH-03, PB-01, PB-02)
- `.planning/REQUIREMENTS.md` — Full requirement definitions with IDs; Phase 3 traceability rows
- `.planning/PROJECT.md` — Core constraints (GitHub Pages, IndexedDB, React+Vite, Metric only)

### Prior Phase Context (Decisions This Phase Builds On)
- `.planning/phases/02-charts-visualization/02-CONTEXT.md` — D-01/D-02 (`/chart/:metric` screen + FAB, reused as the target-setting location per D-06 above), D-04 (chart header stat, extended with the D-13 status badge), D-08 (per-metric accent colors, reused for target UI), D-09 (BmiSection's `ReferenceLine` pattern, reused per D-13), D-14/D-15/D-16 (Dashboard sparklines — D-16 explicitly deferred DASH-02 progress bars to this phase)
- `.planning/phases/01-foundation-core-logging/01-CONTEXT.md` — D-11 (existing "not logged today" tile variant — the 7th exercise tile should follow the same tile-state pattern), D-15/D-19 (per-metric Dexie tables, incremental schema versioning — the new targets/exercise-proxy tables must follow this pattern)

### Technology Stack
- Dexie.js 4 — IndexedDB wrapper; current schema at version 2 (`src/db/schema.ts`) — Phase 3 needs version 3 for a `targets` table and an `exerciseLog` table
- Recharts 3 — `ReferenceLine` already used in `BmiSection.tsx`, reusable for D-13's target reference line
- date-fns 3 — for streak/pace date-range calculations

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/db/schema.ts` — Dexie schema, version 2. Tables: `weights`, `sleepEntries`, `stepEntries`, `waterEntries`, `heartRates` (v1), `temperatures` (v2). Needs a version 3 additive migration for `targets` and `exerciseLog`.
- `src/utils/constants.ts` — `METRIC_CONFIG` object with label/unit/accentColor/accentBorder per metric (weight, sleep, steps, water, heartRate, temperature). The exercise proxy is a 7th tile but is NOT one of the existing 6 `MetricType` values — needs its own handling, not forced into `METRIC_CONFIG`.
- `src/components/Dashboard/MetricTile.tsx` — Variant A (logged today) / B (not logged today) / C (no data ever) tile states already exist (Phase 1 D-10/D-11, reinforced in the Phase 2 G-02-6 quick fix on 2026-09-18). New target/streak/PB UI additions should extend these variants, not replace them.
- `src/components/Charts/MetricChart.tsx` — `/chart/:metric` screen; already renders `ChartHeader`, `PeriodSelector`, the main chart, and conditionally `BmiSection` for weight. Target reference line + status badge (D-13) and PB badge (D-20) get added here.
- `src/components/Charts/BmiSection.tsx` — Existing `ReferenceLine` usage pattern (WHO threshold lines at 18.5/25/30) — direct precedent for D-13's target reference line.
- `src/hooks/useChartData.ts`, `src/hooks/useBmiData.ts` — Existing `useEffect`+async+cancelled Dexie-query hook pattern to follow for new target/streak/PB data hooks.
- `src/utils/chartColors.ts` (`CHART_HEX`) — Per-metric accent colors; the new exercise tile needs its own accent choice (not yet assigned).

### Established Patterns
- Per-metric Dexie tables, never a unified table (Phase 1 D-15).
- Dexie schema versioned incrementally, additive only (Phase 1 D-19).
- Dates as ISO `YYYY-MM-DD` strings (Phase 1 D-17).
- `useEffect`+async+cancelled pattern for all Dexie-backed hooks.
- Dark-mode via Tailwind `dark:` prefixes throughout.

### Integration Points
- `src/db/schema.ts` — add `targets` table (per-metric target value/date/direction) and `exerciseLog` table (date, boolean) at Dexie version 3.
- `src/components/Dashboard/Dashboard.tsx` — add the 7th exercise tile to the tile grid.
- `src/components/Dashboard/MetricTile.tsx` — extend variants with progress bar, color coding, streak, PB badge (all conditional on a target existing per D-05).
- `src/components/Charts/MetricChart.tsx` — add target reference line, status badge, PB badge.

</code_context>

<specifics>
## Specific Ideas

- Exercise proxy tile shows this week's session count vs. weekly target (e.g. "3/4 this week") with a same-day toggle/checkbox, not a numeric input.
- PB badge text: "🏆 Personal best!" — shown on both the chart screen and the Dashboard tile for the metric/day it happens.
- Neutral/grey "Not enough data yet" state is a real fourth status alongside red/yellow/green — not a hidden default.

</specifics>

<deferred>
## Deferred Ideas

- Full Training Sessions tracking (real exercise types, reps/sets/duration/intensity, squash match details) — Phase 4, per roadmap. The Phase 3 exercise proxy (D-01) is explicitly a stopgap for this.
- History list view with PB flagging — Phase 5, per roadmap (HIST-01/02). PB data model from D-20/D-22 should carry forward unchanged.
- Exercise detail view PB flagging — Phase 4, once training sessions exist to attach PBs to.
- Combined "all-targets" streak — considered and explicitly declined (D-18); revisit only if a future phase surfaces real demand.

</deferred>

---

*Phase: 3-Targets & Goals*
*Context gathered: 2026-09-18*
