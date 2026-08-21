/**
 * The reverse of calculateSuggestedContribution (src/lib/goals/suggested-contribution.ts):
 * given a contribution amount, solve for the projected completion date,
 * instead of given a deadline, solve for the required contribution.
 * Powers the "what if" slider on a goal's detail view.
 */
export type ContributionPeriod = "weekly" | "monthly";

export interface WhatIfInput {
  remainingAmount: number;
  contributionAmount: number;
  period: ContributionPeriod;
  now?: Date;
}

export interface WhatIfResult {
  /** null when the contribution amount is 0 and the goal isn't already funded — it would never complete. */
  projectedDate: Date | null;
  periodsToComplete: number | null;
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const AVG_MS_PER_MONTH = (365.25 / 12) * 24 * 60 * 60 * 1000;

export function calculateWhatIfProjection(input: WhatIfInput): WhatIfResult {
  const { remainingAmount, contributionAmount, period, now = new Date() } = input;

  if (remainingAmount <= 0) {
    return { projectedDate: now, periodsToComplete: 0 };
  }

  if (contributionAmount <= 0) {
    return { projectedDate: null, periodsToComplete: null };
  }

  const periodsToComplete = Math.ceil(remainingAmount / contributionAmount);
  const periodMs = period === "weekly" ? MS_PER_WEEK : AVG_MS_PER_MONTH;
  const projectedDate = new Date(now.getTime() + periodsToComplete * periodMs);

  return { projectedDate, periodsToComplete };
}
