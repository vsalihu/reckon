import { calculateLoanPayment } from "./amortization";

export interface CarCostInput {
  price: number;
  deposit: number;
  apr: number;
  termMonths: number;
  insuranceAnnual: number;
  roadTaxAnnual: number;
  fuelMaintenanceMonthly: number;
}

export interface CarCostBreakdown {
  financePayment: number;
  insuranceMonthly: number;
  roadTaxMonthly: number;
  fuelMaintenanceMonthly: number;
  totalMonthly: number;
}

/**
 * Total monthly cost of ownership. MOT is deliberately not part of this —
 * see docs/car-house-costs.md.
 */
export function calculateCarMonthlyCost(input: CarCostInput): CarCostBreakdown {
  const principal = Math.max(0, input.price - input.deposit);
  const financePayment = calculateLoanPayment(principal, input.apr, input.termMonths);
  const insuranceMonthly = input.insuranceAnnual / 12;
  const roadTaxMonthly = input.roadTaxAnnual / 12;

  return {
    financePayment,
    insuranceMonthly,
    roadTaxMonthly,
    fuelMaintenanceMonthly: input.fuelMaintenanceMonthly,
    totalMonthly: financePayment + insuranceMonthly + roadTaxMonthly + input.fuelMaintenanceMonthly,
  };
}
