# Project Research Summary

**Project:** MyHealth (Personal Health Tracking PWA)
**Domain:** Offline-first, browser-only progressive web app for health & fitness tracking
**Researched:** 2026-09-02
**Confidence:** HIGH

## Executive Summary

MyHealth is a **privacy-first personal health tracking PWA** designed for offline-capable logging of weight, sleep, steps, water, heart rate, and custom training sessions. The recommended approach is a **browser-only architecture** (React + Vite + IndexedDB) with GitHub Pages static hosting. This eliminates account friction, guarantees data ownership, and enables offline-first operation — positioning MyHealth as the antidote to cloud-dependent trackers.

The technology stack is mature and well-documented: React 18 with hooks, Dexie.js for rich IndexedDB queries, Zustand for lightweight state management, Recharts for visualization, Tailwind CSS + shadcn/ui for styling, and vite-plugin-pwa for offline support. The architecture follows a three-layer pattern (UI → Services → IndexedDB), with clear separation of concerns and a robust repository pattern for data access.

**Critical success factors:**
1. **Persistent storage must be requested on first load** — without `navigator.storage.persist()`, users will experience catastrophic data loss to browser eviction.
2. **Service worker cache invalidation must be versioned and tested** — users will see stale code after deploys without it.
3. **Samsung Health import must be bulletproof** — CSV parsing, timestamp handling, and duplicate detection are core differentiators.
4. **GitHub Pages routing must use HashRouter** — to avoid 404s when users refresh on non-root routes.

All four must be correct in Phase 1 MVP.

---

## Key Findings

### Recommended Stack

**Core Technologies:**

| Library | Version | Role |
|---------|---------|------|
| React | 18.2+ | UI component library |
| Vite | 5.0+ | Build tool; GitHub Pages support; auto-hashed assets |
| Dexie.js | 4.0+ | IndexedDB wrapper; rich query API; schema versioning |
| Zustand | 4.4+ | 1KB state management; zero boilerplate |
| Recharts | 2.10+ | Component-based charting; health dashboards |
| Tailwind CSS | 3.4+ | Utility-first styling |
| shadcn/ui | latest | Copy-paste components; dark mode built-in |
| date-fns | 3.0+ | Functional date API; comprehensive timezone handling |
| JSZip | 3.10+ | Samsung Health ZIP extraction |
| react-papaparse | 4.4+ | CSV parsing with edge-case handling |
| vite-plugin-pwa | 0.17+ | Service worker, manifest, caching automation |
| gh-pages | 6.0+ | GitHub Pages deployment |

**Confidence: HIGH.** All choices from 2025–2026 research. Recharts pre-specified in PROJECT.md. Dexie's schema versioning directly addresses health data evolution requirements.

---

### Expected Features

**Table Stakes (must have):**
- Activity logging, sleep tracking, weight tracking, heart rate logging
- Chart/timeline visualization — users must see trends
- Data persistence and backup (IndexedDB + JSON/CSV export)
- Mobile-responsive design — essential for gym/outdoor logging
- Offline capability (service worker + IndexedDB)
- Date selection and backfill — users log workouts hours later
- Daily summary dashboard

**Differentiators (strong positioning):**
- No account, no server — zero friction; full data ownership
- Local-only storage — resonates with privacy-conscious users
- Samsung Health import (ZIP) — recovery path for years of history
- Manual export (JSON + CSV) — true backup and portability
- Targets with deadlines + projected pace — urgency and motivation
- Activity heatmap — GitHub-style consistency visualization
- Custom exercises + training sessions — track what you actually do
- Personal records — intrinsic motivation, not social comparison
- Journal notes — contextual narrative
- BMI auto-calculation, dark mode

**Anti-Features (explicitly out of scope):**
- Social features, leaderboards, challenges
- Cloud sync, accounts, multi-user
- Nutrition/calorie tracking
- Real-time GPS, wearable sync
- Ads, data selling, AI coaching

**Confidence: HIGH.** Table stakes align with Fitbit/Apple/Garmin research. Differentiators anchor to privacy-first positioning in PROJECT.md.

---

### Architecture Approach

**Three-layer browser architecture:** UI (React) → Services (business logic, repositories) → Data (IndexedDB via Dexie).

**Major Components:**
1. **UI Layer** — Dashboard, MetricsView, HistoryView, SettingsView, forms, charts, heatmap
2. **Services Layer** — MetricRepository, ExerciseRepository, SessionRepository, TargetRepository, JournalRepository, SyncService, ImportService, ExportService, CalculationService
3. **Data Layer** — Dexie with polymorphic metrics table (one `type` column), exercises, sessions, targets, journal, syncQueue, metadata

**Key Patterns:**
- **Repository Pattern** — Each table has a repository owning all queries; isolates business logic; testable
- **Service Worker Cache-First** — Static assets cached on first visit; instant load on repeat; fully offline
- **Background Sync API** — Mutations queued in IndexedDB when offline; replayed on reconnect
- **Polymorphic Metrics Table** — One table with `type` column vs separate tables per metric; scalable

**Suggested Build Order:** Data layer → Services → React hooks → UI components → PWA setup → Deployment

**Confidence: HIGH.** Patterns are well-established in production PWAs.

---

### Critical Pitfalls & Prevention

| # | Pitfall | Prevention | Phase |
|---|---------|-----------|-------|
| 1 | **IndexedDB quota eviction — data loss** | Call `navigator.storage.persist()` on first load; monitor quota; auto-backup weekly | Phase 1 |
| 2 | **Service worker cache stale — users see old code** | Versioned cache names; update check on startup; skipWaiting; Vite auto-hashes assets | Phase 1 |
| 3 | **GitHub Pages routing 404 on refresh** | Use HashRouter; test on actual GitHub Pages URL before shipping | Phase 1 |
| 4 | **Timezone bugs corrupt date-based data** | Store Unix timestamps + offset per entry; UTC boundaries for date comparisons; test with `TZ=America/Los_Angeles` | Phase 1 |
| 5 | **Samsung Health CSV — encoding, column names, timestamps** | Parse timestamps as milliseconds; read timezone offset column; column name tolerance mapping; dry-run preview with error log | Phase 2 |
| 6 | **IndexedDB schema migration loses data** | Design schema carefully in MVP; read-transform-rewrite during version bumps; test migrations on real data | Phase 1 (design), ongoing |
| 7 | **Recharts performance with 1000+ data points** | Data decimation (every Nth point); lazy loading; memoization; benchmark before Phase 3 | Phase 3 |
| 8 | **iOS push notifications only work if PWA installed** | Document iOS 16.4+ requirement; Android fully supported; make notifications clearly optional | Phase 3 |

**Confidence: HIGH.** All pitfalls industry-documented with clear prevention strategies.

---

## Implications for Roadmap

### Phase 1 — MVP Core: Metrics Logging + Charts + Offline
**Goal:** Complete core loop (log → visualize → understand). Establish offline-first foundation.

Delivers:
- Weight, sleep (bedtime→wake), steps, water, heart rate logging with date backfill
- Dashboard showing today's snapshot across all metrics
- Line/bar charts per metric (weekly, monthly, yearly) via Recharts
- Mobile-responsive, touch-friendly UI with dark mode toggle
- Offline capability (vite-plugin-pwa service worker)
- JSON + CSV export
- Persistent storage request + service worker update mechanism
- GitHub Pages deployment working from day one

Pitfalls addressed: quota eviction, service worker invalidation, GitHub Pages routing, timezone handling, schema design.

### Phase 2 — Imports + Rich Logging: Samsung Health + Targets + Custom Exercises
**Goal:** Add recovery path (Samsung Health history) and enable goal-setting and personalized tracking.

Delivers:
- Samsung Health ZIP import with full CSV parsing, timestamp handling, duplicate detection, dry-run preview
- Targets with value + deadline + projected pace calculation
- Activity heatmap (GitHub-style)
- Custom exercise CRUD (configurable exercise library)
- Training session logging (multi-exercise per session; squash with match context)
- Personal best detection and display
- Daily journal note

Pitfalls addressed: Samsung Health CSV format variations.

### Phase 3 — Polish + Advanced Features: BMI, Heatmap, Notifications, Performance
**Goal:** Enhance visual richness and UX. Address chart performance for large datasets.

Delivers:
- BMI auto-calculation and chart (uses stored height from settings)
- History list with filters (metric type, date range, exercise)
- Push notifications (optional; gentle end-of-day reminders)
- Chart performance optimization (decimation for 1000+ points, memoization)
- Activity streaks, personal bests in-context

Pitfalls addressed: Recharts performance; iOS push notification limitations documented.

---

## Sources

- STACK.md — Technology stack research (React, Vite, Dexie, Recharts, PWA tooling)
- FEATURES.md — Feature categorization (table stakes, differentiators, anti-features)
- ARCHITECTURE.md — System design (layers, schema, data flows, build order)
- PITFALLS.md — Critical pitfalls with prevention strategies and phase mapping

---
*Research synthesized: 2026-09-02*
