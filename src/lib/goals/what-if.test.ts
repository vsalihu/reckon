import { describe, expect, it } from "vitest";
import { calculateWhatIfProjection } from "./what-if";

const now = new Date("2025-01-01T00:00:00Z");

describe("calculateWhatIfProjection", () => {
  it("solves weeks-to-complete and a matching projected date", () => {
    const result = calculateWhatIfProjection({ remainingAmount: 500, contributionAmount: 100, period: "weekly", now });
    expect(result.periodsToComplete).toBe(5);
    expect(result.projectedDate).not.toBeNull();
    expect(result.projectedDate!.getTime() - now.getTime()).toBeCloseTo(5 * 7 * 24 * 60 * 60 * 1000, -3);
  });

  it("rounds up a partial final period rather than under-shooting", () => {
    // 500 / 120 = 4.166... -> needs 5 full periods to actually clear it
    const result = calculateWhatIfProjection({ remainingAmount: 500, contributionAmount: 120, period: "weekly", now });
    expect(result.periodsToComplete).toBe(5);
  });

  it("is immediate (0 periods) for an already-funded goal", () => {
    const result = calculateWhatIfProjection({ remainingAmount: 0, contributionAmount: 50, period: "monthly", now });
    expect(result.periodsToComplete).toBe(0);
    expect(result.projectedDate).toEqual(now);
  });

  it("is immediate for a goal that's over-funded (negative remaining)", () => {
    const result = calculateWhatIfProjection({ remainingAmount: -20, contributionAmount: 50, period: "monthly", now });
    expect(result.periodsToComplete).toBe(0);
  });

  it("returns no projection for a 0 contribution on an unfunded goal — it would never complete", () => {
    const result = calculateWhatIfProjection({ remainingAmount: 500, contributionAmount: 0, period: "weekly", now });
    expect(result.periodsToComplete).toBeNull();
    expect(result.projectedDate).toBeNull();
  });

  it("uses a longer period length for monthly than weekly, same contribution rate", () => {
    const weekly = calculateWhatIfProjection({ remainingAmount: 1000, contributionAmount: 100, period: "weekly", now });
    const monthly = calculateWhatIfProjection({ remainingAmount: 1000, contributionAmount: 100, period: "monthly", now });
    // Same number of periods (10), but a month is longer than a week, so the monthly date is further out.
    expect(weekly.periodsToComplete).toBe(monthly.periodsToComplete);
    expect(monthly.projectedDate!.getTime()).toBeGreaterThan(weekly.projectedDate!.getTime());
  });
});
