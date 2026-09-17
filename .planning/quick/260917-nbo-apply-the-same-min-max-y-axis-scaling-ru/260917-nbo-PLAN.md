---
phase: quick
plan: 260917-nbo
type: execute
wave: 1
depends_on: []
files_modified:
  - src/utils/chartDomain.ts
  - src/utils/chartDomain.test.ts
  - src/components/Charts/BmiSection.tsx
autonomous: true
requirements: [QUICK-260917-NBO]

estimate:
  tokens: 12000
  raw_tokens: 12000
  tasks: 2
  confidence: low

must_haves:
  truths:
    - "The BMI mini chart's Y-axis domain lower bound is always <= 18.5 and upper bound is always >= 25, so the Underweight/Normal/Overweight category reference lines (18.5, 25) stay visible in every chart state, regardless of the user's actual BMI history."
    - "When actual BMI data extends below 18.5 (Underweight) or above 25 (Overweight/Obese), the domain expands further, with ~1 BMI point of padding, to cover that data instead of clipping it — same padding convention already used for weight/heartRate/temperature in chartDomain.ts."
    - "The three existing ReferenceLine elements (y=18.5, y=25, y=30) in BmiSection.tsx render unchanged."
  artifacts:
    - src/utils/chartDomain.ts
    - src/utils/chartDomain.test.ts
    - src/components/Charts/BmiSection.tsx
  key_links:
    - "BmiSection.tsx's <YAxis domain={...} /> receives the literal [number, number] tuple returned by the new getBmiYAxisDomain(bmiValues) function in chartDomain.ts, computed from bmiData.map(d => d.bmi) inline in the component — mirroring the getYAxisDomain(metric) pattern already used for weight/heartRate/temperature, but returning numeric literals instead of Recharts' 'dataMin - N' string-formula domain, because the 18.5/25 clamp requires actual Math.min/Math.max arithmetic against fixed thresholds that a string-formula domain cannot express."
---

<objective>
BmiSection.tsx's mini BMI trend chart has no `YAxis` domain set, so Recharts defaults to a 0-anchored scale — the same class of bug G-02-5 already fixed for weight/heartRate/temperature. BMI needs its own domain logic (not the existing `getYAxisDomain(metric)` in chartDomain.ts, since `MetricType` doesn't include `"bmi"`), with an added constraint: the domain must never clip the 18.5 and 25 category-threshold reference lines, while still expanding to cover the actual data (with padding) when BMI falls in the Underweight or Overweight/Obese ranges.

Purpose: Consistent, honest Y-axis scaling on the BMI mini chart, matching the fix already applied to every other chart surface, without ever hiding the Underweight/Normal/Overweight boundary lines the chart's category coloring depends on.
Output: A new `getBmiYAxisDomain(bmiValues)` pure function (with unit tests) in `chartDomain.ts`, wired into `BmiSection.tsx`'s `YAxis`.
</objective>

<execution_context>
@C:/my-code/vibe-coding/my-health/.claude/gsd-core/workflows/execute-plan.md
@C:/my-code/vibe-coding/my-health/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@C:/my-code/vibe-coding/my-health/.planning/STATE.md
@C:/my-code/vibe-coding/my-health/src/utils/chartDomain.ts
@C:/my-code/vibe-coding/my-health/src/utils/chartDomain.test.ts
@C:/my-code/vibe-coding/my-health/src/components/Charts/BmiSection.tsx
@C:/my-code/vibe-coding/my-health/src/hooks/useBmiData.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add getBmiYAxisDomain pure function to chartDomain.ts</name>
  <files>src/utils/chartDomain.ts, src/utils/chartDomain.test.ts</files>
  <behavior>
    - Test 1: bmiValues entirely inside the healthy band, e.g. [20, 22] -> domain clamps to [18.5, 25] exactly (data-derived padded bounds are inside the fixed thresholds, so the thresholds win).
    - Test 2: bmiValues below 18.5 (Underweight), e.g. [15, 17] -> lower bound expands below 18.5 to cover the data with padding ([14, 25] with padding=1: min(15-1, 18.5)=14), upper bound stays anchored at 25.
    - Test 3: bmiValues above 25 (Overweight/Obese), e.g. [28, 32] -> upper bound expands above 25 to cover the data with padding ([18.5, 33] with padding=1: max(32+1, 25)=33), lower bound stays anchored at 18.5.
    - Test 4: empty bmiValues array -> returns the default [18.5, 25] (both thresholds, no data to expand around).
  </behavior>
  <action>
  In `src/utils/chartDomain.ts`, add a new exported constant `BMI_PADDING = 1` (documented inline as BMI points of padding, matching the padding style/comment convention already used for `Y_AXIS_PADDING`) and a new exported function `getBmiYAxisDomain(bmiValues: number[]): [number, number]`. Do not modify `MIN_MAX_SCALE_METRICS`, `Y_AXIS_PADDING`, or `getYAxisDomain` — BMI is intentionally NOT added to `MetricType`/`MIN_MAX_SCALE_METRICS`; this is a separate function because the 18.5/25 clamp needs real numeric min/max plus threshold comparisons, which Recharts' `'dataMin - N'` string-formula domain (used by `getYAxisDomain`) cannot express. Implementation: if `bmiValues.length === 0`, return `[18.5, 25]`. Otherwise compute `dataMin = Math.min(...bmiValues)` and `dataMax = Math.max(...bmiValues)`, then return `[Math.min(dataMin - BMI_PADDING, 18.5), Math.max(dataMax + BMI_PADDING, 25)]` — the lower bound is never higher than 18.5 and the upper bound is never lower than 25, per the four cases in `<behavior>`. Add a JSDoc comment above the function referencing the Underweight/Normal/Overweight reference lines it protects (18.5, 25) and noting the Obese line at 30 is not a clamp target (data may legitimately render above the visible frame's lower portion without needing a floor at 30). In `src/utils/chartDomain.test.ts`, add a new `describe("getBmiYAxisDomain", ...)` block below the existing `getYAxisDomain` tests, with one `it` per behavior case above, asserting exact `toEqual([lower, upper])` tuples.
  </action>
  <verify>
    <automated>npm run typecheck && npx vitest run src/utils/chartDomain.test.ts</automated>
  </verify>
  <done>`getBmiYAxisDomain` is exported from `chartDomain.ts`, returns `[18.5, 25]` for in-range data, expands the lower bound below 18.5 for Underweight data while holding the upper bound at 25, expands the upper bound above 25 for Overweight/Obese data while holding the lower bound at 18.5, and returns `[18.5, 25]` for an empty array. All four new tests in `chartDomain.test.ts` pass alongside the existing `getYAxisDomain` tests.</done>
</task>

<task type="auto">
  <name>Task 2: Wire getBmiYAxisDomain into BmiSection's YAxis</name>
  <files>src/components/Charts/BmiSection.tsx</files>
  <action>
  In `src/components/Charts/BmiSection.tsx`, add `getBmiYAxisDomain` to the import from `@/utils/chartDomain` (new import line, since this file currently imports nothing from that module). After the existing early returns (`error === "no-height"` and `bmiData.length === 0`) so `bmiData` is guaranteed non-empty, compute `const bmiDomain = getBmiYAxisDomain(bmiData.map((d) => d.bmi))` (using the `bmi` field per `BmiPoint`/`useBmiData.ts`, not `value`). Add `domain={bmiDomain}` to the existing `<YAxis>` element (currently at lines ~79-83, with `tick`, `axisLine={false}`, `tickLine={false}` props and no domain) — do not add `hide`, since this chart's YAxis ticks are currently visible and that visual behavior is out of scope for this fix. Leave the three `<ReferenceLine>` elements (y=18.5, y=25, y=30) exactly as they are — no changes to their props, order, or styling.
  </action>
  <verify>
    <automated>npm run typecheck && npm run lint && npx vitest run && grep -q "getBmiYAxisDomain" src/components/Charts/BmiSection.tsx && grep -q "domain={bmiDomain}" src/components/Charts/BmiSection.tsx</automated>
  </verify>
  <done>BmiSection.tsx imports and calls `getBmiYAxisDomain(bmiData.map((d) => d.bmi))`, storing the result in `bmiDomain`, and passes `domain={bmiDomain}` to its `YAxis`. The 18.5/25/30 ReferenceLines are unchanged. `npm run typecheck`, `npm run lint`, and `npx vitest run` all pass with no errors.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| None new | Pure client-side chart-rendering change; no new input surface, no new dependency, no network call |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-QUICK-NBO-01 | N/A | N/A | low | accept | No security-relevant surface touched — a display-only Y-axis domain calculation added to an existing chart util and wired into one existing component. |
</threat_model>

<verification>
- `npm run typecheck` exits 0
- `npm run lint` exits 0
- `npx vitest run` passes, including the four new `getBmiYAxisDomain` cases in `chartDomain.test.ts`
- `grep -q "getBmiYAxisDomain" src/components/Charts/BmiSection.tsx` and `grep -q "domain={bmiDomain}" src/components/Charts/BmiSection.tsx` both match
- Manual/visual: with a BMI history entirely between 18.5-25, the mini chart shows both the 18.5 and 25 reference lines in frame; with a history extending below 18.5 or above 25, the chart expands to show the actual trend while both reference lines remain visible
</verification>

<success_criteria>
- BMI mini chart's Y-axis domain lower bound is always <= 18.5 and upper bound is always >= 25
- Domain expands (with ~1 BMI point padding) to cover actual data outside the 18.5-25 range instead of clipping it
- ReferenceLine elements at 18.5, 25, 30 are unchanged
- `npm run typecheck`, `npm run lint`, and `npx vitest run` all pass
</success_criteria>

<output>
Create `.planning/quick/260917-nbo-apply-the-same-min-max-y-axis-scaling-ru/260917-nbo-SUMMARY.md` when done
</output>
