# Phase 2: Charts & Visualization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-14
**Phase:** 2-Charts & Visualization
**Areas discussed:** Chart access / navigation, Chart type per metric, Heatmap scope in Phase 2, Dashboard tile update (DASH-02)

---

## Chart access / navigation

**Question 1: Where does the user navigate to see charts?**

| Option | Description | Selected |
|--------|-------------|----------|
| Tap metric tile → chart screen | New /chart/:metric route; FAB for logging | ✓ |
| New 4th Charts tab | Separate tab; tiles keep going to Log | |
| Charts scroll below dashboard tiles | No new routes, dashboard extends down | |

**User's choice:** Tap metric tile → chart screen

---

**Question 2: How does the user access the Log form from the chart screen?**

| Option | Description | Selected |
|--------|-------------|----------|
| Floating action button (FAB) | FAB on chart screen opens Log form | ✓ |
| Log tab still works | No log button on chart screen | |
| Button in chart screen header | Header-area log button | |

**User's choice:** FAB on chart screen

---

**Question 3: Period switcher UX**

| Option | Description | Selected |
|--------|-------------|----------|
| Segmented control / tab row (W \| M \| Y) | Pill-style selector above chart | ✓ |
| Swipe left/right | Gesture-based period navigation | |
| Dropdown select | Select control above chart | |

**User's choice:** Segmented control / tab row

---

**Question 4: Chart screen header content**

| Option | Description | Selected |
|--------|-------------|----------|
| Metric name + back button only | Minimal header | |
| Metric name + summary stat | Header includes key stat | ✓ |
| You decide | Claude picks layout | |

**User's choice:** Metric name + summary stat

---

**Question 5: What does the summary stat show?**

| Option | Description | Selected |
|--------|-------------|----------|
| Average value for the period | e.g., "Avg 73.4 kg" | |
| Latest entry + trend direction | e.g., "73.2 kg ↑ from last week" | |
| Min / Max for the period | e.g., "71.0 – 74.8 kg" | |

**User's choice (free text):** "Average, min, max and trend arrow like: Avg 73.4 (71.0 - 74.8) ↑"
**Notes:** Summary stat format: `Avg X.X (min–max) ↑` combining all three options.

---

## Chart type per metric

**Question 1: Chart type assignment**

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-choose by metric type | Line for continuous, bar for discrete | ✓ |
| Line charts for everything | Uniform line charts | |
| Bar charts for everything | Uniform bar charts | |

**User's choice:** Auto-choose by metric type

---

**Question 2: Yearly chart representation**

| Option | Description | Selected |
|--------|-------------|----------|
| Monthly aggregates as bars | 12 bars, one per month | ✓ |
| Daily data points | ~365 data points | |
| Weekly aggregates as bars | ~52 bars | |

**User's choice:** Monthly aggregates as bars

---

**Question 3: Tooltip behavior**

| Option | Description | Selected |
|--------|-------------|----------|
| Recharts default tooltip | Out of the box | |
| Custom styled tooltip | Matches dark mode and color scheme | ✓ |
| No tooltips | Display only | |

**User's choice:** Custom styled tooltip

---

**Question 4: Color scheme**

| Option | Description | Selected |
|--------|-------------|----------|
| Each metric gets its own accent color | Matches dashboard tile colors | ✓ |
| Single brand color for all charts | Consistent but loses metric identity | |
| You decide | Claude picks | |

**User's choice:** Each metric gets its own accent color

---

**Question 5: BMI placement**

| Option | Description | Selected |
|--------|-------------|----------|
| BMI as a second line on weight chart | Dual line overlay | |
| BMI as own tile/section on weight chart screen | Separate section below chart | ✓ |
| BMI only visible in Settings | Settings-page detail | |

**User's choice:** BMI gets its own tile/section on weight chart screen

---

## Heatmap scope in Phase 2

**Question 1: What does the heatmap show in Phase 2?**

| Option | Description | Selected |
|--------|-------------|----------|
| Any day with any log entry = colored cell | Logging activity | ✓ |
| Defer heatmap to Phase 3 | Skip now | |
| Placeholder heatmap only | Grid UI with placeholder | |

**User's choice:** Any day with any log entry = colored cell

---

**Question 2: Time range**

| Option | Description | Selected |
|--------|-------------|----------|
| Rolling 12 months (last 365 days) | GitHub-style rolling window | ✓ |
| Current calendar year | Jan 1 – today | |
| All historical data | Every day since first entry | |

**User's choice:** Rolling 12 months

---

**Question 3: Heatmap location**

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard, below metric tiles | Scroll to see | ✓ |
| Dedicated section within a chart screen | Within a metric view | |
| Separate tab or route | Full-screen treatment | |

**User's choice:** On the Dashboard, below the metric tiles

---

**Question 4: Intensity encoding**

| Option | Description | Selected |
|--------|-------------|----------|
| Single color, intensity = metrics logged count | 0=grey, 1-2=light, 3-4=medium, 5-6=full | ✓ |
| Binary: logged = full color, not logged = grey | No gradient | |
| Per-metric color breakdown | 6 segments per cell | |

**User's choice:** Single color, intensity = number of metrics logged

---

**Question 5: Cell tap behavior**

| Option | Description | Selected |
|--------|-------------|----------|
| Tooltip with date and metrics logged | Informative, stays on dashboard | ✓ |
| Navigate to log screen for that date | Quick edit/review | |
| No interaction | Display only | |

**User's choice:** Show a tooltip with the date and metrics logged that day

---

## Dashboard tile update (DASH-02)

**Question 1: Tile evolution in Phase 2**

| Option | Description | Selected |
|--------|-------------|----------|
| Defer DASH-02 entirely to Phase 3 | Keep Phase 1 tiles | |
| Add mini sparkline to each tile | 14-day trend instead of progress bar | ✓ |
| Add empty progress bar shell | 0% grey bar now | |

**User's choice:** Add a mini sparkline to each tile

---

**Question 2: Sparkline time range**

| Option | Description | Selected |
|--------|-------------|----------|
| Last 7 days | One week | |
| Last 30 days | Monthly | |
| Last 14 days | Two weeks | ✓ |

**User's choice:** Last 14 days

---

**Question 3: Tile with no data in sparkline period**

| Option | Description | Selected |
|--------|-------------|----------|
| Show tile without sparkline | Phase 1 appearance | |
| Show empty sparkline placeholder | Flat grey line | |
| Show "Start logging to see trends" | Call-to-action message | ✓ |

**User's choice:** Show a "Start logging to see trends" message

---

**Question 4: Sparkline color**

| Option | Description | Selected |
|--------|-------------|----------|
| Metric accent color (same as chart screen) | Per-metric identity | ✓ |
| Neutral / muted color | Subtle secondary element | |
| You decide | Claude picks | |

**User's choice:** Metric accent color (same as the chart screen)

---

## Claude's Discretion

None — all areas had explicit user input.

## Deferred Ideas

- **DASH-02 progress bars + color coding:** Deferred to Phase 3 (requires targets)
- **Training day overlay on heatmap:** Phase 4 adds training sessions; heatmap can be enriched then
- **Target-hit day heatmap overlay:** Phase 3 adds targets; heatmap enrichment at that point
- **Multi-metric overlay charts:** v2 item per REQUIREMENTS.md
