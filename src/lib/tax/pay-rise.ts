import { calculateMixedIncomeTakeHome } from "./mixed-income";

export interface PayRiseInput {
  currentPayeGross: number;
  newPayeGross: number;
  selfEmployedProfit?: number;
  pensionContributionPercent?: number;
}

export interface PayRiseResult {
  grossIncreaseAnnual: number;
  netIncreaseAnnual: number;
  netIncreaseMonthly: number;
  /** Share of the raw raise that actually reaches take-home, after tax/NI/pension on the marginal income. */
  effectiveRate: number;
}

/**
 * Thin wrapper around the existing mixed-income engine — runs it twice
 * (current vs new PAYE gross, everything else held constant) and diffs
 * the results. No new tax logic; see docs/mixed-income-tax.md for the
 * calculation this reuses.
 */
export function calculatePayRiseImpact(input: PayRiseInput): PayRiseResult {
  const { currentPayeGross, newPayeGross, selfEmployedProfit = 0, pensionContributionPercent = 0 } = input;

  const before = calculateMixedIncomeTakeHome({ payeGross: currentPayeGross, selfEmployedProfit, pensionContributionPercent });
  const after = calculateMixedIncomeTakeHome({ payeGross: newPayeGross, selfEmployedProfit, pensionContributionPercent });

  const grossIncreaseAnnual = after.combinedGross - before.combinedGross;
  const netIncreaseAnnual = after.netAnnual - before.netAnnual;

  return {
    grossIncreaseAnnual,
    netIncreaseAnnual,
    netIncreaseMonthly: netIncreaseAnnual / 12,
    effectiveRate: grossIncreaseAnnual > 0 ? netIncreaseAnnual / grossIncreaseAnnual : 0,
  };
}
