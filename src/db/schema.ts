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
  direction?: "up" | "down" // inferred for weight only (D-02); undefined otherwise
  createdAt: string // full ISO timestamp
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
  }
}

export const db = new MyHealthDB()
