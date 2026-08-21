import type { UkTaxYearRates } from "./rates.uk.2025-26";
import type { UkSelfEmployedNiRates } from "./rates.uk.self-employed.2025-26";
import { CURRENT_UK_TAX_YEAR, CURRENT_UK_SELF_EMPLOYED_NI } from "./current-year";
import { calculateIncomeTax, calculateEmployeeNi, round2, type UkTakeHomeEstimate } from "./calculate";

/**
 * Class 2 NI. See rates.uk.self-employed.2025-26.ts and
 * docs/mixed-income-tax.md — mandatory liability is always £0 under
 * current law; this only reports whether the voluntary election is
 * available and what it would cost, it never adds to a deduction total.
 */
export function calculateClass2Ni(
  selfEmployedProfit: number,
  rates: UkSelfEmployedNiRates = CURRENT_UK_SELF_EMPLOYED_NI,
): { mandatoryAnnual: number; voluntaryAvailable: boolean; voluntaryAnnual: number } {
  const belowThreshold = selfEmployedProfit < rates.class2.smallProfitsThreshold;
  return {
    mandatoryAnnual: 0,
    voluntaryAvailable: belowThreshold,
    voluntaryAnnual: round2(rates.class2.weeklyRate * 52),
  };
}

/** Class 4 NI: 6%/2% bands on self-employed profit, mirroring Class 1's shape but on a separate base. */
export function calculateClass4Ni(
  selfEmployedProfit: number,
  rates: UkSelfEmployedNiRates = CURRENT_UK_SELF_EMPLOYED_NI,
): number {
  const { lowerProfitsLimit, upperProfitsLimit, mainRate, upperRate } = rates.class4;

  const mainPortion = Math.max(0, Math.min(selfEmployedProfit, upperProfitsLimit) - lowerProfitsLimit);
  const upperPortion = Math.max(0, selfEmployedProfit - upperProfitsLimit);

  return round2(mainPortion * mainRate + upperPortion * upperRate);
}

/** Flat percentage of PAYE gross only — see docs/mixed-income-tax.md for the scope limitation. */
export function calculatePensionDeduction(payeGross: number, pensionContributionPercent: number): number {
  if (pensionContributionPercent <= 0) return 0;
  return round2(payeGross * (pensionContributionPercent / 100));
}

export interface MixedIncomeInput {
  payeGross: number;
  selfEmployedProfit: number;
  /** Flat % of payeGross only. See docs/mixed-income-tax.md. */
  pensionContributionPercent?: number;
}

export interface MixedIncomeEstimate {
  taxYear: string;
  payeGross: number;
  selfEmployedProfit: number;
  combinedGross: number;
  personalAllowance: number;
  taxableIncome: number;
  incomeTaxAnnual: number;
  incomeTaxBreakdown: UkTakeHomeEstimate["incomeTaxBreakdown"];
  class1EmployeeNiAnnual: number;
  class2: ReturnType<typeof calculateClass2Ni>;
  class4NiAnnual: number;
  pensionDeductionAnnual: number;
  netAnnual: number;
  netMonthly: number;
  isEstimate: true;
}

/**
 * Combined PAYE + self-employed take-home estimate. See
 * docs/mixed-income-tax.md for the full rationale — in short: Income Tax
 * is calculated once on combined taxable income (one Personal Allowance,
 * one set of bands); National Insurance is calculated separately per
 * income type and then summed, never combined into one NI base.
 */
export function calculateMixedIncomeTakeHome(
  input: MixedIncomeInput,
  rates: UkTaxYearRates = CURRENT_UK_TAX_YEAR,
  seRates: UkSelfEmployedNiRates = CURRENT_UK_SELF_EMPLOYED_NI,
): MixedIncomeEstimate {
  const { payeGross, selfEmployedProfit, pensionContributionPercent = 0 } = input;
  if (payeGross < 0) throw new RangeError("payeGross must be >= 0");
  if (selfEmployedProfit < 0) throw new RangeError("selfEmployedProfit must be >= 0");

  const combinedGross = payeGross + selfEmployedProfit;

  const { total: incomeTaxAnnual, breakdown, personalAllowance, taxableIncome } = calculateIncomeTax(
    combinedGross,
    rates,
  );

  const class1EmployeeNiAnnual = calculateEmployeeNi(payeGross, rates);
  const class2 = calculateClass2Ni(selfEmployedProfit, seRates);
  const class4NiAnnual = calculateClass4Ni(selfEmployedProfit, seRates);
  const pensionDeductionAnnual = calculatePensionDeduction(payeGross, pensionContributionPercent);

  const netAnnual = round2(
    combinedGross -
      incomeTaxAnnual -
      class1EmployeeNiAnnual -
      class2.mandatoryAnnual -
      class4NiAnnual -
      pensionDeductionAnnual,
  );

  return {
    taxYear: rates.taxYear,
    payeGross: round2(payeGross),
    selfEmployedProfit: round2(selfEmployedProfit),
    combinedGross: round2(combinedGross),
    personalAllowance,
    taxableIncome: round2(taxableIncome),
    incomeTaxAnnual,
    incomeTaxBreakdown: breakdown,
    class1EmployeeNiAnnual,
    class2,
    class4NiAnnual,
    pensionDeductionAnnual,
    netAnnual,
    netMonthly: round2(netAnnual / 12),
    isEstimate: true,
  };
}
