# Technology Stack

**Project:** MyHealth (health/fitness tracking PWA)  
**Researched:** 2026-09-02  
**Overall Confidence:** HIGH

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 18.2+ | UI component library | Already chosen; excellent component patterns for data visualization and state management |
| Vite | 5.0+ | Build tool & dev server | Fast HMR, excellent GitHub Pages support via `vite build` + base path config, smaller bundle than Create React App |
| TypeScript | 5.3+ | Type safety | Optional but recommended for IndexedDB schema definitions and component props; catches data bugs early |

### Data Storage & Persistence

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Dexie.js | 4.0+ | IndexedDB wrapper | Rich query API, typed tables, transaction handling, schema versioning, dexie-react-hooks for live re-renders. Better than raw IndexedDB for complex health data; better than idb for this use case despite being larger, because schema versioning and rich queries matter more than micro-optimizing bundle size |
| IndexedDB API | Native | Persistent browser storage | No server required; full data ownership; offline-first capability; all data stored locally on device |

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 4.4+ | Global state management | Only 1KB, zero boilerplate, hooks-based API matches React 18 patterns. Modern alternative to Redux/Context for this mid-complexity app. Handles dashboard state, filters, user settings cleanly without the ceremony of Redux or the re-render pitfalls of Context |

### Data Visualization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Recharts | 2.10+ | React charting library | Component-based, SVG-rendered, lightweight D3 submodules (not entire D3), excellent documentation, ideal for health dashboards with line/bar/area charts, responsive by default |

### UI & Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 3.4+ | Utility-first CSS framework | Zero-runtime overhead, tree-shakeable, dark mode support built-in, mobile-first by design, pairs perfectly with shadcn/ui |
| shadcn/ui | Latest | Component library (optional base) | Copy-paste component code into repo, full control over component implementation, built on Radix UI primitives + Tailwind, no version lock-in, modern 2025 preference over Material-UI |

### Date & Time Handling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| date-fns | 3.0+ | Date manipulation library | Functional API (not chainable), excellent tree-shaking (only import needed functions), 13KB but reduces to 2-3KB with selective imports, comprehensive timezone handling via plugins, stronger than dayjs for modern bundlers and tree-shaking benefits |

### PWA & Offline Support

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| vite-plugin-pwa | 0.17+ | PWA setup automation | Generates service worker, web manifest, precache configuration from Vite build; handles offline strategies; registerType: 'autoUpdate' enables seamless updates |
| Service Worker API | Native | Network interception & caching | Enables offline app functionality, background sync, push notifications (future) |

### Data Import/Export

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| JSZip | 3.10+ | ZIP file parsing | Required for Samsung Health export (ZIP containing CSV files); smaller alternative to AdmZip; streaming support |
| react-papaparse | 4.4+ | CSV import/export | React wrapper around Papa Parse; fastest browser CSV parser; built-in drag-and-drop CSVReader component; CSVDownloader for export; handles edge cases (quoted fields, escapes) |

### Deployment & Hosting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| GitHub Pages | N/A | Static site hosting | Free, integrated with git workflow, no server needed, vite base path config handles routing correctly |
| gh-pages | 6.0+ | Deploy tool | npm package that pushes build folder to gh-pages branch; standard for React on GitHub Pages |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| IndexedDB Wrapper | Dexie.js | idb (Jake Archibald) | idb is thinner (1KB) but offers no schema versioning, no rich queries. For a health app with evolving data structure (new metrics added over time), Dexie's schema migration tools are essential |
| IndexedDB Wrapper | Dexie.js | localForage | localForage is simpler but designed for key-value caching, not relational queries. Health data requires filtering by date range, metric type, and values — Dexie's query API is necessary |
| State Management | Zustand | Redux | Redux is industry-standard but over-engineered for this app. No need for middleware, dev tools, or immutable patterns; Zustand's simplicity + hooks match React 18 better |
| State Management | Zustand | Context API | Context API re-renders entire tree when any value changes; problematic at scale. Zustand with selector hooks prevents unnecessary renders |
| Charting | Recharts | Chart.js (canvas) | Canvas-based libraries are faster for real-time data but harder to customize per-bar styling. SVG (Recharts) is more flexible for health dashboards and interactivity |
| Charting | Recharts | nivo | nivo is powerful but designed for complex dashboards; overkill for this app; larger bundle |
| Charting | Recharts | Victory | Victory has good mobile support but weaker docs than Recharts; less commonly used in health/fitness domain |
| UI Library | shadcn/ui | Material-UI (MUI) | MUI enforces Material Design (Google's design system); requires npm dependency updates. shadcn/ui copies components into repo, giving full control and avoiding version lock-in. Modern 2025 preference |
| UI Library | Tailwind CSS | CSS-in-JS (emotion/styled-components) | CSS-in-JS adds runtime overhead and bundle size. Tailwind's utility approach is faster, has better dark mode support, and matches shadcn/ui design patterns |
| Date Library | date-fns | dayjs | dayjs is smaller (2KB) but lacks comprehensive timezone plugins and doesn't benefit as much from tree-shaking. For a tracking app with date ranges and calculations, date-fns' functional API is cleaner |
| Date Library | date-fns | Temporal | Temporal (TC39 proposal) not yet standardized; not production-ready; too immature for 2025 PWA |
| CSV Export | react-papaparse | csv-download | csv-download is minimal but less flexible for parsing edge cases; react-papaparse handles quoted fields, escapes, and custom headers |
| ZIP Parsing | JSZip | AdmZip | Both are viable; JSZip is lighter and has better streaming support for large Samsung Health exports |

## Installation & Configuration

### Core Dependencies

```bash
npm install react@18 react-dom@18 vite typescript
npm install zustand dexie recharts date-fns
npm install tailwindcss postcss autoprefixer
npm install jszip react-papaparse
npm install vite-plugin-pwa
```

### Dev Dependencies

```bash
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/react @types/react-dom
npm install -D gh-pages
```

### Optional UI Components (if using shadcn/ui)

```bash
npx shadcn-ui@latest init
# Then add specific components as needed:
# npx shadcn-ui@latest add card
# npx shadcn-ui@latest add button
# npx shadcn-ui@latest add dialog
```

## Critical Configuration Checklist

### vite.config.ts

```typescript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'MyHealth',
        short_name: 'MyHealth',
        description: 'Personal health tracking PWA',
        theme_color: '#ffffff',
        icons: [
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  base: '/my-health/' // Set to your GitHub Pages repo name
})
```

### package.json

```json
{
  "homepage": "https://username.github.io/my-health",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

### Tailwind Configuration

```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: 'class'
}
```

## Performance Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Initial bundle size | <150 KB (gzipped) | PWA should be fast on mobile 3G; React + Vite + Recharts + Zustand achievable under this |
| Time to Interactive | <2s | Mobile health app; faster engagement |
| Service Worker cache hit | 100% for assets | Enable instant load after first visit |
| Dexie query latency | <50ms | IndexedDB queries on device should be instant; <1000 entries per metric year |

## Development Workflow

1. **Local development**: `npm run dev` → Vite HMR on http://localhost:5173
2. **PWA testing**: `npm run build` then `npm run preview` to test service worker locally
3. **Deploy to GitHub Pages**: `npm run deploy` → builds and pushes to `gh-pages` branch
4. **Update detection**: Service worker checks for updates on app launch; auto-reloads when new version available

## Known Limitations & Mitigations

| Limitation | Mitigation |
|-----------|-----------|
| GitHub Pages serves only static files; no Node.js backend | By design (privacy requirement); all data local via IndexedDB |
| IndexedDB quota (storage limit, typically 50-100 MB) | Sufficient for years of personal health data; users can export/backup as JSON before device storage full |
| Service worker scope limited to deployed path | Use `vite.config.ts` base path and `VitePWA` scope config to match |
| No automatic sync across devices | By design; manual export/import only (maintains privacy) |
| Dexie.js not as lightweight as raw IndexedDB | Runtime cost negligible; schema versioning + query API saves significant code complexity |

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Charting (Recharts) | HIGH | Explicit choice in PROJECT.md; confirmed best-fit for health dashboards in 2025 research |
| IndexedDB (Dexie.js) | HIGH | Strong consensus in 2025 sources; schema versioning essential for health tracking data evolution |
| State Management (Zustand) | HIGH | Modern consensus 2025; lightweight, hooks-based, no boilerplate |
| PWA Setup (vite-plugin-pwa) | HIGH | Official Vite integration; standard for offline-first PWAs |
| GitHub Pages Deployment | HIGH | Well-documented pattern; gh-pages + vite base config is stable and tested |
| UI (Tailwind + shadcn/ui) | MEDIUM-HIGH | Modern preference 2025; shadcn/ui rising trend; slight risk of component customization overhead if deeper styling needed |
| Date Handling (date-fns) | MEDIUM-HIGH | Excellent for new projects; tree-shaking advantage; no major risk |
| Data Import/Export (JSZip + react-papaparse) | HIGH | Both are mature, stable libraries; widespread use in React ecosystem |

## Sources

- [8 Best React Chart Libraries for Visualizing Data in 2025](https://embeddable.com/blog/react-chart-libraries)
- [Best React Chart Libraries to Use in 2025](https://www.creolestudios.com/top-react-chart-libraries/)
- [Best React chart libraries in 2026: Features, performance, and use cases](https://blog.logrocket.com/best-react-chart-libraries-2026/)
- [Best IndexedDB Wrapper - Compare Dexie, idb, localForage, PouchDB and RxDB](https://rxdb.info/articles/indexeddb/best-indexeddb-wrapper.html)
- [Dexie.js vs localForage vs idb 2026](https://www.pkgpulse.com/guides/dexie-vs-localforage-vs-idb-indexeddb-browser-storage-2026)
- [The Ultimate Guide to Transforming Vite Apps into Lightning-Fast PWAs with vite-plugin-pwa](https://www.blog.brightcoding.dev/2025/12/03/%F0%9F%9A%80-the-ultimate-guide-to-transforming-vite-apps-into-lightning-fast-pwas-with-vite-plugin-pwa/)
- [Vite Plugin PWA Documentation](https://vite-pwa-org.netlify.app/guide/)
- [Building an Offline-First React App - A Complete Guide to PWA Implementation](https://dalenguyen.me/blog/2026-01-18-building-offline-first-react-app-complete-pwa-guide)
- [Do You Need State Management in 2025? React Context vs Zustand vs Jotai vs Redux](https://dev.to/themachinepulse/do-you-need-state-management-in-2025-react-context-vs-zustand-vs-jotai-vs-redux-1ho)
- [How to Choose Between Context API, Redux, and Zustand for Your React App](https://oneuptime.com/blog/post/2026-01-15-choose-react-state-management-context-redux-zustand/view)
- [Shadcn/ui vs. Material UI: How to pick the right React component system](https://vercel.com/i/shadcn-vs-material-ui)
- [UI Component Libraries: 5 Must-Try Picks for Next.js in 2025](https://varbintech.com/blog/ui-component-libraries-5-must-try-picks-for-next-js-in-2025/)
- [Deploy Your Vite + React app on GitHub Pages](https://nikujais.medium.com/deploy-your-vite-react-app-on-github-pages-b52b2ad1edd2)
- [Deploy Your React App (Built with Vite) on GitHub Pages The Easy Way!](https://medium.com/@akhshyganesh/deploy-your-react-app-built-with-vite-on-github-pages-the-easy-way-668790061711)
- [Deploying a Vite React TypeScript app to Github Pages using GitHub Actions](https://levelup.gitconnected.com/deploying-a-vite-react-typescript-app-to-github-pages-using-github-actions-jest-and-pnpm-as-a-a3461ef9c4ad)
- [date-fns vs Day.js vs Luxon: Date Library Comparison 2026](https://reintech.io/blog/date-fns-vs-dayjs-vs-luxon-comparison-2026)
- [date-fns VS Day.js - compare differences](https://www.saashub.com/compare-date-fns-vs-day-js)
- [date-fns vs Day.js vs Luxon 2026: Best Date Library](https://www.pkgpulse.com/guides/best-javascript-date-libraries-2026)
- [Working with CSV files with react-papaparse](https://blog.logrocket.com/working-csv-files-react-papaparse/)
- [react-papaparse - GitHub](https://github.com/Bunlong/react-papaparse)
