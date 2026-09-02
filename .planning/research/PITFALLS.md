# Pitfalls Research: Health Tracking PWA (Browser-Only, IndexedDB, GitHub Pages)

**Domain:** Offline-first health tracking Progressive Web App
**Researched:** 2026-09-02
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: IndexedDB Data Loss Due to Browser Quota Eviction

**What goes wrong:**
User logs weeks of health data, then the browser clears IndexedDB without warning (especially on mobile Safari). All data vanishes. No backup, no recovery.

**Why it happens:**
- Mobile browsers allocate 50MB to all storage (vs. hundreds of MB on desktop)
- Browsers use LRU (least recently used) eviction policy when quota is exceeded
- iOS Safari especially has tight storage caps and aggressive eviction
- Developers often don't request persistent storage, so browsers treat data as "temporary" and deletable

**How to avoid:**
1. Call `navigator.storage.persist()` on first app load and after user creates their first entry — request persistent storage that won't be auto-evicted
2. Monitor storage quota: `navigator.storage.estimate()` in app initialization and warn user if quota is below 10MB
3. Implement automatic CSV export weekly to IndexedDB for backup (export-as-backup pattern)
4. Track total data size and implement pruning strategy: archive old years, compress historical data, or prompt user to export if approaching quota
5. Document in settings that users should export monthly as insurance

**Warning signs:**
- No `navigator.storage.persist()` call in initialization code
- No storage quota checking logic
- App works fine locally but data disappears after a week of use on mobile
- Users report "all my data is gone" after OS/app updates

**Phase to address:**
Phase 1 (MVP) — Critical. Must request persistent storage before shipping. Without this, project fails its core promise (data ownership).

---

### Pitfall 2: Service Worker Cache Invalidation and "Stuck" Updates

**What goes wrong:**
User updates the app (e.g., bug fix, new feature), but their browser still serves the old cached version. They reload, do hard refresh (Cmd+Shift+R), close the app, but still see the old version. Hours later it randomly updates. Users frustrated, think app is broken.

**Why it happens:**
- Service workers cache the entire app shell (HTML, JS, CSS) for offline support
- Cache is not automatically cleared on redeploy to GitHub Pages
- User's browser doesn't know a new version exists until service worker checks for updates (which happens in the background)
- Updates are applied on the *next* visit, not immediately (N+1 problem)
- GitHub Pages doesn't set cache-busting headers by default

**How to avoid:**
1. Use versioned cache names: `my-health-v1`, `my-health-v2` etc. Increment version on every deploy
2. Implement update check on app startup: service worker checks for new version every time app loads
3. Show "update available" prompt with "Reload" button if new version detected (do NOT force reload)
4. Use service worker skipWaiting to activate new version immediately after user clicks reload
5. In Vite build, hash all assets (Vite does this by default: `app.abc123.js`) so old and new versions don't conflict
6. Add meta tag `<meta http-equiv="Cache-Control" content="max-age=3600">` to index.html to prevent caching of HTML itself

**Warning signs:**
- Users report "app looks the same" after deploy
- Multiple users in Discord/issues report inconsistent behavior (some see v1, some see v2 features)
- Service worker never hits the update check code path
- Cache DB grows unbounded over time (never cleaned up)

**Phase to address:**
Phase 1 (MVP) — Must be correct before shipping. Service worker bugs are high-frustration bugs because they're invisible to developers (who always have DevTools open).

---

### Pitfall 3: Samsung Health CSV Import Fails on Encoding, Timestamp Format, or Column Naming Changes

**What goes wrong:**
User exports Samsung Health data (years of history), imports it into the app, and:
- Some rows silently skip (no error message)
- Timestamps are interpreted as null or wrong date
- Exercise entries have numeric codes instead of readable exercise names
- CSV parser dies on non-UTF-8 encoding (Windows-1252 from Excel)

**Why it happens:**
- Samsung Health CSV exports timestamps as milliseconds since Unix epoch (e.g., `1630708800000`), not ISO 8601
- Each timestamp has a separate timezone offset column; easy to miss
- Column names changed between Samsung Health versions (e.g., `Exercise_Type` vs `ExerciseType`)
- CSV encoding defaults to platform locale (Windows adds UTF-8 BOM, Excel strips it)
- No schema validation — parser accepts malformed rows and silently skips them

**How to avoid:**
1. **Timestamp parsing:** Always expect milliseconds since epoch; convert via `new Date(msValue)`; separately read timezone offset column and adjust if needed
2. **Column mapping:** Build a tolerance mapping layer: accept column variations (`Exercise_Type`, `ExerciseType`, `exercise type`) using fuzzy matching
3. **Encoding:** Always decode CSV as UTF-8 with BOM handling (`require('iconv-lite')` if needed); test with real Samsung Health exports
4. **Validation & feedback:** Parse entire CSV upfront before importing; report errors (row N: missing timestamp, row M: unknown exercise type); let user review before applying
5. **Test data:** Maintain a set of real Samsung Health CSV exports from different Android/Samsung Health versions; test import against all of them
6. **Dry-run import:** Show preview (first 5 rows, counts) before committing to IndexedDB

**Warning signs:**
- Import works for you but fails for user with different Samsung Health version
- User says "10k steps imported as null" — timestamp parsing broke
- Duplicate imports (no deduplication) or silent skips (no error log)
- Test only with manually crafted CSV, never with real Samsung Health export

**Phase to address:**
Phase 2 (Import) — Critical for this feature. Test against real Samsung Health data before launch. Ship with dry-run preview + error reporting.

---

### Pitfall 4: Timezone Handling Causes Activity Data Corruption or Wrong Dates

**What goes wrong:**
- User logs weight at midnight in London, travels to New York, opens app: weight entry shows wrong date or time
- User sets a daily target (e.g., "8 glasses of water by 11:59 PM"), crosses timezone: progress resets or resets at wrong time
- "Streak" counter breaks (e.g., user had 7-day streak, travels, streak resets mid-flight)
- Activity heatmap shows entries on wrong dates because timezone wasn't stored

**Why it happens:**
- Datetime libraries (Day.js, etc.) use local browser timezone by default
- When user changes timezone (travels), the same Unix timestamp now renders as different local time
- If timestamps aren't used consistently, or local dates are stored without offsets, data becomes ambiguous
- Health tracking is date-centric: "logs for today" has different meaning in London vs. New York
- No explicit timezone/offset stored with health entries — only local date/time

**How to avoid:**
1. **Always store Unix timestamps** (milliseconds since epoch) in IndexedDB, never just dates
2. **Store timezone offset or IANA timezone** with each entry (e.g., `{ timestamp: 1693526400000, tzOffset: -300 }`)
3. For date-based boundaries (e.g., "did user log today?"):
   - Query: "entries where timestamp is in [start of today UTC, end of today UTC]" — avoid local date logic
   - Or: store `date: YYYY-MM-DD` in addition to timestamp, but always derive it from timestamp + offset, never from local time
4. For streaks and daily targets:
   - Store deadline as Unix timestamp (midnight in a fixed reference timezone, e.g., UTC), not "user's local midnight"
   - Or: store as "YYYY-MM-DD" using a reference timezone consistently
5. Use Day.js with UTC plugin; work in UTC for calculations; convert to local only for display

**Warning signs:**
- No timezone offset stored with any entry
- Code uses `new Date()` and `toLocaleDateString()` for date comparisons
- Entries have `date: "2026-09-02"` (string) without associated timezone
- Streak logic doesn't account for user's timezone
- Tests pass locally but fail when run in different timezone (try `TZ=America/Los_Angeles npm test`)

**Phase to address:**
Phase 1 (MVP) — Foundational. Must fix before shipping; changing this later requires data migration. Test with multiple timezone offsets locally (change system clock or use timezone testing library).

---

### Pitfall 5: GitHub Pages Base Path Causes Routes to 404 or Assets to 404

**What goes wrong:**
- App is deployed to `https://username.github.io/my-health/` (not root)
- User navigates to `/chart/monthly` in the app
- Refresh or direct link: 404 — GitHub Pages can't find the route
- Some CSS/JS files also 404 because paths are absolute (`/css/style.css` looks for root, not `/my-health/css/style.css`)

**Why it happens:**
- GitHub Pages is static hosting — it can't do client-side routing (no server to redirect `/chart/*` back to `index.html`)
- HashRouter solves this by using URL fragments (`/#/chart/monthly`), which GitHub Pages can serve
- BrowserRouter with basename can work, but requires explicit Vite config and router setup
- Asset paths must be relative or include the repo name; absolute paths bypass the base path

**How to avoid:**
1. **Use HashRouter**, not BrowserRouter — URLs become `/#/dashboard`, `/#/chart/monthly` but they work reliably
2. If BrowserRouter is required (for cleaner URLs):
   - Set Vite config: `base: "/my-health/"` in `vite.config.js`
   - Wrap Router with `<BrowserRouter basename="/my-health">` (or use environment variable for flexibility)
   - Verify: run `npm run build`, test locally with `npx serve dist/` and navigate to `/my-health/`
3. Use relative asset paths in CSS/HTML; Vite handles this automatically if `base` is set
4. Test deployment by visiting actual GitHub Pages URL and refreshing on different routes

**Warning signs:**
- Local dev works, but GitHub Pages shows blank page or 404s
- App loads but CSS/fonts missing (404s in Network tab)
- Routes work until you refresh, then 404
- HashRouter is dismissed as "ugly" and BrowserRouter is used without testing

**Phase to address:**
Phase 1 (MVP) — Must be correct before shipping. Use HashRouter by default unless there's a specific UX reason for clean URLs (which is rare for a personal app). Test on actual GitHub Pages URL before merge.

---

### Pitfall 6: IndexedDB Schema Migration Loses Data on Incompatible Changes

**What goes wrong:**
- App shipped with schema: `{ exerciseType: string, reps: number }`
- User logs 100 exercises in Phase 2
- Phase 3 redesign changes schema: need to split `exerciseType` into `exerciseId` (foreign key) + custom `exerciseName`
- Migration runs: recreates object store (deletes all data) to change keyPath
- User loses 100 exercise entries. Unrecoverable.

**Why it happens:**
- IndexedDB schema changes happen in `onupgradeneeded(event)` callback
- To change a field (e.g., keyPath, index), you must delete the old object store and recreate it
- Deleting the store drops all data — unless you explicitly copy it out first
- Developers often test migrations on empty database; real users have months of data

**How to avoid:**
1. **Plan schema carefully in MVP.** Changing keyPath or primary index later is expensive. Use a `versionId` or `id` field as primary key from day one; make other fields separately indexed.
2. **For backwards-incompatible changes:**
   - Read all data from old store into memory *before* deleting
   - Delete old store
   - Create new store with new schema
   - Transform each record and write it back
   - Example:
     ```javascript
     if (db.oldVersion < 3 && db.oldVersion >= 2) {
       const oldData = [];
       const tx = event.target.transaction.objectStore("exercises");
       tx.openCursor().onsuccess = (e) => {
         if (e.target.result) {
           oldData.push(e.target.result.value);
           e.target.result.continue();
         }
       };
       // After cursor, delete and recreate...
     }
     ```
3. **Test migrations** on a database with real data (export user's DB from Phase 1, import it, run Phase 2 migration)
4. **Write a migration test**: create DB at version 1, populate with data, increment version, verify data survived and is transformed correctly
5. **Document schema versions** in code: what changed at v2, v3, etc.

**Warning signs:**
- Migration code has no data preservation logic; just deletes old store
- Schema is never tested against actual user data
- Database version is incremented frequently without clear changelog
- "Just drop IndexedDB" is the recovery plan

**Phase to address:**
Phase 1 (MVP) — Design schema to minimize future breaking changes. Phase 2+ — Test every migration locally with exported real data first.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store local dates as strings (`"2026-09-02"`) instead of timestamps + offset | Simpler code, easier to debug | Timezone bugs, streak/deadline broken after travel, can't migrate | Never — cost outweighs benefit |
| Hardcode GitHub Pages repo name in code instead of using env var | Faster MVP | Site breaks if repo is renamed or deployed elsewhere | Only if you'll never move the repo (unlikely) |
| Disable service worker for "easier testing" and ship without it | Ships faster, no SW bugs | Users can't work offline, defeats PWA value proposition | Never — defeats project purpose |
| Use localStorage instead of IndexedDB (simpler API) | Easier to learn, no async | 5–10MB limit (too small for years of health data), no transactions | Only for tiny datasets (settings, not health entries) |
| Skip duplicate detection on import; let user manually delete duplicates | Ships faster | Bad user experience, data integrity issues, user loses trust | Never — duplicate detection is free with timestamp matching |
| Ignore Samsung Health encoding issues; assume UTF-8 | Faster import | Fails for users with non-UTF-8 exports (Windows users esp.) | Never — encoding is 1-line fix with iconv-lite |
| No schema versioning in IndexedDB; store version elsewhere (localStorage) | One less thing to manage | Confusing, schema version and data get out of sync | Never — use IndexedDB version field exclusively |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|-----------------|
| **Samsung Health CSV import** | Assume column names never change or are case-sensitive | Build a tolerance mapping: accept `Exercise_Type`, `ExerciseType`, `exercise type` via fuzzy match. Test against exports from multiple Samsung Health versions. |
| **Samsung Health CSV timestamps** | Treat as milliseconds but don't account for timezone offset column | Always read timestamp + offset column; convert `ms / 1000 + offset` to UTC. Validate date is reasonable (not year 1970 or 2050). |
| **GitHub Pages deployment** | Test only locally; assume production will work | Always test on actual GitHub Pages URL (not localhost:5173). Verify routes, CSS load, service worker registers. Automate this in pre-deploy checks. |
| **Service worker registration** | Register globally; assume it's always safe | Register only if HTTPS or localhost. Check `navigator.serviceWorker` exists. Handle registration errors (quota full, policy issues). |
| **Push notifications** | Assume they work on iOS like Android | Push only works if PWA is installed to home screen (iOS 16.4+). Android requires service worker + FCM backend (we skip this for MVP). Document iOS limitations clearly. |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Recharts with 1000+ data points** | Charts stutter, scrolling is janky, interactions lag | Implement data decimation: show every 10th point for 10k entries. Use lazy loading with Intersection Observer. Memoize chart components (useMemo). | 1000+ data points in single chart; typical after 2–3 years of daily logging |
| **IndexedDB cursor over 100k records** | Page hangs for seconds while loading history | Use pagination: load 100 entries at a time, show "load more" button. Use index for date ranges (avoid full scan). | 100k+ entries; unusual but possible after 5+ years or if user imported large dataset |
| **No activity heatmap data aggregation** | Heatmap renders 365 cells * 12 months = 4380 queries. Page load is very slow. | Pre-calculate daily stats in IndexedDB: `dailyStats` table with aggregated data (total steps, workouts done, etc.). Update on each log, not on each render. | Heatmap rendering; should be addressed before shipping |
| **All data in single IndexedDB transaction** | Updates block reads; app feels slow and unresponsive | Use separate transactions for writes vs reads. Batch writes when possible (import CSV). Don't load all history upfront. | Complex operations; noticeable around Phase 2 |
| **SVG rendering for charts without viewport clipping** | Every data point renders, even off-screen | Recharts handles this, but custom charts won't. Use canvas-based charts for 100k+ points (trade-off: loses interactivity). | Custom charting; Recharts + decimation should be fine |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| **No input validation on Samsung Health CSV import** | CSV with malicious script in "exercise name" field → XSS when rendered | Sanitize all imported fields: strip HTML, validate types (exercise name is text, not code). Use `DOMPurify` or plain text-only storage. |
| **No validation on custom exercise creation** | User creates exercise named `<img src=x onerror=alert('xss')>` → XSS | Validate exercise names: alphanumeric + spaces, strip HTML. Use React (which auto-escapes) but don't use `dangerouslySetInnerHTML`. |
| **No rate limiting on data export** | User exports 100MB of JSON; browser hangs/crashes | Limit export size: export only past 2 years by default, offer "full export" with warning. Stream export to file instead of loading in memory. |
| **Sensitive health data in localStorage** | Browser history/cache reveals health data if device is compromised | Use IndexedDB (not localStorage). No need for encryption in browser (device is the trust boundary). Make export password-protected if sharing file (optional). |
| **No data deletion on app uninstall** | User uninstalls PWA but data persists in IndexedDB | Clear data on uninstall (iOS/Android PWAs call clear handler). Document that users should export before uninstalling. Offer "factory reset" in settings. |
| **Samsung Health CSV parser accepts URLs or commands** | User imports CSV with timestamp containing `javascript:alert(1)` | Parse as data only: timestamps are numbers, not strings. Validate before storage. Never use `eval()` or `Function()` on any imported field. |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **No feedback when data is lost to eviction** | User wonders where their data went; loses trust in app | Show warning if storage quota is low (< 10MB free). Prompt monthly export. Explain persistent storage request clearly ("Allows app to store data safely"). |
| **Update available but no prompt** | User doesn't know new features exist; stuck on old version | Show prominent "Update available" banner with one-click reload. Don't force reload without asking. |
| **Import fails silently** | User thinks import worked but 10% of rows are missing | Show import preview: "Importing 1000 rows... 950 OK, 50 skipped (see details)". List errors before committing. |
| **Timezone confusion** | User thinks their data is wrong after travel; loses trust | Explicitly show timezone in logs (e.g., "10:00 PM BST" not just "10:00 PM"). Document that app tracks by date, not by local time of day. |
| **No indication of offline mode** | User logs data offline, wonders if it saved (it did, it's in IndexedDB) | Show subtle "Offline" indicator. Confirm "Saved locally" after each log when offline. Explain it syncs on reconnect (though we don't sync anywhere, just store locally). |
| **First-time setup too complex** | User installs PWA, doesn't know what to do; bounces | Show tutorial on first load: "Log weight", "View chart", "Customize exercises". Highlight "Import Samsung Health" if user has data. |
| **No explanation of push notification limitations on iOS** | User requests push notifications, they never arrive on iPhone; support burden | Document: "Push notifications work on Android. On iPhone, reminders come from Home Screen app only" in settings or help. |
| **Export format is raw JSON with no documentation** | User exports, opens in Excel, sees gibberish | Export as CSV + JSON. CSV has headers, is Excel-friendly. JSON has comments explaining structure. Offer export wizard to choose format. |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Service worker:** Often missing update check logic and version cache busting. Verify: deploy new version, hard refresh, should show "update available" prompt within 30 seconds.

- [ ] **IndexedDB schema:** Often missing data preservation during migrations. Verify: create DB v1, add data, increment version, check data survived and is transformed.

- [ ] **Samsung Health import:** Often missing duplicate detection and timezone handling. Verify: import real Samsung Health export (not handmade CSV), check for duplicates with `const seen = new Set()`, check timestamps are correct.

- [ ] **GitHub Pages deployment:** Often missing base path testing. Verify: deploy to `https://username.github.io/my-health/`, navigate to different routes, refresh — should not 404.

- [ ] **Push notifications:** Often missing iOS limitations documentation. Verify: on iPhone, PWA is installed to home screen, notification is sent, user is warned about iOS-only support.

- [ ] **Timezone handling:** Often missing offset storage. Verify: enter data, change system timezone, check entry date doesn't change in app.

- [ ] **Offline mode:** Often missing indication of offline state. Verify: disable network, log data, confirm "Saved locally" shown, re-enable network, confirm data persisted.

- [ ] **Chart performance:** Often missing decimation for large datasets. Verify: import 3 years of daily data (1000+ points), monthly chart should load in < 2 sec.

- [ ] **Error handling in import:** Often missing user-facing error messages. Verify: import CSV with bad timestamp, app shows error (not silent skip), user can retry.

- [ ] **Persistent storage request:** Often missing or incomplete. Verify: on first app load, `navigator.storage.persist()` is called, user sees permission prompt, quota is monitored.

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **IndexedDB data lost to eviction** | HIGH | User has no direct recovery (no server backup). Recovery: (1) Check browser's storage manager for partially evicted data; (2) Ask user if they have manual CSV export from before loss; (3) Restore from that export; (4) Implement persistent storage + monthly export going forward. |
| **Service worker stuck on old version** | MEDIUM | Users: hard refresh (Cmd+Shift+R), clear site data (Settings > Site Data), re-install PWA. Developers: increment cache version, deploy, communicate "please hard refresh" to users. |
| **Samsung Health import failed** | MEDIUM | Ask user to re-export from Samsung Health with same version. Check file encoding (open in Notepad++, verify UTF-8). Parse with more tolerant logic. If still fails, offer manual import (user copies rows to form). |
| **Timezone data corruption (dates wrong after migration)** | HIGH | Requires data migration: (1) Export all entries as JSON; (2) Re-import with corrected timezone offset logic; (3) Ship new app version with fix; (4) Prompt user to re-import. High user friction; prevent this entirely. |
| **GitHub Pages 404 errors** | LOW | Redeploy with correct base path in vite.config.js and router. Users: clear cache, re-install PWA from fresh URL. |
| **Chart performance degradation** | MEDIUM | Deploy new version with data decimation and memoization. Users: existing charts load fast after redeploy. For very large datasets, offer "archive old data" option. |
| **Duplicate entries in health log** | MEDIUM | App can detect duplicates: same exercise type + same date + same duration = likely duplicate. Offer "remove duplicates" utility in settings. Let user review before deleting. |
| **Push notification permission denied** | LOW | User: Settings > Notifications > [app] > Allow. App: detect denial, offer "re-request" button in settings with explanation of iOS limitations. |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| IndexedDB eviction | Phase 1 (MVP) | `navigator.storage.persist()` called on init; quota monitoring code exists; app tested for 2+ weeks without data loss |
| Service worker cache invalidation | Phase 1 (MVP) | Deploy v1 → v2, user hard refreshes, sees "update available" prompt within 30 sec. No stale JS served. |
| Samsung Health CSV import | Phase 2 (Import) | Import real Samsung Health export (multiple versions), verify all rows parsed, timestamps correct, no silent skips. |
| Timezone handling | Phase 1 (MVP) | Entries stored with Unix timestamps + offset. Date comparisons use UTC boundaries. Test with `TZ=America/New_York`. |
| GitHub Pages base path | Phase 1 (MVP) | Deploy to GitHub Pages repo, test all routes on actual domain (not localhost). Assets load. |
| IndexedDB schema migration | Phase 1 (MVP) as foundational design; Phase 2+ as needed | Create DB v1, populate, increment version, migrate data, verify no data loss. Test on exported real DB. |
| Recharts performance | Phase 3 (Charts) | Chart with 2 years of daily data (730 points) loads in < 2 sec. Scrolling is smooth. Implement decimation before shipping. |
| Duplicate detection in import | Phase 2 (Import) | Import same CSV twice, verify duplicates detected and skipped (not added). Use date + type + duration as key. |
| Offline indication | Phase 1 (MVP) or Phase 2 (Polish) | Toggle network off in DevTools, confirm "Offline" badge shown. Log data, confirm "Saved locally" message. |
| Push notification iOS limitations | Phase 3 (Notifications) or Deferred | Document in app settings / help: "Notifications require iOS 16.4+ and home screen install; Android fully supported." Test on real iPhone. |

---

## Domain-Specific Context for This Project

This is a **personal, offline-first, no-sync health tracking PWA** deployed on GitHub Pages. Key implications:

- **No server = no recovery.** Data loss is permanent. Prevention (persistent storage, regular exports) is critical.
- **Single user = no multi-user sync issues,** but user may use on multiple devices (desktop + phone). Changes on one device won't sync to other; user must manually export/import to transfer data.
- **Samsung Health import is core feature.** Must be robust; bad import = lost trust immediately.
- **GitHub Pages constraints are real.** No server-side routing, no headers, no HTTPS custom domain, no caching headers. Work within them.
- **Mobile-first health tracking = timezone issues are critical.** User logs at different times in different timezones; app must handle gracefully.

---

## Sources

- [Storage quotas and eviction criteria - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [IndexedDB Max Storage Size Limit - RxDB](https://rxdb.info/articles/indexeddb-max-storage-limit.html)
- [Strategies for Service Worker Caching - Hasura](https://hasura.io/blog/strategies-for-service-worker-caching-d66f3c828433)
- [Invalidate cache by service worker - Create React App issue #3665](https://github.com/facebook/create-react-app/issues/3665)
- [When 'Just Refresh' Doesn't Work: Taming PWA Cache Behavior - Infinity Interactive](https://iinteractive.com/resources/blog/taming-pwa-cache-behavior)
- [Samsung Health Export Data Analysis - DC Rainmaker](https://www.dcrainmaker.com/2019/03/export-data-samsung-watch-galaxy-health-app.html)
- [Using React Router on GitHub Pages - Medium](https://medium.com/@Satyam_Mishra/react-router-deployment-to-gh-pages-issue-fixed-2024-bc7fd80946ad)
- [How to Deploy React app with client-side routing on GitHub Pages - Medium](https://medium.com/@swarajgosavi20/how-to-deploy-react-app-with-client-side-routing-on-github-pages-8a3fefe5b0d5)
- [Using IndexedDB - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [IndexedDB: Migrations - The Valley of Code](https://thevalleyofcode.com/lesson/indexeddb/migrations/)
- [Migration Storage - RxDB](https://rxdb.info/migration-storage.html)
- [Reliable Push Notifications on PWAs for iOS and Android - EDANA](https://edana.ch/en/2026/03/19/push-notifications-on-web-applications-pwa-is-it-really-reliable-on-ios-and-android/)
- [PWA iOS Limitations and Safari Support 2026 - MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Recharts Performance Optimization Guide](https://recharts.github.io/en-US/guide/performance/)
- [Recharts is slow with large data - GitHub Issue #1146](https://github.com/recharts/recharts/issues/1146)
- [How to Build Fast-Loading Dashboards with Recharts - Querio](https://querio.ai/articles/build-fast-loading-dashboards-recharts)
- [How to Handle Date and Time Correctly - DEV Community](https://dev.to/kcsujeet/how-to-handle-date-and-time-correctly-to-avoid-timezone-bugs-4o03)
- [Activity data messed up after timezone change - Apple Community](https://discussions.apple.com/thread/250285715)
- [Sync Conflict Handling in Offline-First PWAs - DEV Community](https://dev.to/crisiscoresystems/sync-conflict-handling-in-offline-first-pwas-how-to-merge-without-lying-to-the-user-59i3)
- [Data Synchronization in PWAs - GTC Software](https://gtcsys.com/comprehensive-faqs-guide-data-synchronization-in-pwas-offline-first-strategies-and-conflict-resolution/)
- [Identifying Duplicates in Health Data - Medium](https://medium.com/@tarangds/identifying-duplicates-and-near-duplicates-in-health-data-a-guide-for-data-professionals-9b085b6a4138)

---

*Pitfalls research for: Health Tracking Progressive Web App (Browser-Only, IndexedDB, GitHub Pages)*
*Researched: 2026-09-02*
