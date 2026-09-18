import { describe, it, expect } from "vitest"
import {
  fitLinearTrend,
  projectPace,
  inferDirection,
  getOnTrackStatus,
  TOLERANCES,
  meetsTargetForDay,
  calculateStreak,
  calculateWeeklyStreak,
  getExerciseWeeklyStatus,
} from "./targetCalcs"

describe("fitLinearTrend", () => {
  it("returns null for an empty array (fewer than 2 points)", () => {
    expect(fitLinearTrend([])).toBeNull()
  })

  it("returns null for a single point (fewer than 2 points)", () => {
    expect(fitLinearTrend([{ date: "2026-01-01", value: 70 }])).toBeNull()
  })

  it("returns null for identical-value data (zero denominator/slope)", () => {
    const data = [
      { date: "2026-01-01", value: 70 },
      { date: "2026-01-02", value: 70 },
      { date: "2026-01-03", value: 70 },
    ]
    expect(fitLinearTrend(data)).toBeNull()
  })

  it("returns correct slope/intercept for a clean 3-point linear series", () => {
    // values: 70, 71, 72 at day indices 0, 1, 2 -> slope 1, intercept 70
    const data = [
      { date: "2026-01-01", value: 70 },
      { date: "2026-01-02", value: 71 },
      { date: "2026-01-03", value: 72 },
    ]
    const trend = fitLinearTrend(data)
    expect(trend).not.toBeNull()
    expect(trend!.slope).toBeCloseTo(1, 5)
    expect(trend!.intercept).toBeCloseTo(70, 5)
  })
})

describe("projectPace", () => {
  it("extrapolates a known trend to a known day offset via differenceInDays", () => {
    // slope 1, intercept 70 -> at day offset 5 from start, value = 75
    const trend = { slope: 1, intercept: 70 }
    const projected = projectPace(trend, "2026-01-01", "2026-01-06")
    expect(projected).toBeCloseTo(75, 5)
  })
})

describe("inferDirection", () => {
  it("returns 'down' when targetValue < currentValue", () => {
    expect(inferDirection(80, 70)).toBe("down")
  })

  it("returns 'up' when targetValue > currentValue", () => {
    expect(inferDirection(60, 70)).toBe("up")
  })

  it("returns 'up' when targetValue === currentValue (else branch)", () => {
    expect(inferDirection(70, 70)).toBe("up")
  })
})

describe("getOnTrackStatus", () => {
  it("returns 'grey' whenever dataPointCount < 7, regardless of gap", () => {
    // Huge gap, but insufficient data
    const status = getOnTrackStatus(
      100,
      { value: 70, direction: "down" },
      "weight",
      6
    )
    expect(status).toBe("grey")
  })

  it("returns 'grey' at exactly 6 data points even with a perfect gap", () => {
    const status = getOnTrackStatus(
      70,
      { value: 70, direction: "down" },
      "weight",
      6
    )
    expect(status).toBe("grey")
  })

  // Weight (direction: down) — ceiling semantics: gap = max(0, projected - value)
  it("weight/down: gap === tolerance (0.5) is green (inclusive)", () => {
    const status = getOnTrackStatus(
      70.5,
      { value: 70, direction: "down" },
      "weight",
      7
    )
    expect(status).toBe("green")
  })

  it("weight/down: gap === tolerance*2 (1.0) is yellow (inclusive)", () => {
    const status = getOnTrackStatus(
      71.0,
      { value: 70, direction: "down" },
      "weight",
      7
    )
    expect(status).toBe("yellow")
  })

  it("weight/down: gap just above tolerance (0.6) is yellow", () => {
    const status = getOnTrackStatus(
      70.6,
      { value: 70, direction: "down" },
      "weight",
      7
    )
    expect(status).toBe("yellow")
  })

  it("weight/down: gap above tolerance*2 (1.1) is red", () => {
    const status = getOnTrackStatus(
      71.1,
      { value: 70, direction: "down" },
      "weight",
      7
    )
    expect(status).toBe("red")
  })

  // Weight (direction: up) — floor semantics: gap = max(0, value - projected)
  it("weight/up: gap === tolerance (0.5) is green (inclusive)", () => {
    const status = getOnTrackStatus(
      69.5,
      { value: 70, direction: "up" },
      "weight",
      7
    )
    expect(status).toBe("green")
  })

  it("weight/up: gap above tolerance*2 is red", () => {
    const status = getOnTrackStatus(
      68.5,
      { value: 70, direction: "up" },
      "weight",
      7
    )
    expect(status).toBe("red")
  })

  it("weight/down: projected value BELOW target (overshoot) returns green (gap=0)", () => {
    const status = getOnTrackStatus(
      65,
      { value: 70, direction: "down" },
      "weight",
      7
    )
    expect(status).toBe("green")
  })

  // Steps — floor semantics: gap = max(0, value - projected)
  it("steps: gap === tolerance (500) is green (inclusive)", () => {
    const status = getOnTrackStatus(9500, { value: 10000 }, "steps", 7)
    expect(status).toBe("green")
  })

  it("steps: gap === tolerance*2 (1000) is yellow (inclusive)", () => {
    const status = getOnTrackStatus(9000, { value: 10000 }, "steps", 7)
    expect(status).toBe("yellow")
  })

  it("steps: gap above tolerance*2 is red", () => {
    const status = getOnTrackStatus(8000, { value: 10000 }, "steps", 7)
    expect(status).toBe("red")
  })

  // Water — floor semantics
  it("water: gap === tolerance (200) is green (inclusive)", () => {
    const status = getOnTrackStatus(1800, { value: 2000 }, "water", 7)
    expect(status).toBe("green")
  })

  it("water: gap === tolerance*2 (400) is yellow (inclusive)", () => {
    const status = getOnTrackStatus(1600, { value: 2000 }, "water", 7)
    expect(status).toBe("yellow")
  })

  it("water: gap above tolerance*2 is red", () => {
    const status = getOnTrackStatus(1500, { value: 2000 }, "water", 7)
    expect(status).toBe("red")
  })

  // Heart rate — ceiling semantics: gap = max(0, projected - value)
  it("heartRate: gap === tolerance (3) is green (inclusive)", () => {
    const status = getOnTrackStatus(63, { value: 60 }, "heartRate", 7)
    expect(status).toBe("green")
  })

  it("heartRate: gap === tolerance*2 (6) is yellow (inclusive)", () => {
    const status = getOnTrackStatus(66, { value: 60 }, "heartRate", 7)
    expect(status).toBe("yellow")
  })

  it("heartRate: gap above tolerance*2 is red", () => {
    const status = getOnTrackStatus(67, { value: 60 }, "heartRate", 7)
    expect(status).toBe("red")
  })

  // Sleep — range semantics: distance from nearest edge of [value-1.0, value+1.0]
  it("sleep: within range (0 gap) is green", () => {
    const status = getOnTrackStatus(8, { value: 8 }, "sleep", 7)
    expect(status).toBe("green")
  })

  it("sleep: gap === tolerance (0.5) beyond the range edge is green (inclusive)", () => {
    // range is [7,9]; edge distance 0.5 -> projected 9.5
    const status = getOnTrackStatus(9.5, { value: 8 }, "sleep", 7)
    expect(status).toBe("green")
  })

  it("sleep: gap === tolerance*2 (1.0) beyond the range edge is yellow (inclusive)", () => {
    // edge distance 1.0 -> projected 10.0
    const status = getOnTrackStatus(10.0, { value: 8 }, "sleep", 7)
    expect(status).toBe("yellow")
  })

  it("sleep: gap above tolerance*2 beyond the range edge is red", () => {
    const status = getOnTrackStatus(10.1, { value: 8 }, "sleep", 7)
    expect(status).toBe("red")
  })

  it("TOLERANCES has correct values per UI-SPEC", () => {
    expect(TOLERANCES).toEqual({
      weight: 0.5,
      sleep: 0.5,
      steps: 500,
      water: 200,
      heartRate: 3,
    })
  })
})

describe("meetsTargetForDay", () => {
  // D-19: no baseline yet -> day 1 auto-qualifies
  it("weight with no previousValue returns true (D-19)", () => {
    expect(
      meetsTargetForDay("weight", 70, { value: 68, direction: "down" }, undefined)
    ).toBe(true)
  })

  it("weight/down: 0.5kg below previous returns true", () => {
    expect(
      meetsTargetForDay("weight", 69.5, { value: 68, direction: "down" }, 70)
    ).toBe(true)
  })

  it("weight/down: exactly 0.1kg above previous (within 0.2kg steady tolerance) returns true (D-15)", () => {
    expect(
      meetsTargetForDay("weight", 70.1, { value: 68, direction: "down" }, 70)
    ).toBe(true)
  })

  it("weight/down: 0.5kg above previous returns false", () => {
    expect(
      meetsTargetForDay("weight", 70.5, { value: 68, direction: "down" }, 70)
    ).toBe(false)
  })

  it("weight/up: 0.5kg above previous returns true", () => {
    expect(
      meetsTargetForDay("weight", 70.5, { value: 75, direction: "up" }, 70)
    ).toBe(true)
  })

  it("weight/up: 0.5kg below previous returns false", () => {
    expect(
      meetsTargetForDay("weight", 69.5, { value: 75, direction: "up" }, 70)
    ).toBe(false)
  })

  it("sleep: within SLEEP_RANGE_HALF_WIDTH of target returns true", () => {
    expect(meetsTargetForDay("sleep", 8.5, { value: 8 }, undefined)).toBe(true)
  })

  it("sleep: outside SLEEP_RANGE_HALF_WIDTH of target returns false", () => {
    expect(meetsTargetForDay("sleep", 9.5, { value: 8 }, undefined)).toBe(false)
  })

  it("heartRate: at or below ceiling returns true", () => {
    expect(meetsTargetForDay("heartRate", 60, { value: 60 }, undefined)).toBe(true)
  })

  it("heartRate: above ceiling returns false", () => {
    expect(meetsTargetForDay("heartRate", 61, { value: 60 }, undefined)).toBe(false)
  })

  it("steps: at or above floor returns true", () => {
    expect(meetsTargetForDay("steps", 10000, { value: 10000 }, undefined)).toBe(true)
  })

  it("steps: below floor returns false", () => {
    expect(meetsTargetForDay("steps", 9999, { value: 10000 }, undefined)).toBe(false)
  })

  it("water: at or above floor returns true", () => {
    expect(meetsTargetForDay("water", 2000, { value: 2000 }, undefined)).toBe(true)
  })

  it("water: below floor returns false", () => {
    expect(meetsTargetForDay("water", 1999, { value: 2000 }, undefined)).toBe(false)
  })
})

describe("calculateStreak", () => {
  // D-19: single qualifying day at index 0 returns 1
  it("returns 1 for a single qualifying day", () => {
    expect(calculateStreak([{ hasEntry: true, metQualifies: true }])).toBe(1)
  })

  it("stops at the first hasEntry:false day (D-16, no grace day)", () => {
    const days = [
      { hasEntry: true, metQualifies: true },
      { hasEntry: true, metQualifies: true },
      { hasEntry: false, metQualifies: false },
      { hasEntry: true, metQualifies: true },
    ]
    expect(calculateStreak(days)).toBe(2)
  })

  it("stops at the first hasEntry:true,metQualifies:false day", () => {
    const days = [
      { hasEntry: true, metQualifies: true },
      { hasEntry: true, metQualifies: false },
      { hasEntry: true, metQualifies: true },
    ]
    expect(calculateStreak(days)).toBe(1)
  })

  it("returns 0 when the most recent day breaks immediately", () => {
    expect(calculateStreak([{ hasEntry: false, metQualifies: false }])).toBe(0)
  })

  it("keeps counting through a fluctuating-but-qualifying weight series (Pitfall 3)", () => {
    // up-then-down-then-up, all within tolerance -> all metQualifies:true
    const days = [
      { hasEntry: true, metQualifies: true },
      { hasEntry: true, metQualifies: true },
      { hasEntry: true, metQualifies: true },
      { hasEntry: true, metQualifies: true },
    ]
    expect(calculateStreak(days)).toBe(4)
  })
})

describe("calculateWeeklyStreak", () => {
  it("is a distinct function from calculateStreak (Pitfall 4)", () => {
    expect(calculateWeeklyStreak).not.toBe(calculateStreak)
  })

  it("returns 1 for a single met week", () => {
    expect(calculateWeeklyStreak([{ met: true }])).toBe(1)
  })

  it("stops at the first unmet week, walking most-recent-week-first", () => {
    const weeks = [
      { met: true },
      { met: true },
      { met: false },
      { met: true },
    ]
    expect(calculateWeeklyStreak(weeks)).toBe(2)
  })

  it("returns 0 when the most recent week is unmet", () => {
    expect(calculateWeeklyStreak([{ met: false }])).toBe(0)
  })
})

describe("getExerciseWeeklyStatus", () => {
  it("returns 'green' when weekCount === weeklyTarget", () => {
    expect(getExerciseWeeklyStatus(3, 3)).toBe("green")
  })

  it("returns 'green' when weekCount > weeklyTarget (overshoot)", () => {
    expect(getExerciseWeeklyStatus(5, 3)).toBe("green")
  })

  it("returns 'yellow' when weekCount is 1 below weeklyTarget", () => {
    expect(getExerciseWeeklyStatus(2, 3)).toBe("yellow")
  })

  it("returns 'yellow' when weekCount is 2 below weeklyTarget", () => {
    expect(getExerciseWeeklyStatus(1, 3)).toBe("yellow")
  })

  it("returns 'red' when weekCount is more than 2 below weeklyTarget", () => {
    expect(getExerciseWeeklyStatus(0, 4)).toBe("red")
  })

  it("has no 'grey' branch — always returns green/yellow/red", () => {
    const statuses = new Set<string>()
    for (let weekCount = 0; weekCount <= 5; weekCount++) {
      statuses.add(getExerciseWeeklyStatus(weekCount, 3))
    }
    expect(statuses.has("grey")).toBe(false)
  })
})
