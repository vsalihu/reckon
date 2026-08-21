import { describe, expect, it } from "vitest";
import { calculateBudgetRuleCheck } from "./budget-rule";

describe("calculateBudgetRuleCheck", () => {
  it("reports 0 delta when spending exactly matches the 50/30/20 split", () => {
    const result = calculateBudgetRuleCheck({ afterTaxIncome: 2000, needsSpent: 1000, wantsSpent: 600, savingsTotal: 400 });

    const needs = result.buckets.find((b) => b.label === "Needs")!;
    const wants = result.buckets.find((b) => b.label === "Wants")!;
    const savings = result.buckets.find((b) => b.label === "Savings")!;

    expect(needs.actualPercent).toBeCloseTo(50, 5);
    expect(needs.deltaPercentPoints).toBeCloseTo(0, 5);
    expect(wants.actualPercent).toBeCloseTo(30, 5);
    expect(savings.actualPercent).toBeCloseTo(20, 5);
    expect(result.unaccountedFor).toBeCloseTo(0, 5);
  });

  it("shows a positive delta when a bucket is over its target", () => {
    // needs way over: 70% vs 50% target
    const result = calculateBudgetRuleCheck({ afterTaxIncome: 1000, needsSpent: 700, wantsSpent: 200, savingsTotal: 100 });
    const needs = result.buckets.find((b) => b.label === "Needs")!;
    expect(needs.deltaPercentPoints).toBeCloseTo(20, 5); // 70 - 50
  });

  it("shows a negative delta when a bucket is under its target", () => {
    const result = calculateBudgetRuleCheck({ afterTaxIncome: 1000, needsSpent: 400, wantsSpent: 200, savingsTotal: 100 });
    const needs = result.buckets.find((b) => b.label === "Needs")!;
    expect(needs.deltaPercentPoints).toBeCloseTo(-10, 5); // 40 - 50
  });

  it("reports unaccountedFor for spending/income not covered by any tagged bucket", () => {
    const result = calculateBudgetRuleCheck({ afterTaxIncome: 2000, needsSpent: 500, wantsSpent: 300, savingsTotal: 200 });
    expect(result.unaccountedFor).toBeCloseTo(1000, 5); // 2000 - 1000
  });

  it("is all zero percentages for £0 after-tax income, rather than dividing by zero", () => {
    const result = calculateBudgetRuleCheck({ afterTaxIncome: 0, needsSpent: 100, wantsSpent: 50, savingsTotal: 20 });
    for (const bucket of result.buckets) {
      expect(bucket.actualPercent).toBe(0);
      expect(Number.isFinite(bucket.deltaPercentPoints)).toBe(true);
    }
  });

  it("keeps the fixed 50/30/20 targets regardless of input", () => {
    const result = calculateBudgetRuleCheck({ afterTaxIncome: 5000, needsSpent: 0, wantsSpent: 0, savingsTotal: 0 });
    expect(result.buckets.map((b) => b.targetPercent)).toEqual([50, 30, 20]);
  });
});
