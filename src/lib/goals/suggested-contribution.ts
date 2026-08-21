/**
 * Auto-suggested weekly/monthly contribution: target minus what's already
 * contributed, spread evenly across the time remaining until the deadline.
 */
export interface SuggestedContributionInput {
  targetAmount: number;
  alreadyContributed: number;
  deadline: Date;
  now?: Date;
}

export interface SuggestedContribution {
  remainingAmount: number;
  weeksRemaining: number;
  monthsRemaining: number;
  weeklyAmount: number;
  monthlyAmount: number;
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const AVG_MS_PER_MONTH = (365.25 / 12) * 24 * 60 * 60 * 1000;

export function calculateSuggestedContribution(input: SuggestedContributionInput): SuggestedContribution {
  const { targetAmount, alreadyContributed, deadline, now = new Date() } = input;
  const remainingAmount = Math.max(0, targetAmount - alreadyContributed);
  const msRemaining = Math.max(0, deadline.getTime() - now.getTime());

  // At least 1 period so we don't divide by zero / suggest an infinite
  // contribution for a goal whose deadline is today or in the past.
  const weeksRemaining = Math.max(1, msRemaining / MS_PER_WEEK);
  const monthsRemaining = Math.max(1, msRemaining / AVG_MS_PER_MONTH);

  return {
    remainingAmount,
    weeksRemaining,
    monthsRemaining,
    weeklyAmount: remainingAmount / weeksRemaining,
    monthlyAmount: remainingAmount / monthsRemaining,
  };
}
