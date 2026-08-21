import { describe, expect, it } from "vitest";
import { calculateCarOwnershipComparison } from "./car-ownership-comparison";

const baseInput = {
  price: 20_000,
  deposit: 2_000,
  apr: 0, // 0% for predictable arithmetic
  termMonths: 36,
  insuranceAnnual: 600, // 50/mo
  roadTaxAnnual: 240, // 20/mo
  fuelMaintenanceMonthly: 100,
};

describe("calculateCarOwnershipComparison", () => {
  it("cash path: pays the full price upfront, only running costs monthly, owns from day one", () => {
    const result = calculateCarOwnershipComparison({ ...baseInput, leaseMonthlyQuote: null });

    expect(result.cash.monthlyCost).toBeCloseTo(50 + 20 + 100, 2); // running costs only
    expect(result.cash.totalCostOverTerm).toBeCloseTo(20_000 + (50 + 20 + 100) * 36, 2);
    expect(result.cash.ownsAtEnd).toBe(true);
  });

  it("finance path: reuses the amortization + running cost calc, owns at the end", () => {
    const result = calculateCarOwnershipComparison({ ...baseInput, leaseMonthlyQuote: null });

    // principal 18,000 / 36 months @ 0% = 500/mo finance + 50 + 20 + 100 running = 670/mo
    expect(result.finance.monthlyCost).toBeCloseTo(670, 2);
    expect(result.finance.totalCostOverTerm).toBeCloseTo(2_000 + 670 * 36, 2); // deposit + monthly*term
    expect(result.finance.ownsAtEnd).toBe(true);
  });

  it("lease path: quoted payment + running costs, never owns the car", () => {
    const result = calculateCarOwnershipComparison({ ...baseInput, leaseMonthlyQuote: 300 });

    expect(result.lease).not.toBeNull();
    expect(result.lease!.monthlyCost).toBeCloseTo(300 + 50 + 20 + 100, 2);
    expect(result.lease!.totalCostOverTerm).toBeCloseTo((300 + 50 + 20 + 100) * 36, 2);
    expect(result.lease!.ownsAtEnd).toBe(false);
  });

  it("omits the lease path entirely when no quote is given", () => {
    const result = calculateCarOwnershipComparison({ ...baseInput, leaseMonthlyQuote: null });
    expect(result.lease).toBeNull();
  });

  it("running costs are identical in £ terms across cash and finance paths", () => {
    const result = calculateCarOwnershipComparison({ ...baseInput, leaseMonthlyQuote: null });
    // Finance monthly minus cash monthly should equal exactly the finance payment (no hidden running-cost difference).
    const financePaymentOnly = result.finance.monthlyCost - result.cash.monthlyCost;
    expect(financePaymentOnly).toBeCloseTo(500, 2);
  });
});
