/**
 * "Behind on goal" pace check. See /docs/behind-on-goal.md for the full
 * rationale — this is a pure function; callers aggregate the DB numbers.
 */

const BEHIND_THRESHOLD = 0.9;
const MIN_GOAL_AGE_DAYS_BEFORE_JUDGING = 7;

export interface BehindOnGoalInput {
  /** Goal target minus everything contributed so far. */
  remainingAmount: number;
  /** Gross income still expected to be earned before the deadline. */
  incomeExpectedBeforeDeadline: number;
  /** Sum of contributions to this goal within the trailing window. */
  contributionsInWindow: number;
  /** Sum of all income logged (any goal) within the same trailing window. */
  incomeLoggedInWindow: number;
  /** Days since the goal was created. */
  goalAgeDays: number;
  /** Whether `deadline` is in the past. */
  isPastDeadline: boolean;
}

export type BehindOnGoalResult =
  | { status: "funded" }
  | { status: "overdue" }
  | { status: "insufficient_data" }
  | { status: "too_new" }
  | { status: "on_pace"; requiredRate: number; actualRate: number }
  | { status: "behind"; requiredRate: number; actualRate: number };

export function evaluateBehindOnGoal(input: BehindOnGoalInput): BehindOnGoalResult {
  const {
    remainingAmount,
    incomeExpectedBeforeDeadline,
    contributionsInWindow,
    incomeLoggedInWindow,
    goalAgeDays,
    isPastDeadline,
  } = input;

  if (remainingAmount <= 0) return { status: "funded" };
  if (isPastDeadline) return { status: "overdue" };
  if (goalAgeDays < MIN_GOAL_AGE_DAYS_BEFORE_JUDGING) return { status: "too_new" };
  if (incomeLoggedInWindow <= 0) return { status: "insufficient_data" };
  if (incomeExpectedBeforeDeadline <= 0) return { status: "insufficient_data" };

  const requiredRate = remainingAmount / incomeExpectedBeforeDeadline;
  const actualRate = contributionsInWindow / incomeLoggedInWindow;

  if (actualRate < requiredRate * BEHIND_THRESHOLD) {
    return { status: "behind", requiredRate, actualRate };
  }
  return { status: "on_pace", requiredRate, actualRate };
}
