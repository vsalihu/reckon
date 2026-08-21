import { describe, expect, it } from "vitest";
import {
  calculateClass2Ni,
  calculateClass4Ni,
  calculatePensionDeduction,
  calculateMixedIncomeTakeHome,
} from "./mixed-income";
import { calculateIncomeTax, calculateEmployeeNi } from "./calculate";

describe("calculateClass2Ni (2025/26)", () => {
  it("is always £0 mandatory at or above the small profits threshold", () => {
    const result = calculateClass2Ni(10_000);
    expect(result.mandatoryAnnual).toBe(0);
    expect(result.voluntaryAvailable).toBe(false);
  });

  it("is £0 mandatory but flags the voluntary option below the threshold", () => {
    const result = calculateClass2Ni(3_000);
    expect(result.mandatoryAnnual).toBe(0);
    expect(result.voluntaryAvailable).toBe(true);
    expect(result.voluntaryAnnual).toBeCloseTo(3.5 * 52, 2);
  });

  it("is exactly at the threshold boundary — not below it", () => {
    const result = calculateClass2Ni(6_845);
    expect(result.voluntaryAvailable).toBe(false);
  });
});

describe("calculateClass4Ni (2025/26)", () => {
  it("charges nothing below the Lower Profits Limit", () => {
    expect(calculateClass4Ni(10_000)).toBe(0);
  });

  it("charges 6% between the Lower and Upper Profits Limits", () => {
    // £30,000 -> (£30,000 - £12,570) * 6% = £1,045.80
    expect(calculateClass4Ni(30_000)).toBeCloseTo(1_045.8, 2);
  });

  it("charges 2% above the Upper Profits Limit", () => {
    // £60,000 -> main: (£50,270-£12,570)*6% = £2,262; upper: (£60,000-£50,270)*2% = £194.60
    expect(calculateClass4Ni(60_000)).toBeCloseTo(2_262 + 194.6, 2);
  });
});

describe("calculatePensionDeduction", () => {
  it("is a flat percentage of PAYE gross", () => {
    expect(calculatePensionDeduction(40_000, 5)).toBeCloseTo(2_000, 2);
  });

  it("is £0 at 0%", () => {
    expect(calculatePensionDeduction(40_000, 0)).toBe(0);
  });
});

describe("calculateMixedIncomeTakeHome — isolated income types (sanity checks)", () => {
  it("matches the single-employment PAYE-only calculation when self-employed profit is 0", () => {
    const mixed = calculateMixedIncomeTakeHome({ payeGross: 35_000, selfEmployedProfit: 0 });
    const single = calculateIncomeTax(35_000);
    const singleNi = calculateEmployeeNi(35_000);

    expect(mixed.incomeTaxAnnual).toBeCloseTo(single.total, 2);
    expect(mixed.class1EmployeeNiAnnual).toBeCloseTo(singleNi, 2);
    expect(mixed.class4NiAnnual).toBe(0);
    expect(mixed.netAnnual).toBeCloseTo(35_000 - single.total - singleNi, 2);
  });

  it("charges no Class 1 NI when there is no PAYE income", () => {
    const mixed = calculateMixedIncomeTakeHome({ payeGross: 0, selfEmployedProfit: 30_000 });
    expect(mixed.class1EmployeeNiAnnual).toBe(0);
    expect(mixed.class4NiAnnual).toBeCloseTo(1_045.8, 2); // (30000-12570)*6%
  });
});

describe("calculateMixedIncomeTakeHome — genuinely mixed scenarios", () => {
  it("shares one Personal Allowance and one set of Income Tax bands across both income types", () => {
    // £40,000 PAYE + £20,000 self-employed = £60,000 combined taxable base.
    const mixed = calculateMixedIncomeTakeHome({ payeGross: 40_000, selfEmployedProfit: 20_000 });
    const combinedOnly = calculateIncomeTax(60_000);

    expect(mixed.combinedGross).toBe(60_000);
    expect(mixed.incomeTaxAnnual).toBeCloseTo(combinedOnly.total, 2);
    // Confirms combining did NOT just add two separately-computed Income Tax
    // figures (which would double-count the Personal Allowance and basic band).
    const doubleCounted = calculateIncomeTax(40_000).total + calculateIncomeTax(20_000).total;
    expect(mixed.incomeTaxAnnual).not.toBeCloseTo(doubleCounted, 2);
  });

  it("calculates Class 1 NI only on the PAYE portion and Class 4 only on the self-employed portion", () => {
    const mixed = calculateMixedIncomeTakeHome({ payeGross: 40_000, selfEmployedProfit: 20_000 });

    expect(mixed.class1EmployeeNiAnnual).toBeCloseTo(calculateEmployeeNi(40_000), 2);
    expect(mixed.class4NiAnnual).toBeCloseTo(calculateClass4Ni(20_000), 2);

    // The critical wrong-answer check: NI must NOT be calculated by running
    // either NI formula against the combined £60,000 figure.
    expect(mixed.class1EmployeeNiAnnual).not.toBeCloseTo(calculateEmployeeNi(60_000), 2);
    expect(mixed.class4NiAnnual).not.toBeCloseTo(calculateClass4Ni(60_000), 2);
  });

  it("pushes self-employed profit into the higher Income Tax band via the shared Personal Allowance", () => {
    // £30,000 PAYE alone is entirely basic-rate (taxable £17,430, well under
    // the £37,700 basic-rate limit). Adding £25,000 self-employed profit
    // brings combined taxable income to £42,430 — over the limit — even
    // though neither figure alone would reach it.
    const payeOnly = calculateMixedIncomeTakeHome({ payeGross: 30_000, selfEmployedProfit: 0 });
    const mixed = calculateMixedIncomeTakeHome({ payeGross: 30_000, selfEmployedProfit: 25_000 });

    const payeOnlyHigherBand = payeOnly.incomeTaxBreakdown.find((b) => b.band === "higher")!;
    const mixedHigherBand = mixed.incomeTaxBreakdown.find((b) => b.band === "higher")!;

    expect(payeOnlyHigherBand.amount).toBe(0);
    expect(mixedHigherBand.amount).toBeGreaterThan(0);
  });

  it("deducts pension only from the PAYE portion, not self-employed profit", () => {
    const withPension = calculateMixedIncomeTakeHome({
      payeGross: 40_000,
      selfEmployedProfit: 20_000,
      pensionContributionPercent: 5,
    });
    const withoutPension = calculateMixedIncomeTakeHome({ payeGross: 40_000, selfEmployedProfit: 20_000 });

    expect(withPension.pensionDeductionAnnual).toBeCloseTo(2_000, 2); // 5% of 40,000 only
    expect(withoutPension.netAnnual - withPension.netAnnual).toBeCloseTo(2_000, 2);
    // Income Tax and NI are unaffected by the pension deduction in this simplified model.
    expect(withPension.incomeTaxAnnual).toBeCloseTo(withoutPension.incomeTaxAnnual, 2);
  });

  it("Class 2 stays £0 in a mixed scenario even when self-employed profit alone is below the threshold", () => {
    const mixed = calculateMixedIncomeTakeHome({ payeGross: 50_000, selfEmployedProfit: 3_000 });
    expect(mixed.class2.mandatoryAnnual).toBe(0);
    expect(mixed.class2.voluntaryAvailable).toBe(true); // £3,000 self-employed profit alone is below £6,845
  });

  it("rejects negative inputs", () => {
    expect(() => calculateMixedIncomeTakeHome({ payeGross: -1, selfEmployedProfit: 0 })).toThrow(RangeError);
    expect(() => calculateMixedIncomeTakeHome({ payeGross: 0, selfEmployedProfit: -1 })).toThrow(RangeError);
  });
});
