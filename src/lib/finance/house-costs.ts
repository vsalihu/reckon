import { calculateLoanPayment } from "./amortization";

export interface RentCostInput {
  mode: "rent";
  monthlyRent: number;
  monthlyBills: number;
  councilTaxMonthly: number;
}

export interface MortgageCostInput {
  mode: "mortgage";
  loanAmount: number;
  interestRateApr: number;
  termYears: number;
  buildingsInsuranceAnnual: number;
  councilTaxAnnual: number;
}

export type HouseCostInput = RentCostInput | MortgageCostInput;

export interface HouseCostBreakdown {
  totalMonthly: number;
  /** Only present for mortgage mode. */
  mortgagePayment?: number;
}

/** Total monthly housing cost. See docs/car-house-costs.md for the per-mode formula. */
export function calculateHouseMonthlyCost(input: HouseCostInput): HouseCostBreakdown {
  if (input.mode === "rent") {
    return {
      totalMonthly: input.monthlyRent + input.monthlyBills + input.councilTaxMonthly,
    };
  }

  const mortgagePayment = calculateLoanPayment(input.loanAmount, input.interestRateApr, input.termYears * 12);
  const insuranceMonthly = input.buildingsInsuranceAnnual / 12;
  const councilTaxMonthly = input.councilTaxAnnual / 12;

  return {
    mortgagePayment,
    totalMonthly: mortgagePayment + insuranceMonthly + councilTaxMonthly,
  };
}
