import { describe, it, expect } from "vitest"
import { groupByDay, aggregateMonthly, type DailyPoint } from "./aggregation"

describe("groupByDay", () => {
  it("returns empty array for empty input", () => {
    expect(groupByDay([], "average")).toEqual([])
  })

  it("returns single point for single entry", () => {
    const result: DailyPoint[] = groupByDay(
      [{ date: "2026-09-10", value: 73 }],
      "average"
    )
    expect(result).toEqual([{ date: "2026-09-10", value: 73 }])
  })

  it("averages multiple entries on same day", () => {
    const result = groupByDay(
      [
        { date: "2026-09-10", value: 72 },
        { date: "2026-09-10", value: 74 },
      ],
      "average"
    )
    expect(result).toEqual([{ date: "2026-09-10", value: 73 }])
  })

  it("sums multiple entries on same day in sum mode", () => {
    const result = groupByDay(
      [
        { date: "2026-09-10", value: 100 },
        { date: "2026-09-10", value: 200 },
      ],
      "sum"
    )
    expect(result).toEqual([{ date: "2026-09-10", value: 300 }])
  })

  it("sorts results ascending by date", () => {
    const result = groupByDay(
      [
        { date: "2026-09-12", value: 10 },
        { date: "2026-09-10", value: 20 },
        { date: "2026-09-11", value: 30 },
      ],
      "average"
    )
    expect(result.map((r) => r.date)).toEqual([
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
    ])
  })
})

describe("aggregateMonthly", () => {
  it("returns empty array for empty input", () => {
    expect(aggregateMonthly([], "average")).toEqual([])
  })

  it("averages entries in same month", () => {
    const result = aggregateMonthly(
      [
        { date: "2026-09-01", value: 10 },
        { date: "2026-09-15", value: 20 },
      ],
      "average"
    )
    expect(result).toEqual([{ date: "2026-09", value: 15 }])
  })

  it("sums entries in same month in sum mode", () => {
    const result = aggregateMonthly(
      [
        { date: "2026-09-01", value: 10 },
        { date: "2026-09-15", value: 20 },
      ],
      "sum"
    )
    expect(result).toEqual([{ date: "2026-09", value: 30 }])
  })

  it("sorts results ascending by month", () => {
    const result = aggregateMonthly(
      [
        { date: "2026-11-01", value: 5 },
        { date: "2026-09-01", value: 10 },
        { date: "2026-10-01", value: 15 },
      ],
      "average"
    )
    expect(result.map((r) => r.date)).toEqual(["2026-09", "2026-10", "2026-11"])
  })
})
