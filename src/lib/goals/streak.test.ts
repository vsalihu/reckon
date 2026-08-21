import { describe, expect, it } from "vitest";
import { calculateGoalStreak, type StreakContribution } from "./streak";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const createdAt = new Date("2025-01-01T00:00:00Z");
// target=300, 10-week deadline -> exactly £30/week required if paced evenly.
const deadline = new Date(createdAt.getTime() + 10 * WEEK_MS);

function contributionInWeek(weekIndex: number, amount: number): StreakContribution {
  return { amount, contributedAt: new Date(createdAt.getTime() + weekIndex * WEEK_MS + DAY_MS) };
}

describe("calculateGoalStreak", () => {
  it("is 0 for a goal younger than one completed week", () => {
    const now = new Date(createdAt.getTime() + 3 * DAY_MS);
    const result = calculateGoalStreak({ targetAmount: 300, createdAt, deadline, contributions: [], now });
    expect(result.currentStreakWeeks).toBe(0);
  });

  it("counts every completed week as a streak when pace is met throughout", () => {
    const now = new Date(createdAt.getTime() + 4 * WEEK_MS); // exactly 4 completed weeks
    const contributions = [
      contributionInWeek(0, 30),
      contributionInWeek(1, 30),
      contributionInWeek(2, 30),
      contributionInWeek(3, 30),
    ];
    const result = calculateGoalStreak({ targetAmount: 300, createdAt, deadline, contributions, now });
    expect(result.currentStreakWeeks).toBe(4);
  });

  it("resets to 0 when the most recent completed week was missed", () => {
    const now = new Date(createdAt.getTime() + 4 * WEEK_MS);
    const contributions = [contributionInWeek(0, 30), contributionInWeek(1, 30), contributionInWeek(2, 30)];
    // week 3 (most recent) has no contribution
    const result = calculateGoalStreak({ targetAmount: 300, createdAt, deadline, contributions, now });
    expect(result.currentStreakWeeks).toBe(0);
  });

  it("only counts the trailing consecutive run, stopping at an earlier gap", () => {
    // Long deadline so a single missed week barely moves the required pace —
    // isolates "trailing streak" behaviour from the pace-recalculation this
    // module deliberately does after a miss (see the test above/below).
    const longDeadline = new Date(createdAt.getTime() + 100 * WEEK_MS);
    const now = new Date(createdAt.getTime() + 4 * WEEK_MS);
    const contributions = [
      contributionInWeek(0, 50),
      // week 1 missed
      contributionInWeek(2, 50),
      contributionInWeek(3, 50),
    ];
    const result = calculateGoalStreak({ targetAmount: 300, createdAt, deadline: longDeadline, contributions, now });
    expect(result.currentStreakWeeks).toBe(2); // weeks 3 and 2, stop at missed week 1
  });

  it("raises the required pace for weeks after a miss, so merely repeating the old amount can fall short", () => {
    const now = new Date(createdAt.getTime() + 3 * WEEK_MS);
    // £30/week was the original even pace; after missing week 1, week 2
    // needs more than £30 to still count as "met" under the recalculated pace.
    const contributions = [contributionInWeek(0, 30), contributionInWeek(2, 30)];
    const result = calculateGoalStreak({ targetAmount: 300, createdAt, deadline, contributions, now });
    expect(result.currentStreakWeeks).toBe(0);
  });

  it("never goes negative", () => {
    const now = new Date(createdAt.getTime() + 1 * WEEK_MS);
    const result = calculateGoalStreak({ targetAmount: 300, createdAt, deadline, contributions: [], now });
    expect(result.currentStreakWeeks).toBe(0);
  });

  it("treats an already-funded goal as meeting every week automatically", () => {
    const now = new Date(createdAt.getTime() + 3 * WEEK_MS);
    // Fully funded in week 0 — no further contributions needed in weeks 1, 2.
    const contributions = [contributionInWeek(0, 300)];
    const result = calculateGoalStreak({ targetAmount: 300, createdAt, deadline, contributions, now });
    expect(result.currentStreakWeeks).toBe(3);
  });

  it("exceeding the suggested amount still counts as met", () => {
    const now = new Date(createdAt.getTime() + 1 * WEEK_MS);
    const contributions = [contributionInWeek(0, 100)]; // well over the £30 required
    const result = calculateGoalStreak({ targetAmount: 300, createdAt, deadline, contributions, now });
    expect(result.currentStreakWeeks).toBe(1);
  });
});
