import { describe, expect, it } from "vitest";
import { calculateSuggestedContribution } from "./suggested-contribution";

describe("calculateSuggestedContribution", () => {
  it("splits the remaining amount evenly over ~52 weeks for a 1-year goal", () => {
    const now = new Date("2025-01-01");
    const deadline = new Date("2026-01-01");
    const result = calculateSuggestedContribution({ targetAmount: 5200, alreadyContributed: 0, deadline, now });

    expect(result.remainingAmount).toBe(5200);
    expect(result.weeksRemaining).toBeCloseTo(52.14, 1);
    expect(result.weeklyAmount).toBeCloseTo(100, 0);
  });

  it("accounts for what's already been contributed", () => {
    const now = new Date("2025-01-01");
    const deadline = new Date("2026-01-01");
    const result = calculateSuggestedContribution({ targetAmount: 5200, alreadyContributed: 1200, deadline, now });

    expect(result.remainingAmount).toBe(4000);
  });

  it("never suggests a negative amount once the goal is fully funded", () => {
    const now = new Date("2025-01-01");
    const deadline = new Date("2026-01-01");
    const result = calculateSuggestedContribution({ targetAmount: 1000, alreadyContributed: 1500, deadline, now });

    expect(result.remainingAmount).toBe(0);
    expect(result.weeklyAmount).toBe(0);
  });

  it("floors the period at 1 to avoid dividing by zero for a past/today deadline", () => {
    const now = new Date("2025-06-01");
    const deadline = new Date("2025-01-01"); // already passed
    const result = calculateSuggestedContribution({ targetAmount: 1000, alreadyContributed: 0, deadline, now });

    expect(result.weeksRemaining).toBe(1);
    expect(result.monthsRemaining).toBe(1);
    expect(result.weeklyAmount).toBe(1000);
  });
});
