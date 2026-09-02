# Architecture: Browser-Only Health Tracking PWA

**Domain:** Offline-first Progressive Web App (client-side only)  
**Researched:** 2026-09-02  
**Confidence:** HIGH (based on established PWA patterns, IndexedDB best practices, and React/Vite ecosystem standards)

---

## System Overview

This is a **three-layer browser architecture**: UI (React), Services (business logic + local repositories), and Data (IndexedDB). A service worker handles offline assets and enables background sync. No backend exists—all data is device-local.

```
┌──────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE LAYER (React)                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │  Dashboard   │ │ Metrics View │ │ History View │             │
│  │  (Summary)   │ │ (Charts)     │ │ (Logs)       │             │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘             │
│         │                │                │                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ Input Forms  │ │   Settings   │ │  Import/Exp  │             │
│  │ (Log entries)│ │ (Targets,    │ │ (Data I/O)   │             │
│  │              │ │  Exercises)  │ │              │             │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘             │
└─────────┼──────────────────┼──────────────────┼───────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│                   SERVICES LAYER (Business Logic)                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Repositories (Metric, Exercise, Target, Journal Repos)     │  │
│  │ Each repo handles queries, inserts, updates for its domain │  │
│  └──────────────────────────┬─────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Sync Service (watches mutations, queues offline ops)       │  │
│  │ Import Service (Samsung Health ZIP parsing + insertion)    │  │
│  │ Export Service (JSON/CSV generation from IndexedDB)        │  │
│  │ Calculation Service (BMI, targets, pace, streaks)          │  │
│  └────────────────────────────┬────────────────────────────────┘ │
└─────────────────────────────────┼────────────────────────────────┘
                                  ↓
┌──────────────────────────────────────────────────────────────────┐
│              DATA ACCESS LAYER (IndexedDB via Dexie)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Metrics  │ │Exercises │ │ Sessions │ │  Targets │            │
│  │ (weight, │ │(types,   │ │(training │ │(goals,   │            │
│  │ sleep,   │ │configs)  │ │ logs)    │ │deadlines)│            │
│  │ steps,   │ │          │ │          │ │          │            │
│  │ water,   │ │          │ │          │ │          │            │
│  │ hr)      │ │          │ │          │ │          │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Journal (free-text entries per date)                     │   │
│  │ Metadata (app version, last sync timestamp)              │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                                  ↓
┌──────────────────────────────────────────────────────────────────┐
│       SERVICE WORKER (Asset caching + offline support)           │
│  Caches: static HTML/CSS/JS (cache-first)                       │
│  Index data: available for offline use                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|---|---|
| **UI Components (Dashboard, Metrics, History, Settings)** | Render views, handle user interactions | React functional components with hooks |
| **Input Components (LogForm, TargetModal, ExerciseEditor)** | Collect data, validate, dispatch to repos | Controlled components, form state management |
| **Metric Repository** | Query/insert weight, sleep, steps, water, heart rate | Dexie table operations with filtering |
| **Exercise Repository** | Manage exercise types (CRUD), linked to sessions | Dexie relationships (one-to-many) |
| **Session Repository** | Log training sessions (date, exercises, details) | Dexie queries with exercise lookups |
| **Target Repository** | Store goals (metric, target value, deadline) | Dexie with date-based queries |
| **Journal Repository** | Store optional free-text notes per day | Dexie keyed by date |
| **Sync Service** | Monitor changes, queue operations for background replay | Watches mutations, uses Background Sync API |
| **Import Service** | Parse Samsung Health ZIP → CSV → insert to IndexedDB | ZIP extraction, CSV parsing, batch inserts |
| **Export Service** | Generate JSON/CSV dumps from IndexedDB | Dexie.toArray() with formatting |
| **Calculation Service** | BMI, target pace, streaks, personal bests | Pure functions reading from repos |
| **Service Worker** | Cache static assets, enable offline access | Workbox or manual strategy (cache-first) |

---

## Recommended Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   └── AppShell.tsx
│   ├── views/
│   │   ├── Dashboard.tsx          # Summary + today's snapshot
│   │   ├── MetricsView.tsx        # Charts per metric (weight, sleep, etc.)
│   │   ├── HistoryView.tsx        # Scrollable log of entries
│   │   └── SettingsView.tsx       # Targets, exercises, import/export, app settings
│   ├── forms/
│   │   ├── LogMetricForm.tsx      # Log weight, sleep, steps, water, HR
│   │   ├── LogSessionForm.tsx     # Log training session with exercises
│   │   ├── TargetModal.tsx        # Set/edit metric targets
│   │   └── ExerciseEditor.tsx     # Create/edit custom exercises
│   └── charts/
│       ├── MetricChart.tsx        # Line/bar chart wrapper (Recharts)
│       ├── HeatmapChart.tsx       # GitHub-style activity heatmap
│       └── ProgressBar.tsx        # Target progress visualization
├── data/
│   ├── db.ts                      # Dexie database schema and instance
│   ├── repositories/
│   │   ├── MetricRepository.ts    # Query/insert metrics (polymorphic table)
│   │   ├── ExerciseRepository.ts  # Exercise type management
│   │   ├── SessionRepository.ts   # Training session logs
│   │   ├── TargetRepository.ts    # Goals and deadlines
│   │   └── JournalRepository.ts   # Daily notes
│   └── schema.ts                  # TypeScript interfaces for all tables
├── services/
│   ├── SyncService.ts             # Offline mutations + background sync
│   ├── ImportService.ts           # Samsung Health ZIP parser
│   ├── ExportService.ts           # JSON/CSV generation
│   ├── CalculationService.ts      # BMI, pace, streaks, PBs
│   └── NotificationService.ts     # Push notifications (PWA)
├── hooks/
│   ├── useMetrics.ts              # Custom hook for metric queries
│   ├── useSessions.ts             # Custom hook for session logs
│   ├── useTargets.ts              # Custom hook for target progress
│   ├── useOnline.ts               # Track online/offline status
│   └── useSyncStatus.ts           # Monitor sync queue
├── utils/
│   ├── formatters.ts              # Date, number, unit formatting
│   ├── validators.ts              # Input validation (weight, date, etc.)
│   ├── constants.ts               # Default exercises, metric names
│   └── samsung-health-parser.ts   # CSV parsing utilities
├── types/
│   └── index.ts                   # Shared TypeScript types
├── styles/
│   └── globals.css                # Tailwind or CSS Modules
├── App.tsx                        # Root component
├── main.tsx                       # React entry point
└── service-worker.ts              # Service worker registration + offline strategy

public/
├── manifest.json                  # PWA manifest (icons, name, etc.)
├── robots.txt
└── icons/                         # App icons (192x192, 512x512, etc.)
```

### Structure Rationale

- **components/ → views/**: Feature-focused views avoid a flat component directory getting unwieldy. Each view is self-contained.
- **components/ → forms/ & charts/**: Reusable form and chart components can be composed by multiple views without coupling to a specific page.
- **data/ → repositories/**: Repository pattern isolates database queries from business logic. Each table gets its own repository for clear responsibility.
- **services/**: Stateful services (sync, import) and pure utilities (calculations, export) live together but clearly separated by naming.
- **hooks/**: Custom React hooks encapsulate data-fetching patterns (e.g., `useMetrics()` queries + subscribes to changes).
- **utils/ & types/**: Shared utilities and TypeScript definitions prevent duplication.

---

## Architectural Patterns

### Pattern 1: Repository Pattern (Data Access)

**What:** Each IndexedDB table (metrics, exercises, sessions, targets, journal) has a corresponding repository class that encapsulates all queries and mutations.

**When to use:** Whenever business logic needs to read or write data. The repository is the **single source of truth** for database operations.

**Trade-offs:**  
✓ Isolates business logic from database specifics (if you swap Dexie for another storage, only repos change)  
✓ Makes testing easier (mock repos for unit tests)  
✓ Clear contract between UI and data layer  
✗ Slight boilerplate (one class per table); justified by clarity

**Example:**
```typescript
// data/repositories/MetricRepository.ts
import { db } from '../db';

export class MetricRepository {
  async logMetric(type: 'weight' | 'sleep' | 'steps' | 'water' | 'heart_rate', 
                  value: number, date: Date) {
    return db.metrics.add({
      type,
      value,
      date: startOfDay(date),
      createdAt: new Date(),
    });
  }

  async getMetricsByType(type: string, startDate: Date, endDate: Date) {
    return db.metrics
      .where('type').equals(type)
      .and(m => m.date >= startDate && m.date <= endDate)
      .toArray();
  }

  subscribe(type: string, callback: (metrics: Metric[]) => void) {
    // Dexie live query pattern
    db.metrics
      .where('type').equals(type)
      .toArray()
      .then(callback);
    return () => { /* unsubscribe */ };
  }
}

// In a component:
const metricRepo = new MetricRepository();
const [weights, setWeights] = useState<Metric[]>([]);

useEffect(() => {
  const unsubscribe = metricRepo.subscribe('weight', setWeights);
  return unsubscribe;
}, []);
```

### Pattern 2: Service Worker Cache-First for Assets

**What:** Static assets (HTML, CSS, JS, images) are served from cache; if not found, fetch from network. This makes the app instant to load on repeat visits and works fully offline.

**When to use:** PWAs with static deployment (GitHub Pages). Especially important for mobile where network is unreliable.

**Trade-offs:**  
✓ Lightning-fast load times  
✓ Works offline completely  
✗ Cache invalidation requires versioning or a hash-based approach (Vite does this automatically)  
✗ User sees stale content until next hard refresh or cache is manually cleared

**Example:**
```typescript
// service-worker.ts
const CACHE_NAME = 'myhealth-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  // Vite will auto-hash these, so they're versioned
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Cache-first: try cache, fall back to network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### Pattern 3: Sync Service + Background Sync API

**What:** When a user logs data offline, mutations are queued in IndexedDB. When connectivity returns, the Sync Service replays them (in this case, just confirms they're in IndexedDB, since there's no backend). A Web Notification confirms the sync completed.

**When to use:** Any offline-first app. Ensures no data is lost even if the app is closed while offline.

**Trade-offs:**  
✓ Transparent to the user; no "please go online" messages  
✓ Data safety: mutations are durable before UI confirms  
✗ Requires careful conflict resolution if same entry is edited multiple times (less of a concern here, single user)

**Example:**
```typescript
// services/SyncService.ts
export class SyncService {
  private syncQueue: SyncOperation[] = [];

  async queueMutation(op: SyncOperation) {
    this.syncQueue.push(op);
    await db.syncQueue.add(op); // Persist the queue
    
    // Attempt immediate sync; if offline, Background Sync API will retry
    if (navigator.onLine) {
      await this.processSyncQueue();
    } else {
      // Browser will call processSyncQueue when connectivity returns
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.sync.register('sync-queue');
        });
      }
    }
  }

  private async processSyncQueue() {
    for (const op of this.syncQueue) {
      await this.applyMutation(op);
    }
    this.syncQueue = [];
    await db.syncQueue.clear();
    
    // Notify user
    if ('serviceWorker' in navigator && 'Notification' in window) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification('Data synced', {
        body: 'Your health data has been saved.',
        icon: '/icons/icon-192x192.png',
      });
    }
  }
}
```

### Pattern 4: Polymorphic Metric Table

**What:** Rather than separate tables for weight, sleep, steps, water, and heart rate, one `metrics` table with a `type` column lets you query any metric with the same code.

**When to use:** Whenever you have many similar entity types. Avoids code duplication and makes new metrics trivial to add.

**Trade-offs:**  
✓ Scalable: add a new metric (e.g., "blood_pressure") without touching the schema  
✓ Single query interface for all metrics  
✗ Slightly less type-safe (you guard on `type` at runtime); mitigated by TypeScript unions

**Example:**
```typescript
// data/schema.ts
export type MetricType = 'weight' | 'sleep' | 'steps' | 'water' | 'heart_rate';

export interface Metric {
  id?: number;
  type: MetricType;
  value: number;        // kg, hours, steps, ml, bpm
  date: Date;           // Date (no time component)
  unit: string;         // 'kg', 'h', 'steps', 'ml', 'bpm'
  createdAt: Date;
  updatedAt?: Date;
}

// In repository:
async getMetricsForRange(type: MetricType, start: Date, end: Date) {
  return db.metrics
    .where('type').equals(type)
    .and(m => m.date >= startOfDay(start) && m.date <= endOfDay(end))
    .toArray();
}
```

---

## IndexedDB Schema Design

### Database: `myhealth` (Dexie instance)

```typescript
import Dexie, { Table } from 'dexie';

export interface Metric {
  id?: number;
  type: 'weight' | 'sleep' | 'steps' | 'water' | 'heart_rate';
  value: number;
  date: Date;
  unit: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Exercise {
  id?: number;
  name: string;           // e.g., "Push-ups", "Squash"
  category: string;       // e.g., "strength", "cardio", "sport"
  isCustom: boolean;      // false for defaults (push-ups, squats, etc.)
  createdAt: Date;
}

export interface ExerciseLog {
  id?: number;
  sessionId: number;      // FK to Session
  exerciseId: number;     // FK to Exercise
  reps?: number;
  sets?: number;
  duration?: number;      // minutes
  intensity?: 1 | 2 | 3 | 4 | 5; // effort level
  notes?: string;
}

export interface Session {
  id?: number;
  date: Date;             // Date only (no time)
  exercises: ExerciseLog[]; // Expanded from DB
  squashMetadata?: {      // Only if a squash session
    opponent?: string;
    result: 'win' | 'loss';
    score?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Target {
  id?: number;
  metricType: 'weight' | 'sleep' | 'steps' | 'water' | 'exercise_frequency';
  targetValue: number;
  deadline: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Journal {
  id?: number;
  date: Date;             // Unique per date
  note: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface SyncOperation {
  id?: number;
  operationType: 'create' | 'update' | 'delete';
  tableName: string;
  data: any;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

export interface AppMetadata {
  id?: number;
  key: string;            // e.g., 'lastSyncTime', 'appVersion'
  value: string;
  updatedAt: Date;
}

export class MyHealthDB extends Dexie {
  metrics!: Table<Metric>;
  exercises!: Table<Exercise>;
  sessions!: Table<Session>;
  targets!: Table<Target>;
  journal!: Table<Journal>;
  syncQueue!: Table<SyncOperation>;
  metadata!: Table<AppMetadata>;

  constructor() {
    super('myhealth');
    this.version(1).stores({
      metrics: '++id, type, date',        // Indexed by type & date for range queries
      exercises: '++id, isCustom',
      sessions: '++id, date',
      targets: '++id, metricType, deadline',
      journal: '++id, date',
      syncQueue: '++id, status',
      metadata: '++id, key',              // Unique key for metadata
    });
  }
}

export const db = new MyHealthDB();
```

### Key Design Decisions

- **Metrics as polymorphic table**: One `type` column instead of separate tables for weight, sleep, etc. Scalable and DRY.
- **Session ↔ ExerciseLog**: Sessions contain a list of exercises. ExerciseLog is normalized (FK back to Session) to avoid duplicates if an exercise appears in multiple sessions.
- **Date-only, no time**: All logged data is per-calendar-day (no hourly granularity). Simplifies querying and UI.
- **SyncQueue table**: Persists mutations that occurred offline; processed when connectivity returns.
- **AppMetadata table**: Stores version, last import timestamp, user settings (not covered by other tables).

---

## Data Flow

### Flow 1: Log a Metric (e.g., Weight Entry)

```
User fills weight form (e.g., 75.5 kg) and taps "Log"
  ↓
LogMetricForm submits to MetricRepository.logMetric()
  ↓
Repository inserts to IndexedDB (db.metrics.add(...))
  ↓
If online: SyncService detects change, marks sync-complete
If offline: SyncService queues the operation, will retry on reconnect
  ↓
UI hook (useMetrics) subscribes to changes, re-renders chart
  ↓
User sees the new data point on the weight chart
```

### Flow 2: Import Samsung Health ZIP

```
User selects Samsung Health ZIP file from device storage
  ↓
FileInput triggers ImportService.parseAndImport(file)
  ↓
Service extracts ZIP in memory (using JSZip or native unzip)
  ↓
CSV parser reads the 19 CSV files (e.g., com.samsung.shealth.step_count.csv)
  ↓
For each row:
  - Map Samsung field names to MetricRepository schema
  - Handle timestamp offsets (Samsung stores UTC + offset)
  - Batch insert to IndexedDB (tx.metrics.bulkAdd(...))
  ↓
After import completes:
  - Update AppMetadata.lastImportTime
  - Show user: "Imported 500 weight entries, 400 steps, ..."
  - UI hooks re-fetch data, charts refresh
```

### Flow 3: Export as JSON (Backup)

```
User taps "Export as JSON"
  ↓
ExportService.toJSON() called:
  - Queries all tables (metrics, sessions, targets, journal)
  - Serializes to JSON with dates as ISO strings
  - Triggers browser download
  ↓
File saved as: myhealth_backup_2026-09-02.json
```

### Flow 4: Offline Edit + Sync

```
User logs a training session while gym has no WiFi
  ↓
LogSessionForm submits to SessionRepository.createSession()
  ↓
SyncService.queueMutation({ operationType: 'create', tableName: 'sessions', ... })
  ↓
Mutation persisted to syncQueue table in IndexedDB
  ↓
UI confirms: "Session logged (syncing when online)"
  ↓
Browser regains connectivity
  ↓
Service Worker or Background Sync API triggers sync
  ↓
SyncService.processSyncQueue() runs:
  - Replays each queued mutation
  - Updates IndexedDB (data is already there, so this is a no-op in single-user case)
  - Clears syncQueue table
  ↓
User gets notification: "Data synced"
```

---

## Service Worker Strategy

### Offline Asset Caching

For a GitHub Pages deployment, the service worker should:

1. **On install**: Cache all static assets (index.html, main.js, style.css, icon images)
2. **On fetch**: Use **cache-first** strategy
   - Check cache first
   - If found, return cached version
   - If not found, try network (for updates)
   - If network fails, return offline fallback (if applicable)

### Offline Data Access

- **Service Worker cannot access IndexedDB directly** (it runs in a different global scope).
- Instead: App components read from IndexedDB and render UI based on cached data.
- Service Worker caches HTML/CSS/JS; IndexedDB caches **application data**.

### Background Sync

When user is offline and makes a change:
1. SyncService queues the mutation in IndexedDB (syncQueue table).
2. If available, register with ServiceWorkerContainer.ready.sync:

```typescript
navigator.serviceWorker.ready.then((reg) => {
  reg.sync.register('sync-queue');
});
```

3. When connectivity returns, the browser fires a `sync` event in the service worker.
4. Service worker wakes up and calls a handler that processes the queue.

---

## Samsung Health Import Pipeline

### CSV Files to Parse

Samsung Health exports contain these CSVs:

| CSV File | Maps to | Notes |
|----------|---------|-------|
| com.samsung.shealth.step_count.csv | Metric (steps) | Daily step count |
| com.samsung.shealth.weight.csv | Metric (weight) | Weight entries + BMI |
| com.samsung.shealth.sleep_data.csv | Metric (sleep) | Sleep duration |
| com.samsung.shealth.heart_rate.csv | Metric (heart_rate) | Resting/peak HR |
| com.samsung.shealth.exercise.csv | Session + ExerciseLog | Logged workouts |

### Parsing Logic

```typescript
// services/ImportService.ts
export async function parseAndImport(zipFile: File) {
  const zip = await JSZip.loadAsync(zipFile);
  
  // Parse steps
  const stepsCSV = await zip.file('com.samsung.shealth.step_count.csv').async('string');
  const stepsRows = parseSamsungCSV(stepsCSV);
  for (const row of stepsRows) {
    const date = parseTimestamp(row.start_time, row.time_offset);
    await db.metrics.add({
      type: 'steps',
      value: parseInt(row.value),
      date: startOfDay(date),
      unit: 'steps',
      createdAt: new Date(),
    });
  }
  
  // Parse weight
  const weightCSV = await zip.file('com.samsung.shealth.weight.csv').async('string');
  const weightRows = parseSamsungCSV(weightCSV);
  for (const row of weightRows) {
    await db.metrics.add({
      type: 'weight',
      value: parseFloat(row.weight),
      date: startOfDay(new Date(row.create_time)),
      unit: 'kg',
      createdAt: new Date(),
    });
  }
  
  // ... similar for sleep, heart_rate, and exercises
  
  // Update metadata
  await db.metadata.put({
    key: 'lastImportTime',
    value: new Date().toISOString(),
    updatedAt: new Date(),
  });
}
```

### Timestamp Handling

Samsung Health stores timestamps as UTC milliseconds + a separate `time_offset` field. Example:

```
start_time: 1693526400000  (UTC)
time_offset: 7200           (seconds ahead of UTC, e.g., +02:00)

Actual local time = UTC + offset
```

Parse carefully to avoid double-counting entries when timezone-aware.

---

## Build Order / Component Dependencies

Build the app in this sequence to respect dependencies:

1. **Data Layer** (foundation—nothing else works without it)
   - `data/schema.ts` — Type definitions
   - `data/db.ts` — Dexie instance + table initialization
   - `data/repositories/*` — CRUD operations

2. **Services** (depends on repositories)
   - `services/SyncService.ts`
   - `services/CalculationService.ts`
   - `services/ImportService.ts`
   - `services/ExportService.ts`

3. **React Hooks** (depends on services)
   - `hooks/useMetrics.ts`
   - `hooks/useSessions.ts`
   - `hooks/useTargets.ts`
   - `hooks/useOnline.ts` — tracks navigator.onLine

4. **UI Components** (depends on hooks + services)
   - Form components (LogMetricForm, LogSessionForm, TargetModal)
   - View components (Dashboard, MetricsView, HistoryView, SettingsView)
   - Chart components (MetricChart, HeatmapChart)

5. **PWA Setup** (depends on the app being ready)
   - `service-worker.ts` registration
   - `public/manifest.json`
   - App shell & root component (`App.tsx`, `main.tsx`)

6. **GitHub Pages Deployment**
   - `vite.config.ts` with `base: '/<REPO>/'` (or `/` for user site)
   - `npm run build` → pushes `/dist` to GitHub Pages

---

## Anti-Patterns

### Anti-Pattern 1: Direct Service Worker ↔ IndexedDB Communication

**What people do:** Try to access IndexedDB directly from the service worker to load cached data on demand.

**Why it's wrong:** Service workers run in a different global scope than the main thread. You can't use `db.metrics.toArray()` from a service worker—it will fail silently.

**Do this instead:** 
- Service worker caches only **static assets** (HTML, CSS, JS, images).
- Main thread (React) reads from IndexedDB and renders UI.
- Service worker wakes up when sync event fires, posts a message to the main thread, which processes the sync queue.

---

### Anti-Pattern 2: Naive Timestamp Handling for Samsung Health

**What people do:** Assume all timestamps in Samsung Health CSVs are in the local timezone; parse directly without considering `time_offset`.

**Why it's wrong:** Samsung stores UTC time + a separate offset. Ignoring the offset causes entries to be logged on the wrong date, especially after timezone changes or during travel.

**Do this instead:**
```typescript
function parseSamsungTimestamp(utcMs: number, offsetSeconds: number): Date {
  const date = new Date(utcMs);
  date.setSeconds(date.getSeconds() + offsetSeconds);
  return startOfDay(date); // Normalize to calendar day
}
```

---

### Anti-Pattern 3: Storing Everything in One IndexedDB Transaction

**What people do:** Import 500 metrics in a single long transaction to avoid partial failures.

**Why it's wrong:** Long transactions lock the database; UI becomes unresponsive. The browser may kill the transaction if it takes too long.

**Do this instead:**
```typescript
// Batch inserts with chunking
const BATCH_SIZE = 50;
for (let i = 0; i < metricsToImport.length; i += BATCH_SIZE) {
  const batch = metricsToImport.slice(i, i + BATCH_SIZE);
  await db.metrics.bulkAdd(batch);
  
  // Let other operations complete; avoid stalling the UI
  await new Promise(r => setTimeout(r, 0));
}
```

---

### Anti-Pattern 4: Forgetting to Handle Service Worker Cache Invalidation

**What people do:** Deploy a new version with bug fixes but the user's cached old JavaScript file is still running.

**Why it's wrong:** Vite auto-hashes asset filenames, but old service worker cache entries aren't cleared. User gets inconsistent behavior.

**Do this instead:**
```typescript
// service-worker.ts
const CACHE_NAME = 'myhealth-v1'; // Increment this manually on breaking changes

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete old cache versions
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});
```

---

### Anti-Pattern 5: Unvalidated Samsung Health Import

**What people do:** Import a ZIP file without validating CSV structure; assume all expected columns exist.

**Why it's wrong:** Samsung Health format changes between app versions. Missing or renamed columns cause silent failures or crashes.

**Do this instead:**
```typescript
function validateSamsungCSVColumns(headers: string[], required: string[]) {
  const missing = required.filter(h => !headers.includes(h));
  if (missing.length > 0) {
    throw new Error(`Samsung Health CSV missing columns: ${missing.join(', ')}`);
  }
}

// Call before parsing
const headers = stepsCSV.split('\n')[0].split(',');
validateSamsungCSVColumns(headers, ['start_time', 'value']);
```

---

## Scaling Considerations

For a **single-user, device-local app**, scaling isn't about database concurrency—it's about UI performance as data grows.

| Data Size | Architecture Adjustments |
|-----------|--------------------------|
| 0–1 month of daily logging (30 entries) | No adjustments needed; IndexedDB is plenty fast. |
| 3–12 months (100–500 entries) | Implement lazy-loading in HistoryView (virtual scrolling for lists). Use IndexedDB range queries to load only visible date ranges. |
| 1–5 years of data (500–2000 entries) | Add pagination or infinite scroll in views. Recharts may slow on >1000 data points; consider downsampling for yearly charts (e.g., weekly aggregates). |
| 5+ years (2000+ entries) | Consider archiving old sessions to a separate "archive" table; load on demand. Pre-compute monthly summaries to speed up dashboard. |

### Performance Priorities

1. **First bottleneck:** Chart rendering with >1000 data points.
   - **Fix:** Recharts `isAnimationActive={false}` on large datasets. Downsample data for yearly views (aggregate to weeks/months).

2. **Second bottleneck:** Scrolling through 1000+ history entries.
   - **Fix:** Implement react-window or similar virtual scrolling. Paginate or use infinite scroll.

3. **Third bottleneck:** IndexedDB transaction time during import.
   - **Fix:** Batch large imports into chunks (already documented above).

---

## Integration Points

### External Service: Samsung Health

| Integration | Pattern | Notes |
|-------------|---------|-------|
| ZIP import | File input → ImportService.parseAndImport → IndexedDB | Happens at import time; no ongoing sync |

### Internal Boundary: UI ↔ Data Layer

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Components → Repositories | Method calls (async/await) | Components call `metricRepo.logMetric()`, etc. No event bus; explicit. |
| Repositories → IndexedDB | Dexie API (queries, inserts, subscriptions) | Repositories own the DB schema. |
| UI ↔ Service Worker | postMessage API (if needed for sync status) | Service worker syncs in background; posts results to UI. |

---

## Recommended Tech Stack (for Implementation Phase)

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| **UI Framework** | React | 18+ | Ecosystem, JSX, hooks maturity |
| **Build Tool** | Vite | 5+ | Fast dev server, GitHub Pages compatible, auto-hash assets |
| **Charting** | Recharts | 2+ | React-first, composable, good defaults |
| **Database** | IndexedDB (via Dexie) | Dexie 4+ | Type-safe, Promise-based, live queries |
| **Styling** | Tailwind CSS or CSS Modules | Latest | Mobile-first, responsive utilities |
| **Service Worker** | Workbox or manual | Workbox 7+ | Auto-generates cache strategies, simplifies PWA setup |
| **File Handling** | JSZip | 3+ | Parse Samsung Health ZIPs in-browser |
| **CSV Parsing** | papaparse | 5+ | Handles Samsung Health CSV quirks |

---

## Sources

- [Building True Offline-First PWAs: Architecture Patterns That Actually Work](https://alamb-hex.github.io/blog/2026/01/21/building-true-offline-first-pwas/)
- [Building an Offline-First React App - A Complete Guide to PWA Implementation](https://dalenguyen.me/blog/2026-01-18-building-offline-first-react-app-complete-pwa-guide/)
- [Offline React Apps with IndexedDB](https://www.sparkleweb.in/blog/how_to_build_offline-first_react_apps_using_indexeddb_and_service_workers)
- [How to Design a Database for Health and Fitness Tracking Applications](https://www.geeksforgeeks.org/dbms/how-to-design-a-database-for-health-and-fitness-tracking-applications/)
- [Strategies for Service Worker Caching for Progressive Web Apps](https://hasura.io/blog/strategies-for-service-worker-caching-d66f3c828433/)
- [How to Implement Service Workers for Offline Support in React](https://oneuptime.com/blog/post/2026-01-15-service-workers-offline-support-react/view)
- [From Development to Deployment: Deploying Vite React App on GitHub Pages](https://medium.com/@takachan0012/from-development-to-deployment-a-comprehensive-guide-to-deploying-your-vite-react-app-on-github-1e04530bfa79)
- [Extract Health Data From Your Samsung Device](https://medium.com/data-science/extract-health-data-from-your-samsung-96b8a2e31978)
- [How to extract your personal Samsung Health data](https://medium.com/@dimshik100/how-to-extract-your-personal-samsung-health-data-514bbe2331f7)
- [Deploying a Static Site (Vite Documentation)](https://vite.dev/guide/static-deploy)

---

**Architecture research for:** Browser-only, offline-first health tracking PWA  
**Researched:** 2026-09-02  
**Next step:** Use this architecture as the basis for component planning in Phase 1 (MVP scope definition).
