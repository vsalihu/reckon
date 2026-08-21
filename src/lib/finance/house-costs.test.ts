import { describe, expect, it } from "vitest";
import { calculateHouseMonthlyCost } from "./house-costs";

describe("calculateHouseMonthlyCost", () => {
  it("sums rent + bills + council tax in rent mode", () => {
    const result = calculateHouseMonthlyCost({
      mode: "rent",
      monthlyRent: 1_200,
      monthlyBills: 150,
      councilTaxMonthly: 130,
    });

    expect(result.totalMonthly).toBe(1_480);
    expect(result.mortgagePayment).toBeUndefined();
  });

  it("sums mortgage payment + insurance/12 + council tax/12 in mortgage mode", () => {
    const result = calculateHouseMonthlyCost({
      mode: "mortgage",
      loanAmount: 240_000,
      interestRateApr: 0, // 0% for clean arithmetic
      termYears: 20,
      buildingsInsuranceAnnual: 240,
      councilTaxAnnual: 1_800,
    });

    const expectedMortgage = 240_000 / (20 * 12); // 1000
    expect(result.mortgagePayment).toBeCloseTo(expectedMortgage, 6);
    expect(result.totalMonthly).toBeCloseTo(expectedMortgage + 20 + 150, 6);
  });
});
