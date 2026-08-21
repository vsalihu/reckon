import { calculateMixedIncomeTakeHome } from "./mixed-income";

export type PayslipPeriod = "weekly" | "monthly" | "annual";

const PERIODS_PER_YEAR: Record<PayslipPeriod, number> = { weekly: 52, monthly: 12, annual: 1 };

export interface PayslipComparisonInput {
  period: PayslipPeriod;
  periodGross: number;
  periodNet: number;
  /** Held constant from the user's existing settings — a payslip reflects one PAYE job. */
  pensionContributionPercent?: number;
}

export type PayslipComparisonStatus = "match" | "lower_than_expected" | "higher_than_expected";

export interface PayslipComparisonResult {
  expectedNetForPeriod: number;
  actualNetForPeriod: number;
  differenceForPeriod: number;
  status: PayslipComparisonStatus;
}

/** £5 or 1% of the expected figure, whichever is larger — avoids flagging rounding noise as a mismatch. */
function toleranceFor(expected: number): number {
  return Math.max(5, expected * 0.01);
}

/**
 * Compares a real payslip's gross/net for one period against what the
 * calculator would estimate for the same period, assuming it were the
 * user's only PAYE income at that pace all year. A payslip is inherently
 * a single-PAYE-job artifact, so self-employed income isn't part of this
 * comparison — see docs/mixed-income-tax.md.
 */
export function comparePayslip(input: PayslipComparisonInput): PayslipComparisonResult {
  const { period, periodGross, periodNet, pensionContributionPercent = 0 } = input;
  const periodsPerYear = PERIODS_PER_YEAR[period];

  const annualGross = periodGross * periodsPerYear;
  const estimate = calculateMixedIncomeTakeHome({
    payeGross: annualGross,
    selfEmployedProfit: 0,
    pensionContributionPercent,
  });

  const expectedNetForPeriod = estimate.netAnnual / periodsPerYear;
  const differenceForPeriod = periodNet - expectedNetForPeriod;
  const tolerance = toleranceFor(expectedNetForPeriod);

  const status: PayslipComparisonStatus =
    differenceForPeriod < -tolerance ? "lower_than_expected" : differenceForPeriod > tolerance ? "higher_than_expected" : "match";

  return { expectedNetForPeriod, actualNetForPeriod: periodNet, differenceForPeriod, status };
}
