import { deleteIncomeEntry } from "@/lib/income/actions";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";

export interface IncomeEntryRow {
  id: string;
  label: string;
  amount: number;
  entry_date: string;
  employment_type: "paye" | "self_employed";
}

const EMPLOYMENT_TYPE_LABEL: Record<IncomeEntryRow["employment_type"], string> = {
  paye: "PAYE",
  self_employed: "Self-employed",
};

export function EntryList({ entries, currency }: { entries: IncomeEntryRow[]; currency: CurrencyCode }) {
  if (entries.length === 0) {
    return <p className="text-sm text-foreground-muted">No pay entries logged yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center justify-between gap-3 py-3">
          <div>
            <p className="text-sm text-foreground">{entry.label}</p>
            <p className="text-xs text-foreground-muted">
              {EMPLOYMENT_TYPE_LABEL[entry.employment_type]} · {new Date(entry.entry_date).toLocaleDateString("en-GB")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-numeric text-sm text-foreground">{formatCurrency(entry.amount, currency)}</span>
            <form action={deleteIncomeEntry.bind(null, entry.id)}>
              <button
                type="submit"
                aria-label={`Delete ${entry.label}`}
                className="text-foreground-muted transition-colors hover:text-negative"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
