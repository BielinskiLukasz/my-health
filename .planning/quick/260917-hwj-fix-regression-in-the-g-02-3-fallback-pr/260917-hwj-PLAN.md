---
phase: quick
plan: 260917-hwj
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/Log/WeightForm.tsx
  - src/components/Log/HeartRateForm.tsx
  - src/components/Log/TemperatureForm.tsx
  - src/components/Log/SleepForm.tsx
  - src/components/Log/StepsForm.tsx
  - src/components/Log/WaterForm.tsx
  - .planning/phases/02-charts-visualization/02-UAT.md
autonomous: true
requirements: [G-02-3]

estimate:
  tokens: 20000
  raw_tokens: 20000
  tasks: 2
  confidence: low

must_haves:
  truths:
    - "Opening any of the six metric log forms (weight, sleep, steps, water, heart rate, temperature) for TODAY with no entry for today still prefills the field(s) with that metric's most recently logged value — unchanged from current behavior."
    - "Opening any of the six metric log forms for a PAST date (not today) with no entry for that date leaves the field(s) empty — it no longer prefills an unrelated most-recent value borrowed from a different date."
    - "The 'entry already exists for this date' branch (G-02-4) is byte-for-byte untouched in all six forms — editing an existing entry still loads its real stored value(s) regardless of which date is selected."
    - "02-UAT.md's G-02-3 entry keeps status: resolved and gains a refinement note that documents the fallback is now gated on the selected date being today, referencing the new fix commit."
  artifacts:
    - src/components/Log/WeightForm.tsx
    - src/components/Log/HeartRateForm.tsx
    - src/components/Log/TemperatureForm.tsx
    - src/components/Log/SleepForm.tsx
    - src/components/Log/StepsForm.tsx
    - src/components/Log/WaterForm.tsx
    - .planning/phases/02-charts-visualization/02-UAT.md
  key_links:
    - "Each form's per-date load useEffect gates its existing G-02-3 fallback query (`db.<table>.orderBy('date').reverse().first()`) behind `currentDate === todayISO()`, with `todayISO` imported from `src/utils/dateFormat.ts` alongside the already-imported `formatDisplayDate` — the else-if/else split is what decides whether the metric's most-recent value is allowed to cross into a different date's form."
    - "editingId/isEditing must remain unset/false in BOTH the today-fallback branch and the new historic-empty branch — this was already true before this fix (G-02-4 safety) and must not regress in either branch."
---

<objective>
Fix a regression in the G-02-3 fallback prefill (commit 74466eb): all six metric log forms currently prefill the most-recently-logged value whenever there is no entry for the selected date, regardless of which date is selected. That is only correct when the user is logging for today (adding new current data) — backfilling a historic date with no entry should leave the field(s) empty instead of silently substituting an unrelated most-recent value from a different date. This plan gates the existing fallback branch in all six forms on `currentDate === todayISO()`, and adds a refinement note to the already-resolved G-02-3 gap entry in 02-UAT.md documenting the narrowed scope.

Purpose: Prevent a historic backfill entry from being contaminated by a value that belongs to a different (often much more recent) date, which the prior G-02-3 fix unintentionally allowed.
Output: Six Log form components whose no-entry-for-date fallback only prefills when the selected date is today; 02-UAT.md's G-02-3 entry annotated with the refinement and the new commit reference.
</objective>

<execution_context>
@C:/my-code/vibe-coding/my-health/.claude/gsd-core/workflows/execute-plan.md
@C:/my-code/vibe-coding/my-health/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@C:/my-code/vibe-coding/my-health/.planning/STATE.md
@C:/my-code/vibe-coding/my-health/.planning/phases/02-charts-visualization/02-UAT.md
@C:/my-code/vibe-coding/my-health/src/components/Log/WeightForm.tsx
@C:/my-code/vibe-coding/my-health/src/components/Log/HeartRateForm.tsx
@C:/my-code/vibe-coding/my-health/src/components/Log/TemperatureForm.tsx
@C:/my-code/vibe-coding/my-health/src/components/Log/SleepForm.tsx
@C:/my-code/vibe-coding/my-health/src/components/Log/StepsForm.tsx
@C:/my-code/vibe-coding/my-health/src/components/Log/WaterForm.tsx
@C:/my-code/vibe-coding/my-health/src/utils/dateFormat.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Gate the no-entry-for-date fallback prefill on currentDate === todayISO()</name>
  <files>src/components/Log/WeightForm.tsx, src/components/Log/HeartRateForm.tsx, src/components/Log/TemperatureForm.tsx, src/components/Log/SleepForm.tsx, src/components/Log/StepsForm.tsx, src/components/Log/WaterForm.tsx</files>
  <action>
  In each form, first add `todayISO` to the existing `import { formatDisplayDate } from "@/utils/dateFormat"` line so it reads `import { formatDisplayDate, todayISO } from "@/utils/dateFormat"`.

  Then, in each form's per-date load `useEffect`, split the existing `else` branch (the one commented "No entry for this date — prefill with the most recently logged value (G-02-3)") into an `else if (currentDate === todayISO())` branch that keeps the exact existing fallback-query logic unchanged, followed by a new `else` branch that clears the field(s) to empty and leaves the editing flag unset/false — do not touch the `if` branch above it (the "entry already exists for this date" logic, G-02-4) in any file.

  WeightForm.tsx: around lines 42-47, change `} else {` to `} else if (currentDate === todayISO()) {` (keep the existing `const last = await db.weights.orderBy("date").reverse().first()` / `setValue(...)` / `setEditingId(undefined)` body as-is, only updating its comment to say "No entry for today"), then add `} else { setValue(""); setEditingId(undefined) }` with a comment noting this is a historic date with no entry, so the field stays empty rather than borrowing an unrelated most-recent value.

  HeartRateForm.tsx: same shape around lines 46-51, gating `db.heartRates.orderBy("date").reverse().first()` and keeping `setEditingId(undefined)` in both the today-fallback and historic-empty branches.

  TemperatureForm.tsx: same shape around lines 46-51, gating `db.temperatures.orderBy("date").reverse().first()` and keeping `setEditingId(undefined)` in both branches.

  StepsForm.tsx: around lines 37-42, same shape gating `db.stepEntries.orderBy("date").reverse().first()`, keeping `setIsEditing(false)` in both branches.

  WaterForm.tsx: around lines 37-42, same shape gating `db.waterEntries.orderBy("date").reverse().first()`, keeping `setIsEditing(false)` in both branches.

  SleepForm.tsx (multi-field variant, around lines 44-58): gate the whole existing fallback block (the one that queries `db.sleepEntries.orderBy("date").reverse().first()` and conditionally calls `setBeddingTime`/`setWakeTime` from `last.beddingTime`/`last.wakeTime`, or clears both to `""` when no prior entry exists at all) behind `currentDate === todayISO()`. Add a new `else` branch for the historic-no-entry case that calls `setBeddingTime("")` and `setWakeTime("")` directly (no query at all — a historic date with no entry never needs to look up the most recent entry). In both branches keep `setIsEditing(false)` and `setDuration(null)` exactly as today; the existing duration-calculation effect will recompute automatically from whatever bed/wake times get set.

  In every file, `editingId`/`isEditing` must stay unset/false in both the today-fallback branch and the new historic-empty branch — unchanged from the current (correct) behavior, just now reached via two branches instead of one.
  </action>
  <verify>
    <automated>npm run build && grep -c 'currentDate === todayISO()' src/components/Log/WeightForm.tsx src/components/Log/HeartRateForm.tsx src/components/Log/TemperatureForm.tsx src/components/Log/SleepForm.tsx src/components/Log/StepsForm.tsx src/components/Log/WaterForm.tsx | awk -F: '{s+=$2} END{print s}'</automated>
  </verify>
  <done>`npm run build` (tsc -b && vite build) exits 0 with no TypeScript errors; the grep count above returns 6 (one `currentDate === todayISO()` gate per form); opening any metric's log form for TODAY with no entry still pre-fills the last logged value with the "Log {Metric}" button and no Delete button (unchanged); opening the same form for a PAST date with no entry shows empty field(s), the "Log {Metric}" button, and no Delete button; opening the form for any date (today or past) that already has a real entry still loads that entry's actual value(s) with "Update {Metric}" and a Delete button (G-02-4 unaffected).</done>
</task>

<task type="auto">
  <name>Task 2: Document the G-02-3 scope refinement in 02-UAT.md</name>
  <files>.planning/phases/02-charts-visualization/02-UAT.md</files>
  <action>
  In `02-UAT.md`'s `## Gaps` section, locate the existing `gap_id: G-02-3` entry (currently `status: resolved`, resolved by commit 74466eb). Do not change its `status`, `truth`, `reason`, `severity`, `root_cause`, or `resolved_by`/`resolved_at` fields — this is a refinement of an already-resolved gap, not a reopened or new gap. Immediately after its existing `resolved_at` line, add two new fields: `refinement:` with the text explaining that the most-recently-logged-value prefill was found to incorrectly apply to any date with no entry, including historic backfill dates, and has been narrowed to only apply when the selected date equals today (`todayISO()`) — historic dates with no entry now leave the field(s) empty instead of being prefilled; and `refinement_resolved_by:` referencing this task's commit using the same phrasing style as `resolved_by` (`"commit {SHORT_SHA} (fix(log): ...)"`) — fill in the real short SHA via `git log -1 --format=%h` after Task 1's commit is made.

  Do not alter the G-02-1, G-02-2, G-02-4, or G-02-5 entries, the `## Current Test`, `## Tests`, or `## Summary` sections, and do not renumber or reorder gap entries.
  </action>
  <verify>
    <automated>grep -A10 "gap_id: G-02-3" .planning/phases/02-charts-visualization/02-UAT.md | grep -c "status: resolved" && grep -A10 "gap_id: G-02-3" .planning/phases/02-charts-visualization/02-UAT.md | grep -c "refinement:"</automated>
  </verify>
  <done>The G-02-3 entry in 02-UAT.md still has `status: resolved` and its original `resolved_by`/`resolved_at`, and now also has `refinement` and `refinement_resolved_by` (with a real commit SHA, not a placeholder) documenting that the fallback prefill is scoped to today only.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| None new | Reads from the same local IndexedDB tables these forms already query; no new input surface, no new dependency, no network call |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-QUICK-01 | Tampering | Log form historic-date fallback branch | low | mitigate | The new `else` branch never queries or writes from a different date's data — it only clears local component state (`setValue("")` / `setBeddingTime("")` etc.), so a historic backfill can never be silently populated with, or accidentally saved as, another date's value — enforced by Task 1's action and confirmed in `<done>`. |
</threat_model>

<verification>
- `npm run build` exits 0 (TypeScript + Vite build clean)
- `grep -c 'currentDate === todayISO()' src/components/Log/WeightForm.tsx src/components/Log/HeartRateForm.tsx src/components/Log/TemperatureForm.tsx src/components/Log/SleepForm.tsx src/components/Log/StepsForm.tsx src/components/Log/WaterForm.tsx | awk -F: '{s+=$2} END{print s}'` returns 6
- `grep -A10 "gap_id: G-02-3" .planning/phases/02-charts-visualization/02-UAT.md | grep -c "refinement:"` returns 1
- Manual/visual: for each of the 6 metrics — (a) today with no entry still prefills the last logged value; (b) a past date with no entry shows empty field(s); (c) any date with a real existing entry still loads that entry's actual value(s) into an editable field with "Update {Metric}" and Delete button
</verification>

<success_criteria>
- All six metric log forms only prefill the most-recently-logged value when the selected date is today and has no entry (G-02-3, scoped correctly)
- All six metric log forms leave the field(s) empty when a non-today date has no entry (regression fixed)
- All six metric log forms are unaffected in the "entry already exists" path (G-02-4 preserved)
- 02-UAT.md's G-02-3 entry documents the refinement with a real commit reference, without changing its resolved status
</success_criteria>

<output>
Create `.planning/quick/260917-hwj-fix-regression-in-the-g-02-3-fallback-pr/260917-hwj-SUMMARY.md` when done
</output>
