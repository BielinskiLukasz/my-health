# Phase 2: Charts & Visualization - Context

**Gathered:** 2026-09-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver chart views (weekly/monthly/yearly) per metric, a GitHub-style activity heatmap on the Dashboard, and auto-calculated BMI shown below the weight chart. For the first time, users can see their health trends over time. Metric tiles on the Dashboard gain 14-day mini sparklines. The heatmap shows general logging activity (any metric logged = colored cell) — training and target data enrich it in later phases.

</domain>

<decisions>
## Implementation Decisions

### Chart Navigation

- **D-01:** Tapping a metric tile on the Dashboard navigates to a **dedicated metric chart screen** (`/chart/:metric` route) instead of the Log form. This replaces Phase 1 D-04 for tile taps — the Log form remains accessible via the Log tab and via the FAB on the chart screen. — **Reversibility:** costly — changing how tiles navigate after Phase 2 components are built touches MetricTile, routing, and chart screen integration.
- **D-02:** A **floating action button (FAB)** on the chart screen opens the Log form for that metric. Keeps logging accessible while viewing charts.
- **D-03:** Period switcher is a **segmented control / tab row (W | M | Y)** above the chart. Minimal code (reuses button.tsx), standard health app pattern.
- **D-04:** Chart screen header shows: **metric name + back button** on the left, and a **summary stat** on the right: `Avg X.X (min–max) ↑` — the average, min/max range, and a trend arrow (↑ up / ↓ down / → flat compared to previous period). Stat updates when user switches W|M|Y.

### Chart Types

- **D-05:** Chart type is **auto-chosen by metric**: continuous values (weight, sleep, heart rate, temperature) → **line chart**; discrete daily counts (steps, water) → **bar chart**. Most semantically appropriate.
- **D-06:** **Yearly view** shows **12 monthly aggregate bars** (one per month = monthly average for continuous metrics, monthly total for step counts). Daily granularity is too noisy at yearly scale.
- **D-07:** **Custom styled tooltips** that match dark mode and the app's color scheme (not Recharts default). Tooltip shows value + unit + date when tapping/hovering a data point.
- **D-08:** Each metric uses its **own accent color** for charts — same color as the Dashboard tile's accent color. Weight = blue, sleep = purple, steps = green, water = cyan, heart rate = red, temperature = orange. Reinforces per-metric visual identity from tile to chart. — **Reversibility:** reversible — just a CSS token/constant; can be changed anytime.
- **D-09:** **BMI** appears as a **separate mini-section below the weight chart** on the weight chart screen. Not overlaid as a second line (avoids dual-Y-axis complexity). Mini-section shows: current BMI value, BMI category label (Underweight/Normal/Overweight/Obese), and a BMI trend mini-chart. Requires height to be set in Settings (already implemented in Phase 1 UX-04).

### Activity Heatmap

- **D-10:** Heatmap shows **logging activity**: any day where at least one metric was logged gets a colored cell. Intensity encodes how many metrics were logged: 0=grey, 1–2=light shade, 3–4=medium, 5–6=full saturation (6 metrics total). — **Reversibility:** costly — changing the heatmap data model later (e.g., to show training days separately) requires a data layer change and a visual redesign.
- **D-11:** Time range: **rolling 12 months** (last 365 days), current day at right edge. Updates automatically.
- **D-12:** Heatmap location: **Dashboard, below the 2-column metric tile grid** (scroll to reach). No new route or tab.
- **D-13:** Tapping a heatmap cell shows a **tooltip** with the date and which metrics were logged that day.

### Dashboard Tile Sparklines

- **D-14:** Dashboard tiles gain a **14-day mini sparkline** (line chart, compact) showing the metric trend. Uses the metric's accent color (same as D-08). DASH-02 progress bars + color coding are deferred to Phase 3 (requires targets).
- **D-15:** When a tile has **no log entries in the last 14 days**, the sparkline area shows: **"Start logging to see trends"** as a small helper message. No broken/empty chart widget.

### Sequencing Note

- **D-16:** DASH-02 (target progress bar + red/yellow/green color coding on tiles) is **deferred to Phase 3**. Targets don't exist yet. Phase 2 adds sparklines instead — a different kind of value (trend vs. goal progress) that requires no Phase 3 data.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, and requirements list (CHRT-01–04, DASH-02, BMI-01, BMI-02)
- `.planning/REQUIREMENTS.md` — Full requirement definitions with IDs; Phase 2 traceability rows
- `.planning/PROJECT.md` — Core constraints (GitHub Pages, IndexedDB, React+Vite, Metric only), tech stack choices

### Phase 1 Context (Prior Decisions)
- `.planning/phases/01-foundation-core-logging/01-CONTEXT.md` — All Phase 1 decisions; especially D-04 (tile navigation, now overridden by D-01 above), D-12 (2-column grid), D-15 (per-metric Dexie tables), D-18 (daily average for multi-per-day metrics), D-19 (Dexie schema versioning)

### Technology Stack
- React 18 + Vite 5 + TypeScript — build toolchain
- Recharts 2.10+ — charting library (to be installed in Phase 2)
- Dexie.js 4 — IndexedDB wrapper (existing, tables: weights, sleepEntries, stepEntries, waterEntries, heartRates, temperatures)
- Zustand 4 — global state (existing)
- Tailwind CSS 3 + shadcn/ui — styling (existing)
- date-fns 3 — date manipulation (existing)
- HashRouter — routing (existing; Phase 2 adds `/chart/:metric` route)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/Dashboard/MetricTile.tsx` — Existing tile component; needs new `/chart/:metric` navigation (currently navigates to Log form), plus 14-day sparkline addition
- `src/components/Dashboard/Dashboard.tsx` — Main dashboard grid; heatmap section will be appended below the metric tile grid
- `src/db/schema.ts` — All 6 metric tables defined (`weights`, `sleepEntries`, `stepEntries`, `waterEntries`, `heartRates`, `temperatures`). Dexie schema currently at version 2. Phase 2 may add a Dexie version bump if new indexes are needed for chart queries.
- `src/store/appStore.ts` — Zustand store with `MetricType`, `currentDate`, `selectedMetric`. Chart screen state (selected period W|M|Y) will likely live in local component state or a chart-specific store slice.
- `src/components/ui/button.tsx` — Existing button component; use for segmented W|M|Y control.
- `src/App.tsx` — Current routes: `/`, `/log`, `/log/:metric`, `/settings`. Needs new `/chart/:metric` route.

### Established Patterns
- **Per-metric Dexie tables (D-15):** Each metric has its own table with typed schema. Chart queries will follow the same `db.weights.where("date").between(start, end).toArray()` pattern.
- **Daily average for multi-per-day (D-18):** Weight, heart rate, temperature entries must be averaged per day before charting.
- **ISO date string (D-17):** Dates stored as YYYY-MM-DD strings. Chart X-axis will use these; date-fns used for range generation and label formatting.
- **Dark mode via Tailwind:** `dark:` prefix classes throughout. Custom chart tooltips must respect dark mode.
- **Zustand for global state, local state for screen-specific state:** Don't over-centralize chart period selection.

### Integration Points
- `src/App.tsx` — Add `<Route path="/chart/:metric" element={<MetricChart />} />` alongside existing routes
- `MetricTile.tsx` — Change `onClick` to navigate to `/chart/:metric` instead of `/log/:metric`
- `Dashboard.tsx` — Add `<ActivityHeatmap />` section below the tile grid
- `Settings.tsx` — Height already stored (UX-04 complete); BMI calculation reads from `settings.height` in localStorage or Dexie

</code_context>

<specifics>
## Specific Ideas

- **Summary stat format:** `Avg 73.4 (71.0 – 74.8) ↑` — average, parenthesized min-max range, trend arrow. The trend compares current period average to previous period of same length (e.g., this week vs last week).
- **Heatmap intensity:** 0 metrics logged = grey cell. 1–2 = light accent. 3–4 = medium accent. 5–6 = full accent saturation. GitHub-style grid layout (weeks as columns, days as rows).
- **BMI categories:** Underweight < 18.5, Normal 18.5–24.9, Overweight 25–29.9, Obese ≥ 30.

</specifics>

<deferred>
## Deferred Ideas

- **DASH-02 progress bars + color coding:** Target progress bars and red/yellow/green color coding on Dashboard tiles require targets (Phase 3). Deferred to Phase 3 deliberately.
- **Training day overlay on heatmap:** Phase 4 adds training sessions; heatmap can add a second color channel for training days at that point.
- **Target-hit day heatmap overlay:** Phase 3 adds targets; heatmap can show target-hit days alongside logging activity then.
- **Multi-metric overlay charts:** Showing two metrics on the same chart (e.g., weight + steps) is a v2 item per REQUIREMENTS.md.

</deferred>

---

*Phase: 2-Charts & Visualization*
*Context gathered: 2026-09-14*
