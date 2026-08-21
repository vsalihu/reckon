import { describe, expect, it } from "vitest";
import { calculateCarMonthlyCost } from "./car-costs";

describe("calculateCarMonthlyCost", () => {
  it("sums finance payment + insurance/12 + road tax/12 + fuel/maintenance", () => {
    const result = calculateCarMonthlyCost({
      price: 20_000,
      deposit: 2_000,
      apr: 0, // 0% for clean arithmetic
      termMonths: 36,
      insuranceAnnual: 600,
      roadTaxAnnual: 180,
      fuelMaintenanceMonthly: 150,
    });

    const expectedFinance = 18_000 / 36; // 500
    expect(result.financePayment).toBeCloseTo(expectedFinance, 6);
    expect(result.insuranceMonthly).toBeCloseTo(50, 6);
    expect(result.roadTaxMonthly).toBeCloseTo(15, 6);
    expect(result.totalMonthly).toBeCloseTo(expectedFinance + 50 + 15 + 150, 6);
  });

  it("treats a deposit that covers the full price as a £0 finance payment, not negative", () => {
    const result = calculateCarMonthlyCost({
      price: 10_000,
      deposit: 12_000,
      apr: 5,
      termMonths: 24,
      insuranceAnnual: 0,
      roadTaxAnnual: 0,
      fuelMaintenanceMonthly: 0,
    });

    expect(result.financePayment).toBe(0);
    expect(result.totalMonthly).toBe(0);
  });
});
