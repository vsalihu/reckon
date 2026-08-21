export type BillFrequency = "weekly" | "monthly" | "annually";

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  frequency: BillFrequency;
  nextDueDate: Date;
}

const WEEKS_PER_MONTH = 52 / 12;

/** Normalizes any frequency to its monthly-equivalent cost — the number most useful for "how much is already spoken for." */
export function calculateMonthlyEquivalent(amount: number, frequency: BillFrequency): number {
  switch (frequency) {
    case "weekly":
      return amount * WEEKS_PER_MONTH;
    case "monthly":
      return amount;
    case "annually":
      return amount / 12;
  }
}

export function calculateTotalMonthlyCommitment(bills: Pick<RecurringBill, "amount" | "frequency">[]): number {
  return round2(bills.reduce((sum, bill) => sum + calculateMonthlyEquivalent(bill.amount, bill.frequency), 0));
}

/** Bills due within `withinDays` of `now` (inclusive), soonest first. Overdue bills (past due) are included too — they're still "coming up" in the sense of needing attention. */
export function getUpcomingBills<T extends { nextDueDate: Date }>(bills: T[], withinDays: number, now: Date = new Date()): T[] {
  const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
  return bills
    .filter((bill) => bill.nextDueDate.getTime() <= cutoff.getTime())
    .sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
}

/** Advances a due date by one period of the given frequency — used when a bill is marked paid. */
export function calculateNextDueDate(currentDueDate: Date, frequency: BillFrequency): Date {
  const next = new Date(currentDueDate);
  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "annually":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
