import { calculateSuggestedContribution } from "./suggested-contribution";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface StreakContribution {
  amount: number;
  contributedAt: Date;
}

export interface StreakInput {
  targetAmount: number;
  createdAt: Date;
  deadline: Date;
  contributions: StreakContribution[];
  now?: Date;
}

export interface StreakResult {
  /** Consecutive completed weeks, most recent first, where contributions met or exceeded that week's suggested pace. */
  currentStreakWeeks: number;
}

/**
 * Weekly granularity, per the brief's "stay consistent with existing
 * pace/period logic": weeks are simple 7-day buckets counted from the
 * goal's creation date (not calendar weeks), matching how
 * calculateSuggestedContribution already reasons in rolling periods
 * rather than calendar-aligned ones.
 *
 * Only fully-completed weeks count — the in-progress week is never
 * "missed" before it's over, so the streak can't be broken mid-week. Each
 * week's target is recomputed via calculateSuggestedContribution as of
 * that week's start (remaining amount at the time ÷ time left then), the
 * same formula the goal card already shows — so "met the suggested pace"
 * means the same thing here as everywhere else in the app.
 */
export function calculateGoalStreak(input: StreakInput): StreakResult {
  const { targetAmount, createdAt, deadline, contributions, now = new Date() } = input;

  const sorted = [...contributions].sort((a, b) => a.contributedAt.getTime() - b.contributedAt.getTime());

  const completedWeeks = Math.floor((now.getTime() - createdAt.getTime()) / WEEK_MS);
  if (completedWeeks <= 0) return { currentStreakWeeks: 0 };

  let streak = 0;
  for (let weekIndex = completedWeeks - 1; weekIndex >= 0; weekIndex--) {
    const weekStart = new Date(createdAt.getTime() + weekIndex * WEEK_MS);
    const weekEnd = new Date(weekStart.getTime() + WEEK_MS);

    const contributedBeforeWeek = sorted
      .filter((c) => c.contributedAt.getTime() < weekStart.getTime())
      .reduce((sum, c) => sum + c.amount, 0);
    const contributedInWeek = sorted
      .filter((c) => c.contributedAt.getTime() >= weekStart.getTime() && c.contributedAt.getTime() < weekEnd.getTime())
      .reduce((sum, c) => sum + c.amount, 0);

    const suggestion = calculateSuggestedContribution({
      targetAmount,
      alreadyContributed: contributedBeforeWeek,
      deadline,
      now: weekStart,
    });

    // Already funded going into this week — nothing required, counts as met.
    const met = suggestion.remainingAmount <= 0 || contributedInWeek >= suggestion.weeklyAmount;

    if (!met) break;
    streak++;
  }

  return { currentStreakWeeks: Math.max(0, streak) };
}
