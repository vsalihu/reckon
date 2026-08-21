import { LISA_RULES_2025_26, type LisaRules } from "./rates.2025-26";

export interface LisaContribution {
  amount: number;
  contributedAt: Date;
}

/**
 * UK tax year runs 6 April to 5 April. Returns a label like "2025/26" for
 * whichever tax year `date` falls in.
 */
export function ukTaxYearLabelFor(date: Date): string {
  const aprilSixThisCalendarYear = new Date(date.getFullYear(), 3, 6); // month is 0-indexed: 3 = April
  const startYear = date.getTime() >= aprilSixThisCalendarYear.getTime() ? date.getFullYear() : date.getFullYear() - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}/${endYearShort}`;
}

export interface LisaTaxYearBreakdown {
  taxYear: string;
  contributed: number;
  eligibleForBonus: number;
  bonus: number;
  exceededAnnualLimit: boolean;
}

export interface LisaBonusResult {
  /** Per tax year, since the bonus cap resets each year — contributions to a LISA-linked goal typically span more than one. */
  byTaxYear: LisaTaxYearBreakdown[];
  totalContributed: number;
  totalBonus: number;
  /** The headline figure: everything saved plus every bonus earned, all time. */
  totalAvailable: number;
}

/**
 * 25% government bonus on LISA contributions, respecting the annual
 * contribution limit that the bonus applies to (contributions beyond it
 * in the same tax year still count as saved, just earn no further
 * bonus). Contributions are grouped by UK tax year since the cap resets
 * each year — see docs/lisa-bonus.md.
 */
export function calculateLisaBonus(
  contributions: LisaContribution[],
  rules: LisaRules = LISA_RULES_2025_26,
): LisaBonusResult {
  const byTaxYearMap = new Map<string, number>();
  for (const contribution of contributions) {
    const taxYear = ukTaxYearLabelFor(contribution.contributedAt);
    byTaxYearMap.set(taxYear, (byTaxYearMap.get(taxYear) ?? 0) + contribution.amount);
  }

  const byTaxYear: LisaTaxYearBreakdown[] = Array.from(byTaxYearMap, ([taxYear, contributed]) => {
    const eligibleForBonus = Math.min(contributed, rules.annualContributionLimit);
    return {
      taxYear,
      contributed: round2(contributed),
      eligibleForBonus: round2(eligibleForBonus),
      bonus: round2(eligibleForBonus * rules.bonusRate),
      exceededAnnualLimit: contributed > rules.annualContributionLimit,
    };
  }).sort((a, b) => a.taxYear.localeCompare(b.taxYear));

  const totalContributed = round2(byTaxYear.reduce((sum, y) => sum + y.contributed, 0));
  const totalBonus = round2(byTaxYear.reduce((sum, y) => sum + y.bonus, 0));

  return {
    byTaxYear,
    totalContributed,
    totalBonus,
    totalAvailable: round2(totalContributed + totalBonus),
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
