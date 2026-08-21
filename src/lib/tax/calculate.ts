import type { UkTaxYearRates } from "./rates.uk.2025-26";
import { CURRENT_UK_TAX_YEAR } from "./current-year";

export interface UkTakeHomeEstimate {
  taxYear: string;
  grossAnnual: number;
  personalAllowance: number;
  taxableIncome: number;
  incomeTaxAnnual: number;
  employeeNiAnnual: number;
  netAnnual: number;
  netMonthly: number;
  /** Breakdown of Income Tax paid per band, for display. */
  incomeTaxBreakdown: { band: "basic" | "higher" | "additional"; amount: number; rate: number }[];
  /** This is an estimate: no student loan, pension, or salary-sacrifice modelling. */
  isEstimate: true;
}

/**
 * Personal Allowance tapers £1 for every £2 of income above the taper
 * threshold, down to zero at the taper ceiling.
 */
export function calculatePersonalAllowance(grossAnnual: number, rates: UkTaxYearRates = CURRENT_UK_TAX_YEAR): number {
  const { personalAllowance, personalAllowanceTaperThreshold, personalAllowanceTaperCeiling } = rates.incomeTax;
  if (grossAnnual <= personalAllowanceTaperThreshold) return personalAllowance;
  if (grossAnnual >= personalAllowanceTaperCeiling) return 0;

  const excess = grossAnnual - personalAllowanceTaperThreshold;
  const reduction = Math.floor(excess / 2);
  return Math.max(0, personalAllowance - reduction);
}

export function calculateIncomeTax(
  grossAnnual: number,
  rates: UkTaxYearRates = CURRENT_UK_TAX_YEAR,
): { total: number; breakdown: UkTakeHomeEstimate["incomeTaxBreakdown"]; taxableIncome: number; personalAllowance: number } {
  const personalAllowance = calculatePersonalAllowance(grossAnnual, rates);
  const taxableIncome = Math.max(0, grossAnnual - personalAllowance);
  const { basicRateLimit, basicRate, higherRateLimit, higherRate, additionalRate } = rates.incomeTax.bands;

  const basicPortion = Math.min(taxableIncome, basicRateLimit);
  const higherPortion = Math.min(Math.max(taxableIncome - basicRateLimit, 0), higherRateLimit - basicRateLimit);
  const additionalPortion = Math.max(taxableIncome - higherRateLimit, 0);

  const breakdown: UkTakeHomeEstimate["incomeTaxBreakdown"] = [
    { band: "basic", amount: round2(basicPortion * basicRate), rate: basicRate },
    { band: "higher", amount: round2(higherPortion * higherRate), rate: higherRate },
    { band: "additional", amount: round2(additionalPortion * additionalRate), rate: additionalRate },
  ];

  const total = round2(breakdown.reduce((sum, b) => sum + b.amount, 0));
  return { total, breakdown, taxableIncome, personalAllowance };
}

export function calculateEmployeeNi(grossAnnual: number, rates: UkTaxYearRates = CURRENT_UK_TAX_YEAR): number {
  const { primaryThreshold, mainRate, upperEarningsLimit, upperRate } = rates.employeeNationalInsurance;

  const mainPortion = Math.max(0, Math.min(grossAnnual, upperEarningsLimit) - primaryThreshold);
  const upperPortion = Math.max(0, grossAnnual - upperEarningsLimit);

  return round2(Math.max(0, mainPortion) * mainRate + upperPortion * upperRate);
}

/**
 * Estimated UK take-home pay for a single PAYE employment, annual gross
 * input. No student loan, pension, or salary-sacrifice modelling — see
 * `isEstimate`. Multi-employment / self-employed users are out of scope for
 * Phase 1.
 */
export function calculateUkTakeHome(grossAnnual: number, rates: UkTaxYearRates = CURRENT_UK_TAX_YEAR): UkTakeHomeEstimate {
  if (grossAnnual < 0) throw new RangeError("grossAnnual must be >= 0");

  const { total: incomeTaxAnnual, breakdown, personalAllowance, taxableIncome } = calculateIncomeTax(grossAnnual, rates);
  const employeeNiAnnual = calculateEmployeeNi(grossAnnual, rates);
  const netAnnual = round2(grossAnnual - incomeTaxAnnual - employeeNiAnnual);

  return {
    taxYear: rates.taxYear,
    grossAnnual: round2(grossAnnual),
    personalAllowance,
    taxableIncome: round2(taxableIncome),
    incomeTaxAnnual,
    employeeNiAnnual,
    netAnnual,
    netMonthly: round2(netAnnual / 12),
    incomeTaxBreakdown: breakdown,
    isEstimate: true,
  };
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
