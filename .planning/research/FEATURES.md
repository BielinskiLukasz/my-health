# Feature Landscape: Personal Health Tracking PWA

**Domain:** Self-hosted, browser-only health tracking application
**Researched:** 2026-09-02
**Focus:** Table stakes vs differentiators for privacy-focused, data-ownership-centric health tracker

## Executive Summary

Personal health tracking apps have matured into a competitive space where mainstream options (Fitbit, Apple Health, Garmin) succeed through different value propositions: Fitbit via simplicity, Garmin via athlete performance metrics, Apple via health ecosystem integration. However, a self-hosted PWA with local data ownership can differentiate by **eliminating account friction, removing data-selling concerns, and enabling true offline operation** — advantages that resonate with privacy-conscious users willing to sacrifice cloud sync and social motivation.

MyHealth's already-decided feature set (weight, sleep, steps, water, heart rate, custom training sessions, targets with deadlines, rich charts, heatmap, personal bests, Samsung Health import, JSON/CSV export, PWA offline, journal notes) aligns strongly with table-stakes expectations while also hitting several differentiator opportunities. The key anti-features to avoid are social gamification (leaderboards, challenges, community), account creation, and anxiety-inducing notifications.

---

## Table Stakes

Features users expect or the app feels incomplete. Missing any one of these risks users perceiving the app as "missing something obvious."

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Activity Logging** (steps, exercise) | Core purpose: users must be able to record what they did | Low | Manual entry + import (Samsung Health) satisfies this; no real-time GPS needed |
| **Sleep Tracking** (bedtime + wake time, duration) | Normalized by Fitbit, Apple, Samsung Health; users expect it | Low | Simple date+time input; no wearable integration required for MVP |
| **Weight Tracking** | Foundation for BMI and health progression; expected in every fitness app | Low | Single number + date; easy backfill |
| **Heart Rate Logging** | Normalized by consumer trackers; expected alongside activity | Low | Resting heart rate is sufficient (no continuous monitoring required) |
| **Chart/Timeline Visualization** | Users must see trends over time (week, month, year); essential for motivation | Medium | Line/bar charts per metric; Recharts already chosen |
| **Data Persistence & Backup** | Users fear losing data; export capability is expected | Low | IndexedDB in browser + JSON/CSV export covers this |
| **Mobile-Responsive Design** | Gym use case requires phone entry; PWA installable on homescreen | Medium | Mobile-first design is critical; already in scope |
| **Simple, Intuitive Navigation** | Research shows cluttered menus kill daily engagement; users won't remember where to log | Medium | Minimize depth; main action (log today) must be immediately visible |
| **Offline Capability** | 63% of users prefer offline-capable fitness apps; gym/outdoors use case requires it | Medium | Service worker + IndexedDB; PWA requirement already met |
| **Date Selection & Backfill** | Users log workouts hours later, or catch up on missed days | Low | Calendar picker or date input for past entries |
| **Daily Summary Dashboard** | Quick glance at today's metrics; expected starting point | Low | Show snapshots of today's values across key metrics |

---

## Differentiators

Features that set MyHealth apart from cloud-centric trackers and appeal to privacy-conscious users. Not expected, but valuable and directly aligned with the product's positioning.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **No Account, No Server** | Zero friction onboarding; full data ownership; no vendor lock-in; no data selling | Low (technical) | Direct competitive advantage vs Fitbit, Apple Health, Garmin, Strava |
| **Local-Only Data Storage** | All data stays on user's device; encryption at rest via browser; no cloud leaks | Low (technical) | Resonates with privacy advocates; differentiates from mainstream apps |
| **Manual Import (Samsung Health ZIP)** | Recover years of history without cloud sync; data rescue story | Medium | Backfill use case; one-way import is sufficient (no bidirectional sync) |
| **Manual Export (JSON + CSV)** | True backup strategy; data portability; spreadsheet analysis | Low | Enables switching away; positions app as user-friendly, not lock-in |
| **Configurable Exercise Types** | Users track what they actually do (squash, climbing, custom workouts); not forced into predefined sports | Low | Squash + 5 defaults + user-created exercises | |
| **Multi-Exercise Sessions** | Users log a complete workout with reps, sets, duration, intensity, not just "1 workout" | Medium | Richer context for training progression |
| **Squash Match Context** (result, opponent, score) | Sport-specific metadata; demonstrates flexibility | Low | Extends base exercise model; shows app isn't a one-size-fits-all template |
| **Targets with Deadlines** | Projected pace adds urgency and motivates; contrasts with open-ended goals | Medium | Goal timeline + progress prediction; differentiator vs apps without deadlines |
| **Activity Heatmap** (GitHub style) | Visual representation of consistency and "never miss twice" motivation | Medium | Target-hit days + training days; Recharts or custom SVG |
| **Personal Records (PRs)** | Intrinsic motivation (beat your own best); not social comparison | Low | Auto-detect max reps, longest session, etc.; show in history + exercise view |
| **Daily Journal Note** | Contextual narrative (how you felt, diet notes, recovery); connects metrics to life | Low | Optional free-text per day; differentiates from metric-only trackers |
| **BMI Auto-Calculation** | Convenience; shows health progression beyond raw weight | Low | From height (one-time) + weight logs; chart alongside weight |
| **Dark Mode** | Table stakes for modern apps; user preference | Low | Manual toggle; remember preference |
| **Push Notifications** (optional) | Gentle reminder if user didn't log today; on-device, no cloud | Low | Configurable time; dismissible; does NOT include anxiety-inducing red alerts |
| **Metric Units** (kg, ml, cm) | Consistency; respects user location; no imperial toggle bloat | Low (decision made) | Metric-only simplifies UI and reduces decision burden |
| **Rich Chart Options** | Line, bar, heatmap per metric; flexible visualization | Medium | Recharts + custom heatmap component |
| **Data Import from Existing Health Apps** | Recovery path for users switching from Samsung, Apple, etc. | Medium | Samsung Health ZIP is the initial target; extensible to others |

---

## Anti-Features

Features to explicitly NOT build. These either conflict with the product's core positioning (privacy, simplicity) or represent common pitfalls that drain development time without ROI.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Social Sharing, Leaderboards, Challenges** | Contradicts "private app" positioning; adds notification spam risk; users explicitly requested no social features; requires backend or peer sync | None—keep app personal. Users share health data privately if they want; don't provide the infrastructure |
| **Multi-User Profiles / Family Sharing** | Out of scope per PROJECT.md; adds complexity to IndexedDB schema, access control, and privacy model; "single user" is the design | Build v2 if demand emerges; v1 is personal use only |
| **Cloud Sync / Accounts** | Contradicts core value (no server, no lock-in); adds infrastructure, privacy, and maintenance burden | Rely on manual export + reimport for multi-device workflows |
| **Calorie / Nutrition Tracking** | Out of scope per PROJECT.md; orthogonal concern; adds data-entry burden (food logging is time-consuming); scope creep | Defer to v2; focus on movement + sleep + weight + hydration |
| **Real-Time GPS Tracking** | Requires device hardware (GPS/location permission); battery drain; not aligned with "log manually" model; privacy concern | Keep step count manual or imported; don't add location tracking |
| **Ads, Paywalls, Upsells** | Contradicts data-ownership positioning; degrades UX; not aligned with personal-use builder ethos | None—keep ad-free and free forever |
| **Data Selling, Analytics Tracking** | Betrays user trust; contradicts privacy positioning; illegal in many jurisdictions (GDPR, CCPA) | None—never collect telemetry or user behavior data |
| **AI Coaching / ML-Generated Insights** | Adds cloud dependency (model inference); privacy risk; premature complexity; low ROI for MVP | Post-MVP: if insights desired, compute them client-side from local data |
| **Imperial Units** | Adds UI burden (toggle, unit picker); complicates charting and input validation; metric-only is a deliberate simplification | Metric only; users in imperial regions can convert mentally or externally |
| **Anxiety-Inducing Design** (red alerts, aggressive permissions, alarming copy) | Research shows this causes app abandonment; notifications should feel helpful, not threatening | Gentle notification copy; optional opt-in for push reminders; no red-alert styling for routine logs |
| **Wearable / Apple Health / Google Fit Direct Sync** | Requires OAuth, API keys, handling token refresh, rate limits, data format translation; backend complexity disguised as frontend feature | Samsung Health ZIP import covers recovery; users manually copy metrics from their wearable's export if needed |
| **Workout Plans / Coaching Programs** | Out of scope; requires content creation, personalization, recommendation logic; can be v2 | Focus on tracking user's own workouts, not prescribing them |

---

## Feature Dependencies

These features unlock or enable others.

```
Height (user setting) → BMI auto-calculation (from weight + height)
Weight log → BMI calculation + charting
Sleep logs → Weekly/monthly/yearly chart view
Step logs + target → Projected pace calculation
Activity logs + target-hit dates → Activity heatmap
Exercise logs → Personal best detection
Target date + current pace → Progress bar color (red/yellow/green)
Daily log entries → Dashboard snapshot
Journal notes → (optional; no dependencies)
Samsung Health import → Backfill all metrics at once (recovery feature)
Export (JSON/CSV) → Data portability, spreadsheet analysis
```

---

## MVP Recommendation

**Table Stakes to Prioritize (Phase 1):**
1. Weight logging + chart
2. Sleep logging (bedtime + wake) + chart
3. Steps logging + chart
4. Water intake logging + chart
5. Resting heart rate logging + chart
6. Dashboard (today's snapshot)
7. Mobile-responsive design
8. Offline capability (service worker)
9. Data export (JSON + CSV)
10. Simple, uncluttered navigation

**Key Differentiators to Include (Phase 1, if capacity):**
- Targets with deadline + projected pace
- Custom exercise configuration + training sessions
- Activity heatmap
- Journal notes
- BMI auto-calculation
- Personal bests detection
- Samsung Health import (backfill)

**Defer to Phase 2 or Later:**
- Advanced charting options (beyond line/bar)
- Push notifications (PWA capable, but can wait)
- Dark mode (nice-to-have; can ship with light mode + add toggle later)
- Squash match context (if time permits in Phase 1, include; otherwise Phase 2)

**Explicitly Out of Scope (v1):**
- Social features, leaderboards, challenges
- Multi-user / family sharing
- Calorie / nutrition tracking
- Real-time GPS
- Ads, paywalls, data selling
- Cloud sync, accounts
- AI coaching
- Wearable direct sync (import only)

---

## Feature Prioritization for Roadmap

**Why Table Stakes First:**
Shipping with incomplete table-stakes features (e.g., only weight + no charts) will feel like an unfinished product. Users may think, "Why would I use this instead of Apple Health or Fitbit?" Complete the core loop: log → visualize → understand trends.

**Why Include Key Differentiators in Phase 1:**
Targets + projected pace and custom exercises are relatively low-complexity and directly address the "self-hosted PWA" value prop. Including them in Phase 1 creates immediate differentiation. Heatmap and personal bests add visual richness with moderate complexity.

**Why Defer Social/Multi-User:**
These are high-complexity, high-maintenance features that distract from shipping a polished, privacy-respecting personal tracker. If users demand this later, it's easier to add than to remove.

**Why Squash Can Wait (or Be Conditional):**
It's a differentiator for the owner's personal use case but may not ship in MVP unless time permits. The base exercise model (reps, sets, duration, intensity) covers 95% of use cases. Match result + opponent is a nice-to-have that can be added post-launch.

---

## Complexity Assessment: Effort for MVP

| Feature | Effort | Notes |
|---------|--------|-------|
| Weight/Sleep/Steps/Water/HR logging | Low | CRUD + date input |
| Dashboard snapshot | Low | Read today's entries, display latest values |
| Line/bar charts (weekly, monthly, yearly) | Medium | Recharts integration; data aggregation |
| Activity heatmap | Medium | Custom SVG or Recharts; grid layout for day-based view |
| Targets + projected pace | Medium | Math logic; color coding; progress bar |
| Custom exercises | Low | CRUD in settings; store in IndexedDB |
| Training sessions (multi-exercise) | Medium | Nested data structure; session UI |
| Personal best detection | Low | Aggregation logic; flag on display |
| Journal notes | Low | Text input; one per day; optional |
| BMI calculation + chart | Low | Simple formula; add to existing weight chart |
| Samsung Health import | Medium | ZIP parsing; CSV reading; date normalization |
| JSON/CSV export | Low | Stringify/format; download |
| Mobile-responsive design | Medium | CSS Grid/Flexbox; touch-friendly inputs |
| Offline (service worker) | Medium | Caching strategy; offline fallback UI |
| Dark mode | Low | CSS variables + toggle |
| Push notifications | Low | Service worker + Notification API |

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Table stakes | HIGH | Research shows consistent expectations across Fitbit, Apple Health, Garmin, Samsung; these are universally expected |
| Differentiators | HIGH | Privacy-focused app positioning is clear; local-only storage, no accounts, manual import/export directly address user privacy concerns in research |
| Anti-features | HIGH | Research explicitly identifies social/gamification as optional (many apps use it, but privacy-focused users opt-out); anxiety-inducing design is documented pitfall; MyHealth's explicit requirements (no social, no cloud) align with findings |
| Squash Match Context | MEDIUM | Personal to owner; research doesn't identify sport-specific metadata as table stakes, but it's low-effort if included |
| Push Notifications | MEDIUM | Research shows they're expected but also a pitfall if poorly designed; on-device, gentle notifications avoid the main risk |

---

## Key Insights for Roadmap

1. **Complete the Core Loop in Phase 1:** Logging without visualization is frustrating. Ship table-stakes features + charts together.

2. **Differentiate Early:** Include targets + projected pace and custom exercises in Phase 1 if possible. These directly communicate "this app is for people who want control."

3. **Avoid Social Complexity:** Research shows gamification (leaderboards, challenges) boosts engagement by 40% in mainstream apps, but MyHealth explicitly doesn't want this. The tradeoff is intentional: privacy + simplicity > social motivation.

4. **Offline is Non-Negotiable:** 63% of users prefer offline apps. PWA is already in scope; don't compromise on offline logging.

5. **Anxiety-Inducing Design Kills Apps:** Research shows poor notification UX causes abandonment. Keep notifications gentle and optional.

6. **MVP is Feature-Complete, Not Feature-Rich:** Ship with 7–10 core features done well, not 20 partially. Research shows over-feature design leads to abandonment.

---

## Sources

Research findings drawn from:

- [25 Features Every Health & Fitness App Should Have | Clutch.co](https://clutch.co/resources/25-features-health-fitness-app)
- [Top Features That You Must Have In Your Fitness App](https://www.nimbleappgenie.com/blogs/essential-fitness-app-features/)
- [Essential Features for Fitness App: A Comprehensive List](https://www.moontechnolabs.com/blog/features-for-fitness-app/)
- [21 Features that you must have in your Health tracking app | Siddhi Infosoft](https://www.siddhiinfosoft.com/blog/21-features-that-you-must-have-in-your-health-tracking-app/)
- [Must-Have US Fitness Mobile App Features for 2026](https://newagesysit.com/blog/must-have-features-in-modern-us-fitness-mobile-apps-workout-tracking-nutrition-wearable-sync/)
- [Fitbit Vs. Apple Watch Vs. Garmin: Which Fitness Tracker Is Best?](https://www.today.com/shop/apple-watch-vs-garmin-vs-fitbit-rcna183519)
- [Garmin vs Fitbit: choose the right fitness watch for you](https://www.techradar.com/news/garmin-versus-fitbit)
- [Privacy-Respecting Health and Wellness apps for Android and iOS - Privacy Guides](https://www.privacyguides.org/en/health-and-wellness/)
- [No Cloud Fitness Trackers: 5 Best for Data Privacy](https://flexgearinsights.com/no-cloud-fitness-trackers/)
- [The Best Fitness App Design: UI and UX Practices for a Functional and Engaging applications](https://madappgang.com/blog/the-best-fitness-app-design-examples-and-typical-mistakes/)
- [Common Mistakes to Avoid in Healthcare App Development - smartData](https://www.smartdatainc.com/knowledge-hub/common-mistakes-to-avoid-in-healthcare-app-development/)
- [Healthcare Mobile App Design: The Complete 2026 Guide](https://www.saasfactor.co/blogs/healthcare-mobile-app-design)
- [5 UI/UX Mistakes in Fitness Apps to Avoid - 2V Modules](https://www.sportfitnessapps.com/blog/5-uiux-mistakes-in-fitness-apps-to-avoid)
- [Intrinsic motivations in health and fitness app engagement: A mediation model of entertainment - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11907615/)
- [Gamification Features | Gamification Examples | StriveCloud](https://www.strivecloud.io/blog/gamification-features-mhealth)
- [Social Workout Apps: Exercising with Friends Made Fun and Easy | by JYMBEE | Medium](https://medium.com/@JymBeeApp/social-workout-apps-exercising-with-friends-made-fun-and-easy-2fd7ed9fc908)
- [15 Must-Have Fitness App Features to Boost User Engagement and Retention](https://stormotion.io/blog/fitness-app-features/)
- [How Wearables are Integrated With EHR/EMR Systems](https://tblocks.com/articles/wearable-technology/)
- [Wearable Health Data Integration with Telehealth EHR Seamlessly](https://prognocis.com/wearable-integration-with-ehr-promotes-interoperability/)
