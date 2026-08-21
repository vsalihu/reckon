/**
 * UK Income Tax & Employee National Insurance rates/thresholds.
 *
 * Tax year: 2025/26 (6 April 2025 – 5 April 2026).
 *
 * IMPORTANT: These figures change every tax year (usually announced in the
 * Spring/Autumn Budget, effective from 6 April). When updating for a new
 * year:
 *   1. Copy this file to `rates.uk.<YYYY>-<YY>.ts`.
 *   2. Update the values below from gov.uk.
 *   3. Point `CURRENT_UK_TAX_YEAR` in `./index.ts` at the new file.
 * Do not edit thresholds inline anywhere else in the codebase — the
 * calculation engine in `./calculate.ts` only ever reads from this object.
 *
 * Sources (verify each update):
 *   - Income Tax rates/allowances: https://www.gov.uk/income-tax-rates
 *   - Personal Allowance taper:    https://www.gov.uk/guidance/adjusted-net-income
 *   - National Insurance rates:    https://www.gov.uk/national-insurance-rates-letters
 */

export interface UkTaxYearRates {
  /** e.g. "2025/26" */
  taxYear: string;
  incomeTax: {
    /** Standard Personal Allowance before any tapering. */
    personalAllowance: number;
    /** Personal Allowance is reduced £1 for every £2 of income above this. */
    personalAllowanceTaperThreshold: number;
    /** Above this adjusted net income, Personal Allowance is fully gone. */
    personalAllowanceTaperCeiling: number;
    bands: {
      /** Basic rate band: taxable income up to this amount. */
      basicRateLimit: number;
      basicRate: number;
      /** Higher rate band: taxable income up to this amount. */
      higherRateLimit: number;
      higherRate: number;
      /** Additional rate: taxable income above higherRateLimit. */
      additionalRate: number;
    };
  };
  employeeNationalInsurance: {
    /** 0% below this (Primary Threshold). */
    primaryThreshold: number;
    /** Main rate between primaryThreshold and upperEarningsLimit. */
    mainRate: number;
    /** Upper Earnings Limit — main rate applies up to here. */
    upperEarningsLimit: number;
    /** Rate above the Upper Earnings Limit. */
    upperRate: number;
  };
}

export const UK_TAX_RATES_2025_26: UkTaxYearRates = {
  taxYear: "2025/26",
  incomeTax: {
    personalAllowance: 12_570,
    personalAllowanceTaperThreshold: 100_000,
    personalAllowanceTaperCeiling: 125_140,
    bands: {
      basicRateLimit: 37_700,
      basicRate: 0.2,
      higherRateLimit: 125_140,
      higherRate: 0.4,
      additionalRate: 0.45,
    },
  },
  employeeNationalInsurance: {
    primaryThreshold: 12_570,
    mainRate: 0.08,
    upperEarningsLimit: 50_270,
    upperRate: 0.02,
  },
};
