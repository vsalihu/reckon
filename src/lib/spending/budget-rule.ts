/**
 * 50/30/20 rule check. See docs/budget-rule.md — informational only, not
 * prescriptive: this reports where the split actually landed, it doesn't
 * tell the user what to do about it.
 */
export interface BudgetRuleInput {
  /** After-tax income for the period (see docs/budget-rule.md for which figure feeds this). */
  afterTaxIncome: number;
  /** Sum of spending entries in categories tagged 'needs'. */
  needsSpent: number;
  /** Sum of spending entries in categories tagged 'wants'. */
  wantsSpent: number;
  /** Goal contributions (always) + spending entries tagged 'savings' (optional, for savings-adjacent spending). */
  savingsTotal: number;
}

export interface BudgetRuleBucket {
  label: "Needs" | "Wants" | "Savings";
  amount: number;
  targetPercent: number;
  actualPercent: number;
  /** actualPercent − targetPercent; positive means over target, negative means under. */
  deltaPercentPoints: number;
}

export interface BudgetRuleResult {
  afterTaxIncome: number;
  buckets: BudgetRuleBucket[];
  /** afterTaxIncome − (needs + wants + savings) — spending not accounted for by any tagged bucket. */
  unaccountedFor: number;
}

const TARGETS = { needs: 50, wants: 30, savings: 20 };

export function calculateBudgetRuleCheck(input: BudgetRuleInput): BudgetRuleResult {
  const { afterTaxIncome, needsSpent, wantsSpent, savingsTotal } = input;

  function bucket(label: BudgetRuleBucket["label"], amount: number, targetPercent: number): BudgetRuleBucket {
    const actualPercent = afterTaxIncome > 0 ? (amount / afterTaxIncome) * 100 : 0;
    return { label, amount, targetPercent, actualPercent, deltaPercentPoints: actualPercent - targetPercent };
  }

  const buckets: BudgetRuleBucket[] = [
    bucket("Needs", needsSpent, TARGETS.needs),
    bucket("Wants", wantsSpent, TARGETS.wants),
    bucket("Savings", savingsTotal, TARGETS.savings),
  ];

  return {
    afterTaxIncome,
    buckets,
    unaccountedFor: afterTaxIncome - (needsSpent + wantsSpent + savingsTotal),
  };
}
