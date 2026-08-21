export const MILESTONE_THRESHOLDS = [25, 50, 75, 100] as const;
export type MilestoneThreshold = (typeof MILESTONE_THRESHOLDS)[number];

/**
 * Which thresholds the current funded percentage has reached that aren't
 * already in `celebrated` — i.e. what should trigger a one-time
 * celebration right now. `celebrated` is the persisted
 * `goals.celebrated_milestones` array: once a threshold is in there it's
 * never returned again, even if the percentage later dips below it (e.g.
 * a contribution correction) and crosses back up — see
 * migrations/0003_phase3_goals_motivation.sql.
 */
export function findNewlyCrossedMilestones(
  contributedTotal: number,
  targetAmount: number,
  celebrated: readonly number[],
): MilestoneThreshold[] {
  if (targetAmount <= 0) return [];
  const percent = (contributedTotal / targetAmount) * 100;

  return MILESTONE_THRESHOLDS.filter((threshold) => percent >= threshold && !celebrated.includes(threshold));
}
