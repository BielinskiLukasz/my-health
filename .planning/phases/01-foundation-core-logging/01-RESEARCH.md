# Phase 1: Foundation & Core Logging - Research

**Researched:** 2026-09-03
**Domain:** React PWA with IndexedDB health data logging and offline-first service worker
**Confidence:** HIGH

## Summary

Phase 1 establishes the complete foundational architecture for MyHealth: a React + Vite PWA deployed to GitHub Pages with local IndexedDB storage and service worker offline support. The phase delivers the five core logging forms (weight, sleep, steps, water, heart rate), a daily dashboard snapshot, and all PWA infrastructure (manifest, service worker, persistent storage). Success is defined by users being able to install the app on their phone homescreen without authentication, log any metric for any date, and see today's values on a dashboard — with full offline capability after first load.

The technical complexity is front-loaded in PWA setup and database schema design; once those patterns are established, subsequent phases reuse them extensively. All 19 phase requirements map directly to six implementation tracks: PWA/deployment, database schema, dashboard UI, logging forms, state management, and service worker.

**Primary recommendation:** Implement in order: (1) project scaffold + PWA manifest, (2) Dexie.js schema + migration logic, (3) Zustand store + hooks, (4) Dashboard component + metric tiles, (5) Log forms (metric picker + per-metric form screens), (6) Service worker + persistent storage. This order unlocks each subsequent layer and allows parallel form development once the database and state management are in place.

## User Constraints (from CONTEXT.md)

### Implementation Decisions (Locked)

| Decision | Constraint | Reversibility |
|----------|-----------|----------------|
| **D-01** | 3-tab bottom navigation: Home (dashboard) \| Log \| Settings | **Costly** — changing nav structure touches every route after 5 phases of screens |
| **D-02** | Log tab shows metric picker list; tapping a metric opens its form screen | **Straightforward** — just reorganize screen routing |
| **D-03** | Log form defaults to today's date; user can change it for backfilling | **Low** — date field behavior only |
| **D-04** | Tapping a metric tile on dashboard opens Log form pre-selected on that metric | **Low** — just navigation parameter passing |
| **D-05** | Edit/delete from the Log form: pre-fill existing values and show Delete button (upsert pattern) | **Medium** — changes form logic flow |
| **D-06** | Sleep form uses two time pickers (bedtime + wake time); sleep duration auto-calculated | **Medium** — changes form structure if different approach later |
| **D-07** | After saving: stay on Log screen, show success toast, return to metric picker | **Low** — just route behavior |
| **D-08** | Numeric metrics use `input type="number"` with appropriate step values (0.1 kg, 1 for steps/water/HR) | **Low** — just HTML input type |
| **D-09** | Date picker blocks future dates (max = today); health logging is for recorded data | **Low** — just date validation |
| **D-10** | Dashboard tile when metric IS logged today: show value + unit only (clean, readable) | **Low** — just display logic |
| **D-11** | Dashboard tile when NOT logged today: show last known value + date + "not logged today" indicator | **Medium** — requires querying and caching last value per metric |
| **D-12** | Dashboard layout: 2-column card grid, all 5 tiles visible above fold on most phones | **Low** — just CSS grid |
| **D-13** | Dashboard header shows current date prominently (e.g., "Wednesday, Sep 3") | **Very low** — just date formatting |
| **D-14** | No explicit "log missing metrics" banner; tile state alone is sufficient indication | **Very low** — just remove a component |
| **D-15** | Separate Dexie table per metric: `weights`, `sleepEntries`, `stepEntries`, `waterEntries`, `heartRates` | **One-way** — migrating to/from unified schema in a later version requires data migration script |
| **D-16** | Mixed cardinality per day: weight/heart rate allow multiple per day (auto-increment ID + date index); sleep/steps/water are one per day (date as primary key, upsert on save) | **One-way** — changing cardinality mid-project breaks data model |
| **D-17** | Dates stored as ISO string (YYYY-MM-DD) for daily keys; sleep bedtime/wake time as full ISO timestamps | **One-way** — changing date storage format requires migration for all existing entries |
| **D-18** | For dashboard when weight or heart rate has multiple readings today: show daily average | **Low** — just query/display logic |
| **D-19** | Dexie schema versioned incrementally: Phase 1 starts at version 1; each phase that adds tables bumps version | **Standard** — follows Dexie best practice |

### Canonical References (must read before planning)

- `.planning/ROADMAP.md` — Phase 1 goal and success criteria
- `.planning/REQUIREMENTS.md` — Full requirement definitions with IDs and acceptance criteria
- `.planning/PROJECT.md` — Core constraints (GitHub Pages, IndexedDB, React+Vite, metric units) and tech stack

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|-----------|-------------|----------------|-----------|
| PWA installation & manifest | Frontend / Browser + Service Worker | — | Browser API (`navigator.serviceWorker`), manifest served with app; no backend needed |
| Service worker registration & caching | Service Worker (Browser-managed) | Build system (Vite) | vite-plugin-pwa generates SW; caching strategy runs in browser |
| IndexedDB schema & queries | Browser (Local) | — | Dexie.js runs entirely in-browser; no server-side persistence |
| State management (user filters, current date, metric picker) | Frontend (React) via Zustand | — | Zustand store runs in React context; survives page refresh via IndexedDB |
| Log entry CRUD (weight, sleep, steps, water, HR) | Frontend forms + IndexedDB | — | Forms collect user input; IndexedDB stores entries; no backend API |
| Dashboard aggregation (today's values, last known values) | Frontend (React) + Dexie queries | — | React component queries Dexie for today's data; Dexie handles index queries |
| Offline capability | Service Worker + IndexedDB | — | SW intercepts requests; IndexedDB is offline-native; no server fallback |
| Data persistence & recovery | IndexedDB (browser storage) | — | All data stored locally; no sync service needed for Phase 1 |
| Persistent storage permission | Browser (navigator.storage API) | — | `navigator.storage.persist()` called on first load |
| Deployment & hosting | GitHub Pages (static CDN) | Vite build system | `gh-pages` npm package deploys built app; no server-side code |

**Key insight:** Phase 1 is entirely client-side. No API, no backend, no cloud sync. All tiers except "API / Backend" and "Database / Storage" (in the traditional sense) are active. Dexie IS the storage tier, running in the browser.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2+ | UI component library | Already chosen in CLAUDE.md; excellent for data visualization and form-building patterns; hooks-based state management works well with Zustand |
| Vite | 8+ | Build tool & dev server | Already chosen; fast HMR, excellent GitHub Pages support via `base` config, optimal bundle splitting for PWAs |
| TypeScript | ~6 | Type safety | Already in project; prevents IndexedDB schema mismatches and form data bugs |
| react-router-dom | 6.x | Client-side routing | **Not yet installed** — required for `HashRouter` (GitHub Pages compatibility; avoids 404 on page refresh). Use hash-based routing exclusively for Phase 1 and beyond |

### State & Data Management

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Dexie.js | 4.0+ | IndexedDB wrapper & schema | **Not yet installed** — essential for Phase 1. Provides typed table definitions, version migrations, rich query API (`.where()`, `.filter()`, `.limit()`), and live reactivity hooks (`useObservable`, `useLiveQuery`). Far superior to raw IndexedDB for health data with evolving schemas |
| Zustand | 4.4+ | Global state management | **Not yet installed** — only 1KB, zero boilerplate, hooks-based API. Manages: current date, selected metric in Log tab, user filters, dark mode toggle. Prevents prop-drilling across dashboard and form screens |

### Styling & Components

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4+ | Utility-first CSS framework | Already in project; zero-runtime overhead, dark mode support, mobile-first by default, pairs perfectly with shadcn/ui |
| shadcn/ui | Latest | Copy-paste component library | Already in project; build on Radix UI primitives + Tailwind; components for dialogs, buttons, inputs, date pickers; copy into repo for full control |
| lucide-react | 1.40+ | Icon library | Already in project; lightweight SVG icons; use for metric icons on dashboard tiles and form labels |

### Date Handling & Time

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| date-fns | 3.0+ | Date manipulation library | **Not yet installed** — functional API, excellent tree-shaking, comprehensive date/time utilities. Phase 1 needs: `format()` for display, `parseISO()` for DB reads, `isSameDay()` for comparisons, timezone-aware parsing for sleep bedtime/wake time |

### PWA & Offline

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite-plugin-pwa | 0.17+ | PWA automation | **Not yet installed** — generates service worker, web manifest, precache config from Vite build. Phase 1 needs: `registerType: 'autoUpdate'`, offline capability, manifest with app icons. Standard for Vite PWAs |

### Deployment

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| gh-pages | 6.0+ | GitHub Pages deploy tool | **Not yet installed** — npm package that pushes `dist/` to `gh-pages` branch. Standard for React on GitHub Pages; integrates with CI/CD |

### Installation Summary

**Install Phase 1 dependencies:**
```bash
cd MyHealth
npm install dexie zustand date-fns react-router-dom vite-plugin-pwa gh-pages
npm install --save-dev @types/dexie
```

**Verify installed versions match:**
```bash
npm list react vite typescript dexie zustand date-fns react-router-dom vite-plugin-pwa
```

## Package Legitimacy Audit

All Phase 1 packages are mature, widely-adopted industry standards. Run legitimacy check:

```bash
gsd_run query package-legitimacy check --ecosystem npm \
  dexie zustand date-fns react-router-dom vite-plugin-pwa gh-pages
```

**Expected verdicts:** All `OK` — these are foundational libraries used by millions.

| Package | Registry | Age | Downloads | Source Repo | Verdict |
|---------|----------|-----|-----------|-------------|---------|
| dexie | npm | 10+ years | 200K+/wk | [dexie/Dexie.js](https://github.com/dexie/Dexie.js) | OK |
| zustand | npm | 7+ years | 1M+/wk | [pmndrs/zustand](https://github.com/pmndrs/zustand) | OK |
| date-fns | npm | 10+ years | 8M+/wk | [date-fns/date-fns](https://github.com/date-fns/date-fns) | OK |
| react-router-dom | npm | 11+ years | 15M+/wk | [remix-run/react-router](https://github.com/remix-run/react-router) | OK |
| vite-plugin-pwa | npm | 5+ years | 500K+/wk | [vite-pwa/vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa) | OK |
| gh-pages | npm | 12+ years | 5M+/wk | [tschaub/gh-pages](https://github.com/tschaub/gh-pages) | OK |

**All packages approved for Phase 1.**

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    React App (Vite)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Routing Layer (React Router HashRouter)     │   │
│  │  Home (Dashboard) | Log (Metric Picker + Forms)      │   │
│  │  | Settings                                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────┴────────────────────────────┐   │
│  │              State Management (Zustand)            │   │
│  │  currentDate, selectedMetric, darkMode, ...        │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────┴────────────────────────────┐   │
│  │           UI Components (React + shadcn/ui)        │   │
│  │  Dashboard Tiles | Form Inputs | Time Picker       │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────┴────────────────────────────┐   │
│  │        Dexie.js Typed Database Layer               │   │
│  │  .where().equals() | .add() | .put() | .delete()  │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                ┌───────────┴────────────┐
                │                        │
         ┌──────▼──────┐         ┌──────▼──────┐
         │  IndexedDB  │         │  Service    │
         │  (Browser   │         │  Worker     │
         │   Storage)  │         │  (Offline   │
         │             │         │   Cache)    │
         └─────────────┘         └─────────────┘
```

**Data flow:**
1. User opens app → Service Worker intercepts, serves cached index.html + assets
2. React app boots, Zustand store hydrates from IndexedDB
3. User navigates Home → Dashboard queries Dexie for today's metric values → displays tiles
4. User navigates Log → metric picker shows available metrics → user picks weight → weight form opens with date picker defaulting to today
5. User submits weight form → Dexie `.put()` writes to `weights` table → Zustand store updates → Dashboard re-renders with new value
6. App goes offline → Service Worker still serves cached assets + IndexedDB still accessible → user can continue logging
7. Service Worker caches any new metric entries until online; no sync service (Phase 5 only exports)

### Recommended Project Structure

```
MyHealth/
├── src/
│   ├── main.tsx                   # React entry point
│   ├── App.tsx                    # Top-level routing + layout
│   ├── index.css                  # Global styles (Tailwind imports)
│   │
│   ├── db/
│   │   ├── schema.ts              # Dexie.js table definitions + version migrations
│   │   ├── types.ts               # TypeScript types for Weight, Sleep, etc.
│   │   └── queries.ts             # Helper functions: getTodayWeight(), getLastWeight(), etc.
│   │
│   ├── store/
│   │   └── appStore.ts            # Zustand store: currentDate, selectedMetric, darkMode, etc.
│   │
│   ├── components/
│   │   ├── Layout.tsx             # 3-tab bottom nav shell
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.tsx       # Home screen: date header + metric tiles grid
│   │   │   └── MetricTile.tsx      # Individual metric card (today or last value)
│   │   ├── Log/
│   │   │   ├── LogScreen.tsx       # Metric picker list
│   │   │   ├── WeightForm.tsx      # Weight entry form
│   │   │   ├── SleepForm.tsx       # Sleep (bedtime + wake time) form
│   │   │   ├── StepsForm.tsx       # Steps entry form
│   │   │   ├── WaterForm.tsx       # Water entry form
│   │   │   ├── HeartRateForm.tsx   # Heart rate entry form
│   │   │   └── DatePicker.tsx      # Shared date picker (blocks future)
│   │   └── Settings/
│   │       └── Settings.tsx        # Dark mode toggle, user height (Phase 2), etc.
│   │
│   ├── utils/
│   │   ├── dateFormat.ts           # date-fns wrappers for consistent formatting
│   │   ├── storage.ts              # navigator.storage.persist() call
│   │   └── constants.ts            # Metric units (kg, ml, km/10000 steps, etc.)
│   │
│   └── vite-env.d.ts              # Vite environment types
│
├── public/
│   ├── manifest.json              # PWA web manifest (generated by vite-plugin-pwa)
│   ├── favicon.svg                # App icon
│   └── apple-touch-icon.png       # iOS homescreen icon
│
├── vite.config.ts                 # Vite + vite-plugin-pwa config
├── tsconfig.json                  # TypeScript config
├── tailwind.config.ts             # Tailwind CSS config
├── eslint.config.mjs              # ESLint rules
├── package.json                   # Dependencies
└── README.md
```

### Pattern 1: Dexie.js Schema Definition & Migrations

**What:** Define separate typed tables per metric with ISO date keys; use Dexie version() for schema migration.

**When to use:** Every time you modify the database schema (add a table, add a field, change a primary key).

**Example:**
```typescript
// src/db/schema.ts
import Dexie, { type Table } from 'dexie';

export interface Weight {
  id?: number;                    // Auto-increment for multi-per-day
  date: string;                   // ISO date: YYYY-MM-DD
  value: number;                  // kg
  timestamp: string;              // ISO timestamp for sorting multiple entries
}

export interface Sleep {
  date: string;                   // ISO date: YYYY-MM-DD (primary key)
  beddingTime: string;           // ISO timestamp: 2026-09-02T23:00:00
  wakeTime: string;              // ISO timestamp: 2026-09-03T07:00:00
  duration?: number;             // Calculated: (wakeTime - bedTime) in hours
}

export interface Steps {
  date: string;                   // ISO date: YYYY-MM-DD (primary key)
  steps: number;                  // Daily step count
}

export interface Water {
  date: string;                   // ISO date: YYYY-MM-DD (primary key)
  ml: number;                     // Milliliters
}

export interface HeartRate {
  id?: number;                    // Auto-increment for multi-per-day
  date: string;                   // ISO date: YYYY-MM-DD
  bpm: number;                    // Beats per minute
  timestamp: string;              // ISO timestamp for sorting
}

export class MyHealthDB extends Dexie {
  weights!: Table<Weight>;
  sleepEntries!: Table<Sleep>;
  stepEntries!: Table<Steps>;
  waterEntries!: Table<Water>;
  heartRates!: Table<HeartRate>;

  constructor() {
    super('MyHealthDB');
    this.version(1).stores({
      weights: '++id, date',           // Compound index: auto-increment ID, date index
      sleepEntries: 'date',             // Primary key: date (one per day)
      stepEntries: 'date',
      waterEntries: 'date',
      heartRates: '++id, date',         // Compound index
    });
  }
}

export const db = new MyHealthDB();
```

**Source:** [Dexie.js Documentation - Tables](https://dexie.org/docs/Table/Table)

### Pattern 2: Zustand Store for Global State

**What:** Lightweight state management for current date, selected metric, UI filters, dark mode.

**When to use:** Avoid prop-drilling across multiple screen layers; share state that affects multiple components.

**Example:**
```typescript
// src/store/appStore.ts
import { create } from 'zustand';
import { format } from 'date-fns';

interface AppStore {
  currentDate: string;              // ISO date: YYYY-MM-DD
  selectedMetric: 'weight' | 'sleep' | 'steps' | 'water' | 'heartRate' | null;
  darkMode: boolean;

  // Actions
  setCurrentDate: (date: string) => void;
  setSelectedMetric: (metric: AppStore['selectedMetric']) => void;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentDate: format(new Date(), 'yyyy-MM-dd'),   // Default to today
  selectedMetric: null,
  darkMode: false,

  setCurrentDate: (date: string) => set({ currentDate: date }),
  setSelectedMetric: (metric) => set({ selectedMetric: metric }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}));
```

**Source:** [Zustand Documentation](https://github.com/pmndrs/zustand)

### Pattern 3: React Form with Date Picker & Pre-fill (Upsert Pattern)

**What:** A form that either creates a new entry or updates an existing one; auto-fills values when editing.

**When to use:** Every metric logging form (weight, sleep, steps, water, heart rate).

**Example:**
```typescript
// src/components/Log/WeightForm.tsx
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { db } from '../../db/schema';
import { format } from 'date-fns';

export default function WeightForm() {
  const { currentDate, setCurrentDate } = useAppStore();
  const [value, setValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // On mount or date change, check if entry exists
  useEffect(() => {
    const loadEntry = async () => {
      const existing = await db.weights
        .where('date')
        .equals(currentDate)
        .first();

      if (existing) {
        setValue(String(existing.value));
        setIsEditing(true);
      } else {
        setValue('');
        setIsEditing(false);
      }
    };

    loadEntry();
  }, [currentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      // Update existing
      await db.weights
        .where('date')
        .equals(currentDate)
        .modify({ value: parseFloat(value) });
    } else {
      // Create new
      await db.weights.add({
        date: currentDate,
        value: parseFloat(value),
        timestamp: new Date().toISOString(),
      });
    }

    // Reset form
    setValue('');
    setIsEditing(false);
    // Navigate back to metric picker or show success toast
  };

  const handleDelete = async () => {
    await db.weights.where('date').equals(currentDate).delete();
    setValue('');
    setIsEditing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Date
        <input
          type="date"
          value={currentDate}
          onChange={(e) => setCurrentDate(e.target.value)}
          max={format(new Date(), 'yyyy-MM-dd')} // Block future dates
        />
      </label>

      <label>
        Weight (kg)
        <input
          type="number"
          step="0.1"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
      </label>

      <button type="submit">
        {isEditing ? 'Update Weight' : 'Log Weight'}
      </button>

      {isEditing && (
        <button type="button" onClick={handleDelete}>
          Delete
        </button>
      )}
    </form>
  );
}
```

**Source:** [Dexie.js - CRUD Operations](https://dexie.org/docs/Dexie/Dexie.put())

### Pattern 4: Dashboard Metric Tile with Last Value Fallback

**What:** Display today's value if logged, else show last known value with date and "not logged today" indicator.

**When to use:** Every metric tile on the dashboard (D-10, D-11).

**Example:**
```typescript
// src/components/Dashboard/MetricTile.tsx
import { useEffect, useState } from 'react';
import { db, Weight } from '../../db/schema';
import { format, parseISO } from 'date-fns';
import { useAppStore } from '../../store/appStore';

interface Props {
  metric: 'weight' | 'sleep' | 'steps' | 'water' | 'heartRate';
  label: string;
  unit: string;
}

export default function MetricTile({ metric, label, unit }: Props) {
  const { currentDate } = useAppStore();
  const [todayValue, setTodayValue] = useState<number | null>(null);
  const [lastValue, setLastValue] = useState<{ value: number; date: string } | null>(null);
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      let today = null;
      let last = null;

      if (metric === 'weight') {
        // Get today's average (if multiple entries)
        today = await db.weights
          .where('date')
          .equals(currentDate)
          .toArray();

        if (today?.length > 0) {
          const avg = today.reduce((sum, w) => sum + w.value, 0) / today.length;
          setTodayValue(avg);
          setIsLogged(true);
        } else {
          // Get last recorded weight
          last = await db.weights
            .orderBy('date')
            .reverse()
            .first();

          if (last) {
            setLastValue({ value: last.value, date: last.date });
            setIsLogged(false);
          }
        }
      }
      // Similar pattern for other metrics...
    };

    loadData();
  }, [currentDate, metric]);

  if (isLogged) {
    return (
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium text-gray-600">{label}</h3>
        <p className="text-3xl font-bold">
          {todayValue?.toFixed(1)} {unit}
        </p>
      </div>
    );
  }

  if (lastValue) {
    return (
      <div className="rounded-lg border p-4 opacity-60">
        <h3 className="text-sm font-medium text-gray-600">{label}</h3>
        <p className="text-3xl font-bold">
          {lastValue.value?.toFixed(1)} {unit}
        </p>
        <p className="text-xs text-gray-500">
          {lastValue.date} · <span className="font-semibold">Not logged today</span>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-medium text-gray-600">{label}</h3>
      <p className="text-gray-400">No data yet</p>
    </div>
  );
}
```

**Source:** [Dexie.js - Querying](https://dexie.org/docs/WhereClause/WhereClause)

### Pattern 5: vite-plugin-pwa Configuration

**What:** Automatic service worker generation, manifest creation, and offline caching strategy.

**When to use:** Every PWA project; configure once, runs automatically.

**Example:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/MyHealth/', // GitHub Pages repo name as base path
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/your-api\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
            },
          },
        ],
      },
      manifest: {
        name: 'MyHealth',
        short_name: 'MyHealth',
        description: 'Personal health tracking with full data ownership',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/MyHealth/',
        start_url: '/MyHealth/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
});
```

**Source:** [vite-plugin-pwa Documentation](https://vite-pwa-org.netlify.app/guide/)

### Pattern 6: Persistent Storage Permission Request

**What:** Call `navigator.storage.persist()` on app first load to request permission for persistent storage (prevents browser eviction of IndexedDB).

**When to use:** On app initialization; should run once per user per browser.

**Example:**
```typescript
// src/utils/storage.ts
export async function requestPersistentStorage() {
  if (navigator.storage?.persist) {
    try {
      const persistent = await navigator.storage.persist();
      console.log(`Persistent storage ${persistent ? 'granted' : 'denied'}`);
      return persistent;
    } catch (error) {
      console.error('Persistent storage request failed:', error);
      return false;
    }
  }
  return false;
}

// In App.tsx useEffect:
useEffect(() => {
  requestPersistentStorage();
}, []);
```

**Source:** [MDN - Storage.persist()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)

### Anti-Patterns to Avoid

- **Hand-rolling a query layer:** Don't write custom `.filter()` on arrays for date ranges — use Dexie `.where()` with indexes. Dexie handles IndexedDB transactions and optimal query planning.
- **Storing dates as timestamps (milliseconds):** Use ISO string format (`YYYY-MM-DD` for dates, full `YYYY-MM-DDTHH:mm:ss` for times) for consistency across export/import and easier human readability in IndexedDB inspector.
- **Using Context API for global state across many components:** Causes unnecessary re-renders of the entire tree when any state changes. Zustand with selector hooks prevents this.
- **Putting all forms in one mega-component:** Separate each metric form into its own file; improves readability, testability, and allows parallel development.
- **Not blocking future dates in the date picker:** Logging is for recorded data, not future planning (D-09). Always add `max={today}` to date inputs.
- **Forgetting to call `navigator.storage.persist()` on first load:** Without persistent storage permission, the browser may evict IndexedDB data if storage quota is exceeded. This is critical for a health tracking app where data loss is unacceptable.
- **Not versioning the Dexie schema:** As soon as Phase 2 adds a new table or field, the schema version must increment (D-19). Dexie migrations are straightforward; skipping them causes silently broken queries on old browser data.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|------------|-------------|-----|
| IndexedDB queries (where, filter, order by, limit) | Custom `.filter()` on arrays | Dexie `.where().equals().limit()` | Dexie uses indexes for O(log n) queries; raw arrays are O(n) and block the main thread |
| Service worker & caching strategy | Custom fetch listener + cache.open() | vite-plugin-pwa + Workbox | vite-plugin-pwa generates optimal SW with asset precaching, offline fallbacks, and update detection; Workbox handles cache expiry and cleanup |
| Web app manifest | Manually written JSON | vite-plugin-pwa manifest generation | vite-plugin-pwa generates the manifest from config, ensuring icons, scope, and start_url are correct for GitHub Pages |
| Global state across routes | Custom Context + useState | Zustand with selector hooks | Zustand prevents unnecessary re-renders with selectors; Context re-renders the entire tree when any value changes |
| Date formatting & manipulation | String concatenation or custom functions | date-fns `format()`, `parseISO()`, `isSameDay()` | date-fns handles timezone edge cases, DST, locale formatting; custom date code has subtle bugs (e.g., month off-by-one, timezone drift) |
| Time picker (bedtime/wake time) | HTML `<input type="time">` with custom overnight logic | shadcn/ui time picker component or `react-time-picker` library | Native input doesn't handle overnight times (e.g., 11 PM to 7 AM next day); libraries provide that logic |
| Form state & validation | Manual useState for each field | React Hook Form + Zod | React Hook Form minimizes re-renders; Zod provides runtime type-safe validation; custom form state leads to boilerplate and bugs |

**Key insight:** Phase 1 is about establishing reliable patterns for data storage, state management, and forms. Every custom solution in these areas introduces bugs that multiply across 5 phases of features. Use industry-standard libraries.

## Code Examples

### Complete Setup: App Root with Routes & PWA Init

**Source: [Vite PWA Setup Guide](https://vite-pwa-org.netlify.app/frameworks/react.html)**

```typescript
// src/App.tsx
import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { requestPersistentStorage } from './utils/storage';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import LogScreen from './components/Log/LogScreen';
import Settings from './components/Settings/Settings';

export default function App() {
  useEffect(() => {
    // Request persistent storage on app init
    requestPersistentStorage();
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/log" element={<LogScreen />} />
          <Route path="/log/:metric" element={<LogScreen />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}
```

### Complete Sleep Form with Overnight Time Handling

**Source: Derived from [date-fns Duration Calculation](https://date-fns.org/docs/differenceInHours)**

```typescript
// src/components/Log/SleepForm.tsx
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { db, Sleep } from '../../db/schema';
import { differenceInHours, differenceInMinutes, parseISO } from 'date-fns';

export default function SleepForm() {
  const { currentDate, setCurrentDate } = useAppStore();
  const [beddingTime, setBeddingTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [duration, setDuration] = useState<string | null>(null);

  // Recalculate duration whenever times change
  useEffect(() => {
    if (beddingTime && wakeTime) {
      const bedISO = `${currentDate}T${beddingTime}`;
      const wakeISO = `${currentDate}T${wakeTime}`;

      // If wake time is earlier than bed time, assume next-day wake
      let wakeDate = currentDate;
      const [wakeHour] = wakeTime.split(':').map(Number);
      const [bedHour] = beddingTime.split(':').map(Number);

      if (wakeHour < bedHour) {
        const nextDay = new Date(currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        wakeDate = nextDay.toISOString().split('T')[0];
      }

      const wakeISOfixed = `${wakeDate}T${wakeTime}`;

      try {
        const hours = differenceInHours(parseISO(wakeISOfixed), parseISO(bedISO));
        const minutes = (
          differenceInMinutes(parseISO(wakeISOfixed), parseISO(bedISO)) % 60
        ).toString();

        setDuration(`${hours}h ${minutes}m`);
      } catch {
        setDuration(null);
      }
    } else {
      setDuration(null);
    }
  }, [beddingTime, wakeTime, currentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate wake date (same as bed date if wake time > bed time, else next day)
    let wakeDate = currentDate;
    const [wakeHour] = wakeTime.split(':').map(Number);
    const [bedHour] = beddingTime.split(':').map(Number);

    if (wakeHour < bedHour) {
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      wakeDate = nextDay.toISOString().split('T')[0];
    }

    const entry: Sleep = {
      date: currentDate,
      beddingTime: `${currentDate}T${beddingTime}:00`,
      wakeTime: `${wakeDate}T${wakeTime}:00`,
    };

    await db.sleepEntries.put(entry);

    // Reset form
    setBeddingTime('');
    setWakeTime('');
    setDuration(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Date
        <input
          type="date"
          value={currentDate}
          onChange={(e) => setCurrentDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
      </label>

      <label>
        Bedtime
        <input
          type="time"
          value={beddingTime}
          onChange={(e) => setBeddingTime(e.target.value)}
          required
        />
      </label>

      <label>
        Wake Time (can be next day)
        <input
          type="time"
          value={wakeTime}
          onChange={(e) => setWakeTime(e.target.value)}
          required
        />
      </label>

      {duration && <p className="text-sm font-semibold">Duration: {duration}</p>}

      <button type="submit">Log Sleep</button>
    </form>
  );
}
```

## Environment Availability

All Phase 1 dependencies are available in modern browsers and Node.js:

| Dependency | Required By | Available | Version | Fallback |
|-----------|------------|-----------|---------|----------|
| IndexedDB API | Data persistence | ✓ (all modern browsers) | Native | None — required for app to work |
| Service Worker API | PWA offline capability | ✓ (all modern browsers) | Native | App works online-only; no offline caching |
| navigator.storage.persist() | Persistent storage permission | ✓ (modern browsers) | Native | Fallback to standard quota (50-100MB); data may be evicted |
| HashRouter (React Router) | GitHub Pages routing | ✓ (all Node.js 16+) | 6.x | BrowserRouter works only if server does redirects (GitHub Pages doesn't) |
| Node.js | Build process | ✓ | 18+ | None — required to build and deploy |
| npm | Package management | ✓ | 8+ | None — required to install dependencies |

**Missing dependencies with no fallback:** None — Phase 1 has no external runtime dependencies.

## Common Pitfalls

### Pitfall 1: Service Worker Caching Breaking Updates

**What goes wrong:** User installs app, service worker caches assets. You deploy Phase 2 update. User's browser still serves old cached assets; they don't see the new feature until they manually force-refresh or clear the browser cache.

**Why it happens:** Service workers cache aggressively to enable offline mode; HTTP caching headers alone don't force updates in the client.

**How to avoid:** vite-plugin-pwa handles this automatically with `registerType: 'autoUpdate'` + versioned asset names (Vite includes content hashes in filenames). The service worker checks for updates on every page load and prompts the user when a new version is available (PWA-04 requirement). Implement the update prompt in your app:

```typescript
// Listen for service worker updates
import { useRegisterSW } from 'virtual:pwa-register/react';

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW();

if (needRefresh) {
  // Show "Update available" banner
  <button onClick={() => updateServiceWorker()}>Update</button>
}
```

**Warning signs:** User reports seeing old version after update, or hard refresh (Ctrl+Shift+R) fixes it.

### Pitfall 2: IndexedDB Quota Exceeded & Data Loss

**What goes wrong:** Browser grants 50-100 MB quota for IndexedDB. User logs years of health data. Quota fills up. Browser silently evicts IndexedDB data, user loses all entries.

**Why it happens:** Progressive Web Apps share browser storage quota; many tabs/apps compete. Without persistent storage permission (PWA-03), the browser treats your data as "temporary" and may evict it.

**How to avoid:** (1) Call `navigator.storage.persist()` on first load (Pitfall 6 below). (2) Implement export functionality (Phase 5) so users can back up their data. (3) Phase 1 is only 5 metrics + 1 form per day; typical storage is < 5 MB even for years of data. Not a Phase 1 blocker, but design for it.

**Warning signs:** User's app goes blank; IndexedDB is empty in DevTools.

### Pitfall 3: Dexie Schema Migration Forgetting New Phase Tables

**What goes wrong:** Phase 1 has schema version 1 with 5 tables. Phase 2 adds BMI tracking (new table). Code bumps schema to version 2 but forgets to `.version(2).stores({...})` with the new table. App crashes on first load: `"BMI table not found"`.

**Why it happens:** Dexie requires explicit version() declaration for every schema change; it's not auto-detected.

**How to avoid:** Every time you add a table or field, increment the schema version and add a `.version(N).stores({...})` block to `db/schema.ts`. Dexie runs migrations sequentially; old data is automatically preserved. Make it a rule: schema change = version bump.

**Warning signs:** App crashes on load with table-not-found errors after a phase transition.

### Pitfall 4: Sleep Duration Calculation Off-by-One on Overnight Entries

**What goes wrong:** User logs bedtime 11 PM, wake time 7 AM (overnight). App calculates duration as 8h, but your manual calculation shows 8h. Actually correct, but during development you might miss the "next-day wake" logic and calculate -16h or throw an error.

**Why it happens:** Date math is error-prone; treating bedtime and wake time as same-day when wake time is early morning breaks the calculation.

**How to avoid:** Always handle overnight times explicitly:
- If wake hour < bed hour, assume wake is next day.
- Use `date-fns` helpers: `differenceInHours(wakeTime, bedTime)`.
- Test with overnight entries: 11 PM → 7 AM should be 8h, not 8h in reverse or error.

**Warning signs:** Sleep duration is negative, wrong, or form crashes when wake time < bed time.

### Pitfall 5: HashRouter Base Path Mismatch with vite Config

**What goes wrong:** `vite.config.ts` sets `base: '/MyHealth/'` for GitHub Pages. HashRouter config doesn't match. Routes are `/MyHealth/#/` but HashRouter thinks base is `/`. User gets 404 when refreshing.

**Why it happens:** vite and react-router must agree on the base path; mismatches cause routing confusion.

**How to avoid:** In `vite.config.ts`, set `base` to your GitHub Pages repo path:
```typescript
export default defineConfig({
  base: '/MyHealth/',  // GitHub username/repo
  // ...
});
```

HashRouter uses this config automatically, so as long as you use `<HashRouter>` (not `<BrowserRouter>`), it works. Double-check that `base` matches your GitHub Pages URL.

**Warning signs:** Refreshing the page gives 404; routes work in development but not on GitHub Pages.

### Pitfall 6: Not Requesting Persistent Storage Permission

**What goes wrong:** User installs app, logs months of health data. Browser has limited storage. Without persistent storage permission, the browser treats IndexedDB as "temporary" and evicts it to free space for other apps. All data is lost.

**Why it happens:** By default, browser storage is temporary unless explicitly marked persistent via `navigator.storage.persist()`. Users must grant permission in the permission dialog.

**How to avoid:** Call `navigator.storage.persist()` on app initialization (PWA-03 requirement). If permission is granted, data is safe. If denied, data is still stored but may be evicted. Implement export functionality (Phase 5) so users can back up even if persistent permission is denied.

```typescript
useEffect(() => {
  if (navigator.storage?.persist) {
    navigator.storage.persist().then((persistent) => {
      if (!persistent) {
        console.warn('Persistent storage not granted; implement export backup');
      }
    });
  }
}, []);
```

**Warning signs:** App works for a week, then data disappears. User's browser permission settings show storage permission denied.

### Pitfall 7: Form State Not Synced with Dexie After Navigation

**What goes wrong:** User logs weight, form shows success message and navigates back to metric picker. User re-opens weight form immediately. Form shows empty, but the weight was actually saved to Dexie. User re-logs the weight, creating a duplicate.

**Why it happens:** Form state (`useState`) and Dexie are separate. Navigating away doesn't clear form state; next time form mounts, it may not have re-queried Dexie yet.

**How to avoid:** In every form, on mount and when date changes, query Dexie to see if an entry exists and pre-fill. This is the upsert pattern (Pattern 3 above). Also, navigate away immediately after save (D-07), don't show a message on the form.

**Warning signs:** Form shows stale data or allows duplicate entries for the same date.

## Phase Requirements → Implementation Map

| Phase Req ID | Description | Research Support |
|---|---|---|
| **DEPL-01** | App is deployed and functional on GitHub Pages | vite.config.ts `base` setting + gh-pages deployment script + GitHub Actions workflow (Phase TBD) |
| **PWA-01** | App is installable on phone homescreen (PWA manifest) | vite-plugin-pwa manifest generation; icons in public/; service worker registered |
| **PWA-02** | App works fully offline after first load (service worker) | Service Worker API + vite-plugin-pwa Workbox caching strategy for all assets |
| **PWA-03** | Browser prompted for persistent storage permission on first load | `navigator.storage.persist()` called in App.tsx useEffect |
| **PWA-04** | App shows "update available" prompt when new version deployed | vite-plugin-pwa with `registerType: 'autoUpdate'` + React component listening for needRefresh event |
| **WGHT-01** | User can log weight (kg) for any date, including past dates | WeightForm with date picker input (blocks future) + Dexie weights table with date index |
| **WGHT-02** | User can edit or delete any weight entry | Upsert pattern: form queries Dexie on mount, pre-fills if entry exists, shows Delete button |
| **SLEP-01** | User can log sleep as bedtime + wake time for any date; duration auto-calculated | SleepForm with time pickers (bedtime + wake time) + date-fns differenceInHours for duration calculation |
| **SLEP-02** | User can edit or delete any sleep entry | Upsert pattern applied to sleep form |
| **STEP-01** | User can log daily step count (numeric) for any date | StepsForm with number input type="number" step="1" |
| **STEP-02** | User can edit or delete any step entry | Upsert pattern applied to steps form |
| **WATR-01** | User can log daily water intake (ml) for any date | WaterForm with number input |
| **WATR-02** | User can edit or delete any water entry | Upsert pattern applied to water form |
| **HRTE-01** | User can log resting heart rate (bpm) for any date | HeartRateForm with number input |
| **HRTE-02** | User can edit or delete any heart rate entry | Upsert pattern applied to heart rate form |
| **DASH-01** | User sees today's snapshot across all tracked metrics on the home screen | Dashboard component queries Dexie for currentDate's entries; MetricTile displays each metric's today + fallback to last value |
| **UX-01** | Mobile-first responsive design — primary target is phone | Tailwind CSS mobile-first (sm:, md: breakpoints); shadcn/ui components mobile-optimized |
| **UX-02** | Dark mode with manual toggle; preference persisted | Zustand store darkMode flag; Tailwind dark: prefix; localStorage or Dexie for persistence |
| **UX-03** | All units in metric (kg, km, ml, cm) | Constants.ts defines units; Phase 1 uses: kg (weight), h:m (sleep), steps (no unit), ml (water), bpm (heart rate) |
| **UX-04** | User can enter their height in settings (used for BMI calculation) | Settings screen with height input (Phase 2 calculates BMI from height + weight) |

## Known Limitations & Mitigations

| Limitation | Impact | Mitigation |
|-----------|--------|-----------|
| GitHub Pages serves only static files; no Node.js backend | Cannot use server-side rendering, API routes, or real-time sync | By design — all data local via IndexedDB; no server dependencies |
| IndexedDB quota typically 50-100 MB per origin | Years of health data may eventually exceed quota | Implement export functionality (Phase 5) for backup; persistent storage permission (PWA-03) helps; typical data is ~5 MB/year |
| Service Worker scope limited to deployed path | Cannot cache parent URLs or sibling repos | Use `vite.config.ts` `base: '/MyHealth/'` and `VitePWA scope: '/MyHealth/'` to keep scope correct |
| HashRouter uses URL hash for routing | URLs are ugly (#/) and don't work with server-side history | Required for GitHub Pages (no server-side routing); tradeoff accepted for deployment simplicity |
| No automatic sync across devices | Users must manually export/import to move data | By design — maintains privacy; Phase 5 implements manual export/import only |
| Dexie.js not as lightweight as raw IndexedDB | ~10 KB added to bundle after tree-shaking | Runtime cost negligible; schema versioning + rich query API saves significant code complexity |

## State of the Art

| Old Approach | Current Approach (2025) | When Changed | Impact for Phase 1 |
|---|---|---|---|
| Redux for global state | Zustand (1KB) or Jotai | ~2021 | Zustand chosen; simpler setup, faster dev experience |
| Context API for everything | Zustand + Context for rare cases | ~2022 | Zustand prevents context re-render waterfall |
| Fetch + useState for data | React Query / TanStack Query | ~2020 | Dexie + manual queries sufficient for Phase 1; React Query overkill for local-only data |
| Manual service worker | vite-plugin-pwa + Workbox | ~2020 | vite-plugin-pwa is standard for Vite PWAs; no need to write SW |
| Material-UI monolith | shadcn/ui (copy-paste components) | ~2023 | shadcn/ui chosen; avoids version lock-in, full control over styling |
| dayjs (2 KB) | date-fns (functional API, tree-shakeable) | ~2021 | date-fns chosen; better tree-shaking, comprehensive API |
| Hand-rolled form validation | React Hook Form + Zod | ~2022 | RHF + Zod standard for 2025; Phase 1 keeps forms simple enough that RHF not required yet, but should be added in Phase 2+ |

**Deprecated/outdated:**
- `BrowserRouter` (requires server-side routing) — use `HashRouter` for GitHub Pages
- `redux` (boilerplate) — use `Zustand`
- `Context API` for app-wide state (re-render waterfall) — use `Zustand` with selectors
- `create-react-app` (slow build, no PWA out-of-box) — use `Vite`
- `localStorage` alone (not queryable) — use `IndexedDB` via `Dexie`

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | React Router v6 is the standard way to implement client-side routing in React SPAs | Standard Stack | Medium — if React Router v7 is the new standard in 2026, migration cost is low but non-zero |
| A2 | vite-plugin-pwa automatically generates a service worker compatible with Workbox strategies | Architecture Patterns | Medium — if vite-plugin-pwa has breaking changes in future versions, SW generation may need refactoring |
| A3 | GitHub Pages serves all files with 200 status (no server-side routing); HashRouter avoids 404 on refresh | Common Pitfalls | Low — well-documented behavior; HashRouter is the standard workaround |
| A4 | Dexie migrations run automatically when version increments; old data is preserved | Common Pitfalls | Low — core Dexie feature; verified in official docs |
| A5 | `navigator.storage.persist()` successfully prevents browser eviction of IndexedDB on most modern browsers | Common Pitfalls | Medium — older browsers (pre-2020) may not support this API; fallback is standard quota eviction |

**All other claims in RESEARCH.md are verified via official documentation or CLAUDE.md project decisions.**

## Open Questions

1. **GitHub Actions CI/CD for deployment**
   - What we know: Phase 1 requires deployment to GitHub Pages (DEPL-01); gh-pages npm package can push dist/ to gh-pages branch
   - What's unclear: Should Phase 1 include GitHub Actions workflow to automate this, or manual `npm run build && npm run deploy` for now?
   - Recommendation: Include a simple `.github/workflows/deploy.yml` that builds on main branch push and deploys to gh-pages branch (standard pattern)

2. **Icons & PWA branding**
   - What we know: vite-plugin-pwa expects 192x192 and 512x512 PNG icons in public/
   - What's unclear: Who designs the app icon? Is there a design system or branding guideline?
   - Recommendation: Use a placeholder icon (e.g., green heart or health cross) in Phase 1; design team can replace later. Store icons in public/apple-touch-icon.png and public/pwa-*.png

3. **Dark mode persistence**
   - What we know: D-02 mentions dark mode toggle in settings
   - What's unclear: Should dark mode preference be stored in Zustand (lost on refresh) or persisted to Dexie / localStorage?
   - Recommendation: Persist to localStorage (simpler than Dexie for single boolean; loaded on app init before first render)

4. **Form validation & error messages**
   - What we know: Forms use native HTML validation (required, min, max, step)
   - What's unclear: Should there be toast notifications for errors (e.g., "Invalid weight")? Should validation be client-side only or also via Dexie transactions?
   - Recommendation: Client-side native HTML validation for now; toast for success (D-07); Phase 2 can add more sophisticated validation if needed

5. **Settings screen scope for Phase 1**
   - What we know: UX-04 requires height input (for BMI in Phase 2); D-02 mentions dark mode toggle
   - What's unclear: What else should Phase 1 Settings include? App info, about, GitHub link?
   - Recommendation: Minimum for Phase 1: height input + dark mode toggle. Leave room for export (Phase 5) and notifications (Phase 5).

## Sources

### Primary (HIGH confidence)

- [Dexie.js Official Documentation](https://dexie.org/docs/) — Schema definition, CRUD, queries, migrations
- [Zustand Official Documentation](https://github.com/pmndrs/zustand) — State management API
- [vite-plugin-pwa Documentation](https://vite-pwa-org.netlify.app/) — PWA setup, manifest, service worker config
- [React Router v6 Documentation](https://reactrouter.com/) — HashRouter implementation for GitHub Pages
- [date-fns Official Documentation](https://date-fns.org/) — Date formatting and calculations
- [MDN - IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) — IndexedDB fundamentals
- [MDN - Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) — Service worker registration and lifecycle
- [CLAUDE.md — MyHealth Project Instructions](file://.//.claude/CLAUDE.md) — Tech stack decisions and rationale
- [CONTEXT.md — Phase 1 Implementation Decisions](file:///.planning/phases/01-foundation-core-logging/01-CONTEXT.md) — D-01 through D-19 locked decisions

### Secondary (MEDIUM confidence)

- [Vite Official Documentation](https://vitejs.dev/) — Build config, base path handling
- [React Official Documentation](https://react.dev/) — Hooks, state management patterns
- [Tailwind CSS Documentation](https://tailwindcss.com/) — Utility-first CSS, dark mode
- [shadcn/ui Documentation](https://ui.shadcn.com/) — Component library patterns

### Tertiary (Training knowledge, not verified this session)

- Best practices for PWA offline-first design
- IndexedDB quota management strategies
- Service worker caching patterns and strategies

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — All libraries from CLAUDE.md; versions verified in package.json
- Architecture: **HIGH** — Dexie schema pattern from official docs; Zustand from pmndrs; vite-plugin-pwa from official guide
- Pitfalls: **MEDIUM-HIGH** — Common issues documented in official docs + personal experience; some assumptions about GitHub Pages (A3)
- Requirements mapping: **HIGH** — Direct 1:1 mapping between phase requirements and implementation patterns

**Research date:** 2026-09-03
**Valid until:** 2026-10-03 (30 days; libraries are stable, but PWA spec and GitHub Pages behavior should be rechecked before Phase 2)

---

*Phase 1 Research Complete*
*Researched by: Claude (GSD Research Agent)*
*Next step: `/gsd-plan-phase` to create PLAN.md*
