# UI Competitive Analysis — Samsung Health vs MyHealth

**Researched:** 2026-09-03
**Purpose:** Inform UI-SPEC.md design decisions for Phase 1 and beyond

---

## Samsung Health Visual Design (2025-2026 State)

**Color palette:**
- Background: Dark blue-gray gradient (~`#0D1B2A` to `#1A2B3C`) in dark mode — NOT true black. Explicitly hated by users.
- Widget cards: Heavy pastel colors (yellows, teals, pinks, oranges) assigned arbitrarily — no semantic link to metric meaning.
- Accent: Blue-dominant primary (`#0080FF` range); teal secondary.
- Described by reviewers as "garish ombre background and tooth-achingly bright widget cards."

**Typography:**
- Samsung proprietary font (SamsungOne/SamsungSharp) — not available to third parties.
- Large numeric values for key metrics, smaller unit labels — correct pattern.
- Labels and chart axes use small, low-contrast text — legibility issue.

**Card/surface style:**
- Bento-box grid of varying-size cards (full-width + half-width mix).
- Rounded corners (~16-24px), heavy colored card backgrounds.
- Cards described as "half-finished and cluttered" — colors compete, no visual coherence.

**Icons:**
- Filled icons per metric (heart, footsteps, moon, water drop, flame).
- Each metric icon uses its card's pastel color — looks toy-like rather than premium.

---

## Navigation Model & Information Architecture

**Structure (post-2026 redesign):**
- **Dual navigation**: Bottom bar (5 tabs) + pill-shaped top shortcut tabs for the same 5 pillars.
- **Redundant and confusing** — users have two nav bars doing similar things.
- Top tabs: Activity | Sleep | Vitals | Mindfulness | Nutrition.

**Information architecture:**
- 5 health pillars: Activity, Sleep, Nutrition, Mindfulness, Vitals.
- Dashboard is the entry point — modular/customizable widget grid.
- Each pillar has its own deep sub-section with charts, logs, history.

**Pain point:** Hard to find where to enter data. Manual logging requires too many taps.

---

## Dashboard Layout & Metric Tiles

- Customizable bento grid (drag/resize like a weather app).
- Tiles vary in size — good hierarchy concept, poor execution.
- Scrollable AI "insights" banner occupies massive screen real estate, can't be dismissed.
- Tiles show unnecessary decorative detail and competing colors rather than clean data.
- "Not logged today" state not handled elegantly — tiles show stale data without clear indication.

---

## Data Entry / Logging UX

- Manual logging buried: pillar → sub-metric → form (too many taps).
- No unified "log multiple metrics in one session" flow.
- Weight allows multiple entries per day, shown as daily average — matches MyHealth D-16/D-18.
- Sleep uses time pickers for bedtime/wake — matches MyHealth D-06.
- **Gap MyHealth addresses with D-07:** stay on Log screen after save, show success toast, return to picker.

---

## Data Visualization

- Weekly/monthly bar and line charts per metric.
- Pinch-to-zoom on X-axis — but only on some charts, not all. Inconsistency criticized.
- Charts rendered on colored card backgrounds — makes chart lines harder to read.
- No cross-metric comparison on same chart.
- Trend indicators exist but buried.

---

## What Samsung Does Well (Match or Exceed)

| Feature | What Samsung Does Right |
|---|---|
| Modular dashboard | Resizable/draggable tiles gives user control |
| Quick-add button | Fast access without navigating deep |
| Pinch-zoom charts | Correct interaction model for time-series exploration |
| Five pillars IA | Organizing metrics into meaningful groups |
| Daily aggregate display | Weight/HR shows daily average — clean single-value |

---

## What Samsung Does Badly (Opportunities to Beat)

| Problem | MyHealth Opportunity |
|---|---|
| **Arbitrary garish colors** — pastels carry no semantic meaning | 1 accent color per metric, consistently. Color = meaning. |
| **No true dark mode** — dark blue-gray gradient, explicitly hated | True black `#000000` dark mode as default on AMOLED |
| **Redundant dual navigation** — top + bottom bar doing same job | Single 3-tab bottom bar. Simpler is faster. |
| **AI insights you can't dismiss** — 40% of home screen | No promotional content. The data IS the content. |
| **Logging too many taps** — buried in pillar → sub-metric → form | Max 2 taps from anywhere to log anything |
| **Charts only selectively interactive** | All charts: pinch-zoom + tap-for-value tooltip. Always. |
| **"Not logged today" not surfaced clearly** | D-11 tile design (dimmed value + date + "Not logged" tag) |
| **Colors don't correlate to data** | Consistent hue per metric — learned immediately |
| **Cluttered bento grid** — mismatched sizes feel unfinished | 2-column equal-size card grid. Simplicity > customizability at Phase 1. |
| **Forced AI/content sections** | 100% user data only. No suggestions, no content feeds. |
| **Slow and crashes** | Local IndexedDB, no sync, instant responses. |

---

## Competitor Comparison

**Apple Health:** Clean minimal white cards, strong color-coding per metric, summary view shows trends not just today's value. Heavy ecosystem lock-in; no export-first philosophy.

**Google Health (Fitbit rebranded):** Material You design, 3-tab bottom nav (Today / Coach / You), single scrollable today page. Heavily AI/coaching-focused.

**Gap MyHealth can own:** Neither competitor offers export-first, no-account, privacy-native design. That's a genuine differentiator.

---

## Concrete Design Targets for UI-SPEC.md

### Color System

**Canvas (dark mode default):**
- Background: `#000000` (true black)
- Card surface: `#111111`
- Elevated surface: `#1A1A1A`

**Metric accent palette (icon + chart line + card accent strip):**
- Weight: `#3B82F6` (blue-500)
- Sleep: `#8B5CF6` (violet-500)
- Steps: `#10B981` (emerald-500)
- Water: `#06B6D4` (cyan-500)
- Heart Rate: `#EF4444` (red-500)

**Text:**
- Primary: `#FFFFFF`
- Secondary/muted: `#9CA3AF`
- Disabled: `#4B5563`

**Feedback:**
- Success toast: `#10B981`

### Typography

- System font stack: Inter → SF Pro → Segoe UI (no proprietary font dependency)
- Metric value: 32-40px semibold
- Unit label: 14px regular, muted
- Card label/metric name: 12px uppercase tracking, muted
- Chart axis: 11px, muted

### Card Design

- `bg-zinc-900` surface, `rounded-2xl` (16px radius), `p-4`
- Left 3px accent bar in metric color — subtle, not garish
- Flat surfaces only — no gradient backgrounds
- "Not logged today" variant: value at opacity-50 + date label + colored dot + "Not logged" text

### Navigation

- Bottom tab bar: 3 items only (Home / Log / Settings)
- No top tabs, no floating action button competing with bar
- Tab icons: filled + metric color when active, outline + muted when inactive

### Dashboard

- 2-column equal-size card grid
- 5 tiles: 2+2+1 layout (last tile full-width)
- Date header: large semibold, weekday + date. No AI score above it.
- No scrollable banners, no insight cards

### Charts

- Chart background: `bg-zinc-950`
- Single-color line/bar using metric's accent color
- Grid lines: `#27272A` (zinc-800), subtle
- All charts: pinch-to-zoom + tap-for-tooltip. Always. Consistent.
- Default view: last 7 days. Toggle: 30d / 90d / 1y

### Logging Flow

- Max 2 taps to log from anywhere
- Dashboard tile tap → log form pre-filled with today + existing value
- Save → 2s auto-dismiss bottom toast ("Weight saved ✓") → no modal, no blocking confirmation
- Log tab: metric picker list, large tap targets, metric-color icon left

---

## The Design Differentiator

> Samsung Health feels like Samsung's app. MyHealth should feel like *your notebook* — yours to write in, yours to read, yours to take with you. Clean, honest, fast.

Samsung's 2026 redesign is criticized for being visually chaotic, navigationally redundant, functionally bloated, and unreliable. MyHealth beats it by being:

1. **Visually coherent** — semantic color system, true black dark mode, no decorative noise
2. **Navigationally simple** — 3-tab bar, max 2 taps to log, no redundant chrome
3. **Data-first** — the value is your data, shown clearly. No AI interruptions.
4. **Reliably fast** — local IndexedDB, no sync, instant responses
5. **Privacy-first by design** — no account, no server, export anytime
