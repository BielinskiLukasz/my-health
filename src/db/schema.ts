import Dexie, { type EntityTable } from "dexie"
import type { MetricType } from "@/store/appStore"

// TypeScript interfaces for each metric table

export interface Weight {
  id?: number
  date: string // YYYY-MM-DD
  value: number
  timestamp: string // full ISO string
}

export interface Sleep {
  date: string // YYYY-MM-DD (primary key)
  beddingTime: string // full ISO timestamp
  wakeTime: string // full ISO timestamp
  duration?: number // computed minutes
}

export interface Steps {
  date: string // YYYY-MM-DD (primary key)
  steps: number
}

export interface Water {
  date: string // YYYY-MM-DD (primary key)
  ml: number
}

export interface HeartRate {
  id?: number
  date: string // YYYY-MM-DD
  bpm: number
  timestamp: string // full ISO string
}

export interface Temperature {
  id?: number
  date: string // YYYY-MM-DD
  celsius: number
  timestamp: string // full ISO string
}

// Phase 3 (D-19: additive-only, version 3)
export interface Target {
  metric: MetricType | "exercise" // primary key — one target per metric
  value: number
  targetDate?: string // YYYY-MM-DD; optional — exercise proxy target has no deadline (Plan 03-03)
  // Inferred for weight only (D-02); undefined for other metrics. `null` is the
  // explicit "not yet resolvable" state for weight (CR-03) — set when a weight
  // target is created before any weight entry exists — distinct from the
  // `undefined` that other metrics always carry. TypeScript-only widening; not
  // an indexed field, so no Dexie version bump is required for this change.
  direction?: "up" | "down" | null
  createdAt: string // full ISO timestamp
}

// Phase 3 Plan 02 (D-20/D-21/D-22, additive-only, version 4).
// `metric` excludes "exercise" and "temperature" — only the 5 PB-eligible
// core metrics (D-21 exclusion).
export interface PersonalBest {
  id?: number
  metric: "weight" | "sleep" | "steps" | "water" | "heartRate"
  direction: "max" | "min"
  value: number
  date: string // YYYY-MM-DD
}

// Phase 3 Plan 03 (D-01/D-07, additive-only, version 5).
// One boolean row per day — the lightweight exercise-frequency proxy ahead
// of Phase 4's real training-session schema.
export interface ExerciseLog {
  date: string // YYYY-MM-DD (primary key)
  logged: boolean
}

// Per D-15: separate tables per metric — NEVER a unified table
// Per D-16: weight + heartRate + temperature allow multiple per day (++id PK), others are one per day (date PK)
// Per D-17: dates as YYYY-MM-DD strings, timestamps as full ISO strings
// Per D-19: schema version 1 contains Phase 1 tables only; version 2 adds temperatures (additive)

class MyHealthDB extends Dexie {
  weights!: EntityTable<Weight, "id">
  sleepEntries!: EntityTable<Sleep, "date">
  stepEntries!: EntityTable<Steps, "date">
  waterEntries!: EntityTable<Water, "date">
  heartRates!: EntityTable<HeartRate, "id">
  temperatures!: EntityTable<Temperature, "id">
  targets!: EntityTable<Target, "metric">
  personalBests!: EntityTable<PersonalBest, "id">
  exerciseLog!: EntityTable<ExerciseLog, "date">

  constructor() {
    super("MyHealthDB")
    this.version(1).stores({
      weights: "++id, date",
      sleepEntries: "date",
      stepEntries: "date",
      waterEntries: "date",
      heartRates: "++id, date",
    })
    this.version(2).stores({
      temperatures: "++id, date",
    })
    this.version(3).stores({
      targets: "metric",
    })
    this.version(4).stores({
      personalBests: "++id, metric",
    })
    this.version(5).stores({
      exerciseLog: "date",
    })
  }
}

export const db = new MyHealthDB()
