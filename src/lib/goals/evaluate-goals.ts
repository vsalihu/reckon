import { evaluateBehindOnGoal, type BehindOnGoalResult } from "./behind-on-goal";

const DAY_MS = 24 * 60 * 60 * 1000;
const TRAILING_WINDOW_DAYS = 90;

export interface GoalRecord {
  id: string;
  target_amount: number;
  deadline: string; // ISO date
  created_at: string; // ISO timestamp
}

export interface ContributionRecord {
  goal_id: string | null;
  amount: number;
  contributed_at: string; // ISO date
}

export interface IncomeEntryRecord {
  amount: number;
  entry_date: string; // ISO date
}

export interface GoalStatus {
  goalId: string;
  contributedTotal: number;
  result: BehindOnGoalResult;
}

/**
 * Evaluates "behind on goal" for every goal at once, given the raw rows a
 * dashboard query would fetch. Pure — no DB access — so it's testable
 * independently of Supabase. See docs/behind-on-goal.md for the formula.
 */
export function evaluateGoals(input: {
  goals: GoalRecord[];
  contributions: ContributionRecord[];
  incomeEntries: IncomeEntryRecord[];
  annualGrossTarget: number;
  now?: Date;
}): GoalStatus[] {
  const { goals, contributions, incomeEntries, annualGrossTarget, now = new Date() } = input;

  return goals.map((goal) => {
    const goalContributions = contributions.filter((c) => c.goal_id === goal.id);
    const contributedTotal = goalContributions.reduce((sum, c) => sum + c.amount, 0);
    const remainingAmount = goal.target_amount - contributedTotal;

    const deadline = new Date(goal.deadline);
    const isPastDeadline = deadline.getTime() < now.getTime();
    const daysUntilDeadline = Math.max(0, (deadline.getTime() - now.getTime()) / DAY_MS);
    const incomeExpectedBeforeDeadline = (annualGrossTarget * daysUntilDeadline) / 365;

    const createdAt = new Date(goal.created_at);
    const goalAgeDays = Math.max(0, (now.getTime() - createdAt.getTime()) / DAY_MS);

    const windowStartMs = Math.max(createdAt.getTime(), now.getTime() - TRAILING_WINDOW_DAYS * DAY_MS);
    const contributionsInWindow = goalContributions
      .filter((c) => new Date(c.contributed_at).getTime() >= windowStartMs)
      .reduce((sum, c) => sum + c.amount, 0);
    const incomeLoggedInWindow = incomeEntries
      .filter((e) => new Date(e.entry_date).getTime() >= windowStartMs)
      .reduce((sum, e) => sum + e.amount, 0);

    const result = evaluateBehindOnGoal({
      remainingAmount,
      incomeExpectedBeforeDeadline,
      contributionsInWindow,
      incomeLoggedInWindow,
      goalAgeDays,
      isPastDeadline,
    });

    return { goalId: goal.id, contributedTotal, result };
  });
}
