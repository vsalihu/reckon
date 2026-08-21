import { describe, expect, it } from "vitest";
import {
  calculateEmployeeNi,
  calculateIncomeTax,
  calculatePersonalAllowance,
  calculateUkTakeHome,
} from "./calculate";

describe("calculatePersonalAllowance (2025/26)", () => {
  it("gives the full £12,570 allowance below the taper threshold", () => {
    expect(calculatePersonalAllowance(30_000)).toBe(12_570);
    expect(calculatePersonalAllowance(100_000)).toBe(12_570);
  });

  it("tapers £1 for every £2 earned above £100,000", () => {
    // £110,000 income -> £10,000 over threshold -> £5,000 reduction
    expect(calculatePersonalAllowance(110_000)).toBe(7_570);
  });

  it("is fully gone at and above £125,140", () => {
    expect(calculatePersonalAllowance(125_140)).toBe(0);
    expect(calculatePersonalAllowance(200_000)).toBe(0);
  });
});

describe("calculateIncomeTax (2025/26)", () => {
  it("charges nothing below the Personal Allowance", () => {
    const result = calculateIncomeTax(10_000);
    expect(result.total).toBe(0);
  });

  it("charges 20% within the basic rate band", () => {
    // £30,000 gross - £12,570 PA = £17,430 taxable, all basic rate
    const result = calculateIncomeTax(30_000);
    expect(result.taxableIncome).toBe(17_430);
    expect(result.total).toBeCloseTo(17_430 * 0.2, 2);
  });

  it("splits across basic and higher rate bands", () => {
    // £60,000 gross - £12,570 PA = £47,430 taxable
    // basic: £37,700 @ 20% = £7,540
    // higher: £9,730 @ 40% = £3,892
    const result = calculateIncomeTax(60_000);
    expect(result.total).toBeCloseTo(7_540 + 3_892, 2);
  });

  it("applies the additional rate above £125,140 taxable income", () => {
    // £300,000 gross -> PA fully tapered to £0 -> taxable = £300,000
    const result = calculateIncomeTax(300_000);
    const expectedBasic = 37_700 * 0.2;
    const expectedHigher = (125_140 - 37_700) * 0.4;
    const expectedAdditional = (300_000 - 125_140) * 0.45;
    expect(result.total).toBeCloseTo(expectedBasic + expectedHigher + expectedAdditional, 2);
  });
});

describe("calculateEmployeeNi (2025/26)", () => {
  it("charges nothing below the Primary Threshold", () => {
    expect(calculateEmployeeNi(10_000)).toBe(0);
  });

  it("charges 8% between £12,570 and £50,270", () => {
    // £30,000 -> (£30,000 - £12,570) * 8% = £1,394.40
    expect(calculateEmployeeNi(30_000)).toBeCloseTo(1_394.4, 2);
  });

  it("charges 2% above the Upper Earnings Limit", () => {
    // £60,000 -> main: (£50,270-£12,570)*8% = £3,016; upper: (£60,000-£50,270)*2% = £194.60
    expect(calculateEmployeeNi(60_000)).toBeCloseTo(3_016 + 194.6, 2);
  });
});

describe("calculateUkTakeHome (2025/26)", () => {
  it("returns a coherent estimate for a typical salary", () => {
    const result = calculateUkTakeHome(35_000);
    expect(result.grossAnnual).toBe(35_000);
    expect(result.netAnnual).toBe(
      Math.round((35_000 - result.incomeTaxAnnual - result.employeeNiAnnual + Number.EPSILON) * 100) / 100,
    );
    expect(result.netMonthly).toBeCloseTo(result.netAnnual / 12, 2);
    expect(result.isEstimate).toBe(true);
    expect(result.taxYear).toBe("2025/26");
  });

  it("never produces a negative net income", () => {
    const result = calculateUkTakeHome(0);
    expect(result.netAnnual).toBeGreaterThanOrEqual(0);
  });

  it("rejects negative gross income", () => {
    expect(() => calculateUkTakeHome(-1)).toThrow(RangeError);
  });
});
