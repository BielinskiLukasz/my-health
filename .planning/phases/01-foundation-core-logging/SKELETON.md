# Walking Skeleton — MyHealth

**Phase:** 1
**Generated:** 2026-09-03

## Capability Proven End-to-End

A user opens the app on their phone, logs a weight entry for today, and sees "73.2 kg" appear on the dashboard — all running locally in the browser from IndexedDB, with a service worker active for offline capability.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 19 + Vite 8 + TypeScript 6 | Pre-initialized in MyHealth/; fast HMR, static output compatible with GitHub Pages |
| Data layer | Dexie.js 4 — separate table per metric (`weights`, `sleepEntries`, `stepEntries`, `waterEntries`, `heartRates`) | One-way decision per D-15/D-16/D-17: typed schemas, rich queries, version migrations across phases; no server needed |
| Auth | None — privacy-first, single user | No accounts, no login screens, no auth tokens ever |
| Routing | HashRouter (react-router-dom v6) | GitHub Pages serves static files only; BrowserRouter causes 404 on page refresh; HashRouter makes all routes work from index.html |
| Deployment target | GitHub Pages (`gh-pages` branch via `gh-pages` npm + GitHub Actions) | Free static hosting; integrates with git workflow; `vite.config.ts` `base: '/my-health/'` aligns with repo URL |
| Directory layout | Feature-folders under `MyHealth/src/`: `db/`, `store/`, `components/{Dashboard,Log,Settings}/`, `utils/` | Groups by feature slice, not by file type; matches recommended structure from RESEARCH.md |
| State management | Zustand 4 with selector hooks | 1 KB; zero boilerplate; prevents Context re-render waterfall; lives in `src/store/appStore.ts` |
| Styling | Tailwind CSS 4 + shadcn/ui (radix-nova preset) — already initialized | Utility-first, dark mode support, pairs with Radix UI primitives; no runtime overhead |
| PWA | vite-plugin-pwa with Workbox — `registerType: 'autoUpdate'` | Generates service worker + manifest automatically from Vite build; offline-first from first load |

## Stack Touched in Phase 1

- [x] Project scaffold — Vite 8 + React 19 + TypeScript 6 + Tailwind + shadcn already initialized in `MyHealth/`
- [x] Routing — HashRouter with 3 routes: `/` (Dashboard), `/log/:metric?` (Log), `/settings` (Settings)
- [x] Database — Dexie.js `MyHealthDB` class; `weights` table write (WeightForm) and read (MetricTile) as the tracer; all 5 tables defined in schema v1
- [x] UI — WeightForm → DB write; MetricTile → DB read → display "73.2 kg"; 3-tab bottom nav
- [x] Deployment — `npm run build` produces deployable `dist/`; GitHub Actions workflow deploys to GitHub Pages on main branch push

## Out of Scope (Deferred to Later Slices)

- Charts, trend lines, period selectors (Phase 2)
- Target setting, streaks, personal bests (Phase 3)
- Training sessions, exercise library, journal notes (Phase 4)
- Samsung Health import, JSON/CSV export, push notifications (Phase 5)
- BMI calculation (Phase 2 — height stored in Phase 1 Settings but not yet computed)
- Multi-device sync (permanently out of scope — privacy by design)
- React Hook Form / Zod validation (Phase 2+ refinement — native HTML validation sufficient for Phase 1)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering the architectural decisions above:

- Phase 2: Charts & Visualization — weekly/monthly/yearly Recharts line/bar per metric + BMI overlay on weight chart
- Phase 3: Targets & Goals — deadlined targets with progress bars, streaks, personal bests
- Phase 4: Training Sessions — custom exercise library, multi-exercise session logging, journal notes
- Phase 5: History & Data — history list with filters, JSON/CSV export, Samsung Health ZIP import, push notification reminders
