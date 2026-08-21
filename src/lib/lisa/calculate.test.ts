import { describe, expect, it } from "vitest";
import { calculateLisaBonus, ukTaxYearLabelFor } from "./calculate";

describe("ukTaxYearLabelFor", () => {
  it("labels a date after 6 April as that calendar year's tax year", () => {
    expect(ukTaxYearLabelFor(new Date("2025-04-06"))).toBe("2025/26");
    expect(ukTaxYearLabelFor(new Date("2025-12-25"))).toBe("2025/26");
  });

  it("labels a date before 6 April as the previous calendar year's tax year", () => {
    expect(ukTaxYearLabelFor(new Date("2025-04-05"))).toBe("2024/25");
    expect(ukTaxYearLabelFor(new Date("2026-01-15"))).toBe("2025/26");
  });
});

describe("calculateLisaBonus", () => {
  it("gives a straightforward 25% bonus under the annual limit", () => {
    const result = calculateLisaBonus([{ amount: 2_000, contributedAt: new Date("2025-06-01") }]);
    expect(result.totalContributed).toBe(2_000);
    expect(result.totalBonus).toBeCloseTo(500, 2);
    expect(result.totalAvailable).toBeCloseTo(2_500, 2);
  });

  it("caps the bonus at the annual limit when a single tax year's contributions exceed it", () => {
    const result = calculateLisaBonus([{ amount: 5_000, contributedAt: new Date("2025-06-01") }]);
    expect(result.totalContributed).toBe(5_000); // all of it still counts as saved
    expect(result.totalBonus).toBeCloseTo(1_000, 2); // capped at £4,000 * 25%
    expect(result.byTaxYear[0].exceededAnnualLimit).toBe(true);
  });

  it("resets the cap for each tax year, summing bonuses across years", () => {
    const result = calculateLisaBonus([
      { amount: 4_000, contributedAt: new Date("2024-06-01") }, // 2024/25
      { amount: 4_000, contributedAt: new Date("2025-06-01") }, // 2025/26
    ]);
    expect(result.byTaxYear).toHaveLength(2);
    expect(result.totalContributed).toBe(8_000);
    expect(result.totalBonus).toBeCloseTo(2_000, 2); // £1,000 bonus per year
    expect(result.totalAvailable).toBeCloseTo(10_000, 2);
  });

  it("sums multiple contributions within the same tax year before applying the cap", () => {
    const result = calculateLisaBonus([
      { amount: 2_000, contributedAt: new Date("2025-05-01") },
      { amount: 2_500, contributedAt: new Date("2025-11-01") },
    ]);
    expect(result.byTaxYear[0].contributed).toBe(4_500);
    expect(result.byTaxYear[0].eligibleForBonus).toBe(4_000); // capped
    expect(result.byTaxYear[0].bonus).toBeCloseTo(1_000, 2);
  });

  it("is £0/£0 for no contributions", () => {
    const result = calculateLisaBonus([]);
    expect(result.totalContributed).toBe(0);
    expect(result.totalBonus).toBe(0);
    expect(result.totalAvailable).toBe(0);
    expect(result.byTaxYear).toEqual([]);
  });
});
