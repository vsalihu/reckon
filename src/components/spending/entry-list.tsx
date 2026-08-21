import { deleteSpendingEntry } from "@/lib/spending/actions";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";

export interface SpendingEntryRow {
  id: string;
  label: string;
  amount: number;
  entry_date: string;
  category_name_snapshot: string;
}

export function SpendingEntryList({ entries, currency }: { entries: SpendingEntryRow[]; currency: CurrencyCode }) {
  if (entries.length === 0) {
    return <p className="text-sm text-foreground-muted">No spending logged yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center justify-between gap-3 py-3">
          <div>
            <p className="text-sm text-foreground">{entry.label}</p>
            <p className="text-xs text-foreground-muted">
              {entry.category_name_snapshot} · {new Date(entry.entry_date).toLocaleDateString("en-GB")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-numeric text-sm text-foreground">{formatCurrency(entry.amount, currency)}</span>
            <form action={deleteSpendingEntry.bind(null, entry.id)}>
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
