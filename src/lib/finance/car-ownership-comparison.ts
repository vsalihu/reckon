import { calculateCarMonthlyCost, type CarCostInput } from "./car-costs";

export interface CarOwnershipComparisonInput extends CarCostInput {
  /** User-quoted lease payment — leasing math varies too much by provider to model from first principles. */
  leaseMonthlyQuote: number | null;
}

export interface CarOwnershipPath {
  label: "Cash" | "Finance" | "Lease";
  monthlyCost: number;
  totalCostOverTerm: number;
  ownsAtEnd: boolean;
  ownershipNote: string;
}

export interface CarOwnershipComparison {
  cash: CarOwnershipPath;
  finance: CarOwnershipPath;
  /** Null when no lease quote was entered — nothing to compare. */
  lease: CarOwnershipPath | null;
}

/**
 * Cash, finance, and lease side by side for the same car — see
 * docs/car-house-costs.md. Running costs (insurance, road tax, fuel/
 * maintenance) apply to all three paths equally, since they're a function
 * of driving the car, not of how it's paid for.
 */
export function calculateCarOwnershipComparison(input: CarOwnershipComparisonInput): CarOwnershipComparison {
  const { price, termMonths, insuranceAnnual, roadTaxAnnual, fuelMaintenanceMonthly, leaseMonthlyQuote } = input;
  const runningCostsMonthly = insuranceAnnual / 12 + roadTaxAnnual / 12 + fuelMaintenanceMonthly;

  const cash: CarOwnershipPath = {
    label: "Cash",
    monthlyCost: runningCostsMonthly,
    totalCostOverTerm: price + runningCostsMonthly * termMonths,
    ownsAtEnd: true,
    ownershipNote: "You own the car outright from day one.",
  };

  const financeCost = calculateCarMonthlyCost(input);
  const finance: CarOwnershipPath = {
    label: "Finance",
    monthlyCost: financeCost.totalMonthly,
    totalCostOverTerm: input.deposit + financeCost.totalMonthly * termMonths,
    ownsAtEnd: true,
    ownershipNote: "You own the car once the finance is fully repaid.",
  };

  const lease: CarOwnershipPath | null =
    leaseMonthlyQuote === null
      ? null
      : {
          label: "Lease",
          monthlyCost: leaseMonthlyQuote + runningCostsMonthly,
          totalCostOverTerm: (leaseMonthlyQuote + runningCostsMonthly) * termMonths,
          ownsAtEnd: false,
          ownershipNote: "You return the car at the end of the term — no ownership or residual value.",
        };

  return { cash, finance, lease };
}
