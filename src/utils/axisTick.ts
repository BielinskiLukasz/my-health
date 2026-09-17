/**
 * Recharts renders a `YAxis` tick's raw numeric value verbatim as its label
 * whenever a tick lands on a data value or a domain boundary that carries
 * floating-point precision — e.g. `calcBmi()`'s weight/height^2 division
 * (`useBmiData.ts`) or `getYAxisDomain`'s `dataMin - N` / `dataMax + N`
 * formula (`chartDomain.ts`). This produces multi-digit-decimal tick labels
 * like "25.413580246913575" instead of a clean, honest number.
 *
 * `formatAxisTick` is display-only: it does not change any domain
 * computation in `chartDomain.ts`, only how a tick's value is rendered.
 */
export function formatAxisTick(value: number): string {
  return value.toFixed(1)
}
