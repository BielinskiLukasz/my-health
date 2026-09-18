/**
 * Pure personal-best detection math for Phase 3 (D-20/D-21/D-22).
 * No side effects, no Dexie access — mirrors targetCalcs.ts's pure-function
 * style. `usePersonalBestData` (Task 3) is the only caller that touches Dexie.
 */

/**
 * D-21: the 6 metric/direction pairs eligible for personal-best detection.
 * Weight appears twice (lowest-ever AND highest-ever are both "records").
 * Temperature is deliberately excluded — "personal best fever" makes no
 * sense (D-21 exclusion).
 */
export const PB_METRICS: {
  metric: "weight" | "sleep" | "steps" | "water" | "heartRate"
  direction: "max" | "min"
}[] = [
  { metric: "weight", direction: "max" },
  { metric: "weight", direction: "min" },
  { metric: "sleep", direction: "max" },
  { metric: "steps", direction: "max" },
  { metric: "water", direction: "max" },
  { metric: "heartRate", direction: "min" },
]

/**
 * D-22: retroactive full-history scan — read-only over its `entries` input,
 * never mutates it. Returns the best value per `direction`, resolving exact
 * ties in favor of the earlier date (deterministic tie-break for a
 * retroactive scan over historical data).
 */
export function detectPersonalBest(
  entries: { date: string; value: number }[],
  direction: "max" | "min"
): { value: number; date: string } | null {
  if (entries.length === 0) return null

  // Iterate ascending by date so a tie keeps the first-encountered
  // (earlier-dated) entry — read-only sort via slice(), never mutates input.
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

  let best = sorted[0]
  for (const entry of sorted.slice(1)) {
    const isBetter = direction === "max" ? entry.value > best.value : entry.value < best.value
    if (isBetter) best = entry
  }

  return { value: best.value, date: best.date }
}

/**
 * D-21/badge semantics: true only on a STRICT improvement over the cached
 * best — an exact tie never re-triggers the "🏆 Personal best!" badge.
 * `cachedBest === undefined` means this is the first-ever entry, which
 * always establishes the record.
 */
export function isNewPersonalBest(
  todayValue: number,
  cachedBest: number | undefined,
  direction: "max" | "min"
): boolean {
  if (cachedBest === undefined) return true
  return direction === "max" ? todayValue > cachedBest : todayValue < cachedBest
}

/**
 * CR-01/WR-02 fix: the only correct way to resolve "today's value" for a PB
 * check. Finds the entry whose own `date` strictly equals `today` and
 * returns its `value` — including a legitimate `0` — or `null` when no such
 * entry exists. Never falls back to a numeric sentinel (e.g. `0`), which
 * previously let "no data today" be mistaken for a real all-time-low
 * measurement and permanently poisoned min-direction PB caches (CR-01).
 * Callers must never scan an entire displayed period for "any past match"
 * (WR-02) — only an entry dated exactly `today` may trigger a PB check.
 */
export function resolveTodayValueForPbCheck(
  entries: { date: string; value: number }[],
  today: string
): number | null {
  const match = entries.find((e) => e.date === today)
  return match ? match.value : null
}
