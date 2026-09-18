# Phase 3: Targets & Goals - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-18
**Phase:** 3-Targets & Goals
**Areas discussed:** Target scope & direction, Pace & on-track calculation, Streak definition, Personal bests scope

---

## Target scope & direction

| Option | Description | Selected |
|--------|-------------|----------|
| Skip exercise-frequency target in Phase 3 | Defer to Phase 4, once training sessions exist | |
| Lightweight proxy now | Minimal "sessions logged this week" counter target now | ✓ |

**User's choice:** Lightweight proxy now
**Notes:** Follow-up clarified the proxy is backed by a new minimal Dexie table (one row per day, boolean), not an inference from existing data.

| Option | Description | Selected |
|--------|-------------|----------|
| Both directions, inferred | Direction (lose/gain) inferred from target vs. current weight | ✓ |
| Lose-only | Assume weight targets are always about losing | |

**User's choice:** Both directions, inferred

| Option | Description | Selected |
|--------|-------------|----------|
| Ceiling (lower is better) | Target is a single number; get under it | ✓ |
| Target range (min-max band) | Target is a band | |

**User's choice:** Ceiling (lower is better)

| Option | Description | Selected |
|--------|-------------|----------|
| Unchanged from Phase 2 | No target set → tile stays as-is | ✓ |
| Show a "Set a target" prompt | Tile shows a CTA nudge | |

**User's choice:** Unchanged from Phase 2

| Option | Description | Selected |
|--------|-------------|----------|
| New minimal table, one row/day | New Dexie table with a toggle/checkbox | ✓ |
| Reuse an existing signal | Infer from e.g. steps threshold | |

**User's choice:** New minimal table, one row/day

| Option | Description | Selected |
|--------|-------------|----------|
| At least X hours | Simple floor target | |
| Around X hours (range) | Both under/oversleeping count against it | ✓ |

**User's choice:** Around X hours (range)

| Option | Description | Selected |
|--------|-------------|----------|
| Settings screen, list of all targets | One place to manage all targets | |
| Per-metric, from the chart screen | Set target in context on /chart/:metric | ✓ |

**User's choice:** Per-metric, from the chart screen

| Option | Description | Selected |
|--------|-------------|----------|
| New 7th tile | Exercise gets its own Dashboard tile | ✓ |
| No tile — behind the scenes | Only a toggle, no tile | |

**User's choice:** New 7th tile

| Option | Description | Selected |
|--------|-------------|----------|
| Streak resets on target change | Fresh count on edit | |
| Streak persists across edits | Keeps counting through edits | ✓ |

**User's choice:** Streak persists across edits
**Notes:** User asked to revisit this answer mid-session after a disk-level corruption garbled the recorded value to something matching neither option; re-confirmed via a fresh AskUserQuestion and the original choice ("Streak persists across edits") was reconfirmed.

---

## Pace & on-track calculation

| Option | Description | Selected |
|--------|-------------|----------|
| Linear trend, recent window | Fit trend over last N days, extrapolate to deadline | ✓ |
| Required daily rate vs. actual daily rate | Compare needed rate to actual rate | |

**User's choice:** Linear trend, recent window

| Option | Description | Selected |
|--------|-------------|----------|
| Thresholds on projected-vs-target gap | Green/yellow/red based on projection gap | ✓ |
| Thresholds on time-remaining vs. progress-made | Compare % progress to % time elapsed | |

**User's choice:** Thresholds on projected-vs-target gap

| Option | Description | Selected |
|--------|-------------|----------|
| Neutral/grey — "Not enough data yet" | Avoid a misleading color on day 1 | ✓ |
| Default to yellow | Safe middle-ground default | |

**User's choice:** Neutral/grey — "Not enough data yet"

| Option | Description | Selected |
|--------|-------------|----------|
| 3 days | Minimal wait, noisier trend | |
| 7 days | One full week, matches existing W period | ✓ |

**User's choice:** 7 days

| Option | Description | Selected |
|--------|-------------|----------|
| Distance from nearest edge | One gap formula for range/ceiling targets | ✓ |
| Simplify to point + tolerance | Treat range/ceiling as point ± tolerance | |

**User's choice:** Distance from nearest edge

| Option | Description | Selected |
|--------|-------------|----------|
| Reference line + status badge | Target line (BmiSection pattern) + R/Y/G badge | ✓ |
| Status badge only, no line | Just the badge in the chart header | |

**User's choice:** Reference line + status badge

---

## Streak definition

| Option | Description | Selected |
|--------|-------------|----------|
| Logged + within target that day | Day counts only if entry met the target | ✓ |
| Logged at all (any value) | Any entry counts, regardless of value | |

**User's choice:** Logged + within target that day

| Option | Description | Selected |
|--------|-------------|----------|
| Any day with no qualifying entry | Streak resets immediately | ✓ |
| Grace day allowance | One missed day per week tolerated | |

**User's choice:** Any day with no qualifying entry

| Option | Description | Selected |
|--------|-------------|----------|
| Consecutive weeks hitting weekly target | Matches the proxy's weekly cadence | ✓ |
| Consecutive days with a session logged | Daily streak shape, like other metrics | |

**User's choice:** Consecutive weeks hitting weekly target

| Option | Description | Selected |
|--------|-------------|----------|
| Moved toward goal vs. yesterday | Daily directional check for weight | ✓ |
| That day's pace status was green | Reuse the 7-day pace/color logic | |

**User's choice:** Moved toward goal vs. yesterday

| Option | Description | Selected |
|--------|-------------|----------|
| Per-metric only | Each metric shows its own streak | ✓ |
| Also show a combined streak | Add an "all-targets" streak too | |

**User's choice:** Per-metric only

| Option | Description | Selected |
|--------|-------------|----------|
| 0 until first qualifying day completes | No special-casing for day 1 | |
| 1 immediately if today qualifies | Streak shows 1 right away | ✓ |

**User's choice:** 1 immediately if today qualifies

---

## Personal bests scope

| Option | Description | Selected |
|--------|-------------|----------|
| Chart screen + Dashboard tile | PB badge on both existing screens | ✓ |
| Dashboard only | Just the tile, no chart-screen change | |

**User's choice:** Chart screen + Dashboard tile

| Option | Description | Selected |
|--------|-------------|----------|
| All 6, direction per metric | Every metric except temperature gets a PB | ✓ |
| Only metrics with an active target | Tie PB detection to the target system | |

**User's choice:** All 6, direction per metric

| Option | Description | Selected |
|--------|-------------|----------|
| Full history, retroactive | Scan all existing entries once, then detect forward | ✓ |
| Forward-only from today | Only new entries can become a PB | |

**User's choice:** Full history, retroactive

---

## Claude's Discretion

- Exact Dexie schema/version bump shape for the new `targets` and `exerciseLog` tables (additive migration).
- Precise numeric tolerance bands for "green" status per metric unit.
- Exact linear-regression method for the 7-day trend fit (simple least-squares assumed sufficient).

## Deferred Ideas

- Full Training Sessions tracking (Phase 4) — the exercise-frequency proxy (D-01) is an explicit stopgap for this.
- History list PB flagging (Phase 5, HIST-01/02).
- Exercise detail view PB flagging (Phase 4).
- Combined "all-targets" streak — considered and declined.
