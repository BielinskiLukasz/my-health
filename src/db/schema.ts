import Dexie, { type EntityTable } from "dexie"

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

// Per D-15: separate tables per metric — NEVER a unified table
// Per D-16: weight + heartRate allow multiple per day (++id PK), others are one per day (date PK)
// Per D-17: dates as YYYY-MM-DD strings, timestamps as full ISO strings
// Per D-19: schema version 1 contains Phase 1 tables only

class MyHealthDB extends Dexie {
  weights!: EntityTable<Weight, "id">
  sleepEntries!: EntityTable<Sleep, "date">
  stepEntries!: EntityTable<Steps, "date">
  waterEntries!: EntityTable<Water, "date">
  heartRates!: EntityTable<HeartRate, "id">

  constructor() {
    super("MyHealthDB")
    this.version(1).stores({
      weights: "++id, date",
      sleepEntries: "date",
      stepEntries: "date",
      waterEntries: "date",
      heartRates: "++id, date",
    })
  }
}

export const db = new MyHealthDB()
