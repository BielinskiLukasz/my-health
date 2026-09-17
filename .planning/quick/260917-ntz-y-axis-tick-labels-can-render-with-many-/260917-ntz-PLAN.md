---
phase: quick
plan: 260917-ntz
type: execute
wave: 1
depends_on: []
files_modified:
  - src/utils/axisTick.ts
  - src/utils/axisTick.test.ts
  - src/components/Charts/BmiSection.tsx
  - src/components/Charts/MetricChart.tsx
autonomous: true
requirements: [QUICK-260917-NTZ]

estimate:
  tokens: 14000
  raw_tokens: 14000
  tasks: 2
  confidence: low

must_haves:
  truths:
    - "The BMI mini chart's Y-axis tick labels always display at most 1 decimal place, never the raw multi-digit float calcBmi() produces (e.g. 22.857142857142858), regardless of whether a tick lands on a data value or on the domain boundary computed by getBmiYAxisDomain."
    - "Weight, heart rate, and temperature chart Y-axis tick labels — the three metrics whose getYAxisDomain returns a 'dataMin - N'/'dataMax + N' formula domain, inheriting the same raw-decimal precision risk as BMI — are formatted to 1 decimal place too, for the same defensive reason."
    - "Steps, sleep, and water chart Y-axis tick labels are unchanged: no tickFormatter applies where getYAxisDomain returns undefined, so their existing whole-number auto-scaled ticks (e.g. '8000') do not gain a spurious '.0' suffix."
  artifacts:
    - src/utils/axisTick.ts
    - src/utils/axisTick.test.ts
    - src/components/Charts/BmiSection.tsx
    - src/components/Charts/MetricChart.tsx
  key_links:
    - "BmiSection.tsx's <YAxis tickFormatter={formatAxisTick}> and MetricChart.tsx's two <YAxis tickFormatter={yAxisDomain ? formatAxisTick : undefined}> (line-chart and bar-chart branches) all import the same formatAxisTick pure function from the new src/utils/axisTick.ts, so the 1-decimal display rule is defined once and reused everywhere a tick can inherit domain-derived decimal precision, without duplicating chartDomain.ts's domain math."
---

<objective>
Y-axis tick labels can render with many decimal digits (e.g. 25.413580246913575) instead of 1 decimal place. Root cause: `useBmiData.ts`'s `calcBmi()` produces raw unrounded BMI values (weight/height^2, recurring decimals), and `getBmiYAxisDomain`'s `dataMax + BMI_PADDING` inherits that precision — since `BmiSection.tsx`'s `YAxis` has no `tickFormatter`, Recharts renders the raw float as an axis tick label whenever a tick lands on that domain boundary. `MetricChart.tsx`'s weight/heartRate/temperature `YAxis` domains are sourced from `getYAxisDomain`'s equally decimal-precision `dataMin`/`dataMax` formula, carrying the same risk; steps/sleep/water use no domain formula (`getYAxisDomain` returns `undefined`) so their ticks are already clean whole numbers and must not be forced into `"8000.0"`-style output.

Fix: add a single shared `formatAxisTick` pure function (`toFixed(1)`) and wire it into `BmiSection.tsx`'s `YAxis` unconditionally, and into `MetricChart.tsx`'s two `YAxis` elements only when `yAxisDomain` is set (weight/heartRate/temperature) — reusing the same truthiness the domain-scaling fix (G-02-5) already established, so the tick-formatting rule always tracks the same metric set as the domain rule with zero duplication. Domain computation math in `chartDomain.ts` is untouched — this is purely display/tickFormatter, matching the existing app-wide `.toFixed(1)` convention already used in `ChartHeader.tsx` (avg/min/max stat) and `CustomTooltip.tsx` (hover value).

Purpose: Chart Y-axes read as clean, honest numbers everywhere, not leaking implementation-detail floating-point precision to the user.
Output: New `src/utils/axisTick.ts` (+ `axisTick.test.ts`) exporting `formatAxisTick`; wired into `BmiSection.tsx`'s `YAxis` and both of `MetricChart.tsx`'s `YAxis` elements.
</objective>

<execution_context>
@C:/my-code/vibe-coding/my-health/.claude/gsd-core/workflows/execute-plan.md
@C:/my-code/vibe-coding/my-health/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@C:/my-code/vibe-coding/my-health/.planning/STATE.md
@C:/my-code/vibe-coding/my-health/src/components/Charts/BmiSection.tsx
@C:/my-code/vibe-coding/my-health/src/hooks/useBmiData.ts
@C:/my-code/vibe-coding/my-health/src/utils/chartDomain.ts
@C:/my-code/vibe-coding/my-health/src/utils/chartDomain.test.ts
@C:/my-code/vibe-coding/my-health/src/components/Charts/MetricChart.tsx
@C:/my-code/vibe-coding/my-health/src/components/Charts/CustomTooltip.tsx
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add formatAxisTick pure function</name>
  <files>src/utils/axisTick.ts, src/utils/axisTick.test.ts</files>
  <behavior>
    - formatAxisTick(25.413580246913575) returns "25.4" — the exact recurring-decimal shape from the bug report.
    - formatAxisTick(22.857142857142858) returns "22.9" — a calcBmi()-style weight/height^2 recurring decimal.
    - formatAxisTick(25) returns "25.0" — a whole-number domain boundary (e.g. the BMI Overweight threshold) still gets exactly 1 decimal, never rendered bare.
  </behavior>
  <action>
  Create `src/utils/axisTick.ts` exporting a single function `formatAxisTick(value: number): string` that returns `value.toFixed(1)`. Add a short doc comment above it explaining the purpose (Recharts renders raw floats verbatim as Y-axis tick labels whenever a tick lands on a data value or a domain boundary carrying floating-point precision — from `calcBmi()`'s weight/height^2 division or `getYAxisDomain`'s `dataMin`/`dataMax` formula) and noting this is display-only — it does not change any domain computation in `chartDomain.ts`. Match the inline-comment style already used in `chartDomain.ts`.

  Write the RED test first in `src/utils/axisTick.test.ts` (vitest, `environment: "node"` per `vite.config.ts` — a pure function needs no DOM, matching `chartDomain.test.ts`'s pattern), asserting the three behaviors above with `toBe(...)` string equality. Confirm the test fails against a stub/missing implementation, then implement `axisTick.ts` until it passes.
  </action>
  <verify>
    <automated>npm test -- src/utils/axisTick.test.ts</automated>
  </verify>
  <done>`formatAxisTick` is exported from `src/utils/axisTick.ts`, returns a string formatted to exactly 1 decimal place via `toFixed(1)` for any numeric input, and all three new cases in `axisTick.test.ts` pass.</done>
</task>

<task type="auto">
  <name>Task 2: Wire formatAxisTick into BmiSection and MetricChart YAxis ticks</name>
  <files>src/components/Charts/BmiSection.tsx, src/components/Charts/MetricChart.tsx</files>
  <action>
  In `src/components/Charts/BmiSection.tsx`, add a new import `import { formatAxisTick } from "@/utils/axisTick"`, then add `tickFormatter={formatAxisTick}` to the existing `<YAxis>` element (currently has `domain={bmiDomain}`, `tick`, `axisLine={false}`, `tickLine={false}`, and no `tickFormatter`) — unconditionally, since every BMI value comes from `calcBmi()`'s raw division and can carry recurring decimals at any tick position, including the domain boundary itself (`dataMax + BMI_PADDING`). Do not touch the X-axis's existing `xTickFormatter`, and do not touch the three `<ReferenceLine>` elements — their `label={{ value: "18.5", ... }}` props are already fixed strings, not derived from data, so they are unaffected by this bug.

  In `src/components/Charts/MetricChart.tsx`, add `formatAxisTick` to the import from `@/utils/axisTick` (new import line), and add `tickFormatter={yAxisDomain ? formatAxisTick : undefined}` to BOTH `<YAxis>` elements — the one in the `LineChart` branch and the one in the `BarChart` branch — reusing the already-computed `yAxisDomain` variable (from `getYAxisDomain(metric)`) as the condition. `yAxisDomain` is only a `['dataMin - N', 'dataMax + N']` tuple for weight/heartRate/temperature (the metrics that can inherit domain-derived decimal precision) and `undefined` for steps/sleep/water, whose Y-axis stays at Recharts' default 0-start whole-number auto-scale — forcing `toFixed(1)` on those would turn a clean integer tick like `"8000"` into `"8000.0"`, a cosmetic regression the metric's count semantics don't warrant. Do not introduce a new per-metric allowlist for this — reuse `yAxisDomain`'s existing truthiness so the tick-formatting rule always tracks exactly the same metric set as the domain-scaling rule already established in `chartDomain.ts` (G-02-5), with zero duplication.
  </action>
  <verify>
    <automated>npm run typecheck && npm run lint && npx vitest run && grep -q "tickFormatter={formatAxisTick}" src/components/Charts/BmiSection.tsx && test "$(grep -c 'tickFormatter={yAxisDomain ? formatAxisTick : undefined}' src/components/Charts/MetricChart.tsx)" = "2"</automated>
  </verify>
  <done>`BmiSection.tsx`'s `YAxis` renders tick labels formatted to 1 decimal place via `formatAxisTick`, unconditionally. `MetricChart.tsx`'s `YAxis` in both the line-chart and bar-chart branches applies `formatAxisTick` only when `yAxisDomain` is set (weight/heartRate/temperature), leaving steps/sleep/water tick labels as unformatted whole numbers. `npm run typecheck`, `npm run lint`, and `npx vitest run` all pass with no errors.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| None new | Pure client-side chart tick-label formatting change; no new input surface, no new dependency, no network call |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-QUICK-NTZ-01 | N/A | N/A | low | accept | No security-relevant surface touched — a display-only Y-axis tick formatter added to a new pure-function util and wired into two existing chart components. |
</threat_model>

<verification>
- `npm test -- src/utils/axisTick.test.ts` passes (3 assertions)
- `npm run typecheck` exits 0
- `npm run lint` exits 0
- `npx vitest run` passes (full suite, including existing `chartDomain.test.ts`, `bmi.test.ts`, `aggregation.test.ts`, `UpdatePrompt.test.tsx`, and the new `axisTick.test.ts`)
- `grep -q "tickFormatter={formatAxisTick}" src/components/Charts/BmiSection.tsx` matches
- `grep -c "tickFormatter={yAxisDomain ? formatAxisTick : undefined}" src/components/Charts/MetricChart.tsx` returns 2
- Manual/visual: BMI mini chart and weight/heartRate/temperature charts show Y-axis ticks with exactly 1 decimal place even at domain boundaries; steps/sleep/water charts still show clean whole-number ticks (e.g. "8000", not "8000.0")
</verification>

<success_criteria>
- BMI mini chart's Y-axis ticks never render a raw multi-digit-decimal float
- Weight, heart rate, and temperature charts' Y-axis ticks are formatted to 1 decimal place, matching BMI and the existing `ChartHeader.tsx`/`CustomTooltip.tsx` `.toFixed(1)` convention
- Steps, sleep, and water charts' Y-axis ticks remain unformatted whole numbers (no regression)
- `npm run typecheck`, `npm run lint`, and `npx vitest run` all pass
</success_criteria>

<output>
Create `.planning/quick/260917-ntz-y-axis-tick-labels-can-render-with-many-/260917-ntz-SUMMARY.md` when done
</output>
