/**
 * The spare change from rounding a spending amount up to the nearest whole
 * currency unit — e.g. £4.60 → £5.00 rounds up by £0.40. Used to offer a
 * manual "round this up toward a goal" action on a spending entry.
 */
export function calculateRoundUp(amount: number): number {
  if (amount <= 0) return 0;
  const rounded = Math.ceil(amount);
  const roundUp = rounded - amount;
  // Already a whole number — nothing to round up.
  return Math.round(roundUp * 100) / 100;
}
