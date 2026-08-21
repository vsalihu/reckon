import { deleteRecurringBill, markBillPaid } from "@/lib/recurring-bills/actions";
import { calculateMonthlyEquivalent, calculateTotalMonthlyCommitment, getUpcomingBills, type BillFrequency } from "@/lib/recurring-bills";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";

export interface RecurringBillRow {
  id: string;
  name: string;
  amount: number;
  frequency: BillFrequency;
  next_due_date: string;
}

const FREQUENCY_LABEL: Record<BillFrequency, string> = { weekly: "/week", monthly: "/month", annually: "/year" };

export function RecurringBillList({
  bills,
  currency,
  now,
}: {
  bills: RecurringBillRow[];
  currency: CurrencyCode;
  /** Passed in from the server page rather than read via Date.now() here, to keep this component pure. */
  now: Date;
}) {
  const nowMs = now.getTime();
  const totalMonthly = calculateTotalMonthlyCommitment(bills);
  const withDates = bills.map((b) => ({ ...b, nextDueDate: new Date(b.next_due_date) }));
  const upcoming30 = getUpcomingBills(withDates, 30, now);
  const upcoming7Ids = new Set(getUpcomingBills(withDates, 7, now).map((b) => b.id));

  return (
    <div>
      <p className="mb-4 font-numeric text-sm text-foreground-muted">
        <span className="text-foreground">{formatCurrency(totalMonthly, currency)}/mo</span> already committed across{" "}
        {bills.length} bill{bills.length === 1 ? "" : "s"}
      </p>

      {upcoming30.length === 0 ? (
        <p className="text-sm text-foreground-muted">No bills due in the next 30 days.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {upcoming30.map((bill) => {
            const dueDate = new Date(bill.next_due_date);
            const isOverdue = dueDate.getTime() < nowMs;
            const isDueSoon = upcoming7Ids.has(bill.id);
            return (
              <li key={bill.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm text-foreground">{bill.name}</p>
                  <p className={`text-xs ${isOverdue ? "text-negative" : isDueSoon ? "text-accent" : "text-foreground-muted"}`}>
                    {isOverdue ? "Overdue" : "Due"} {dueDate.toLocaleDateString("en-GB")} ·{" "}
                    {formatCurrency(calculateMonthlyEquivalent(bill.amount, bill.frequency), currency)}/mo equiv.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-numeric text-sm text-foreground">
                    {formatCurrency(bill.amount, currency)}
                    {FREQUENCY_LABEL[bill.frequency]}
                  </span>
                  <form action={markBillPaid.bind(null, bill.id)}>
                    <button type="submit" className="rounded-full border border-border px-3 py-1 text-xs text-foreground hover:border-accent hover:text-accent">
                      Mark paid
                    </button>
                  </form>
                  <form action={deleteRecurringBill.bind(null, bill.id)}>
                    <button
                      type="submit"
                      aria-label={`Delete ${bill.name}`}
                      className="text-foreground-muted transition-colors hover:text-negative"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
