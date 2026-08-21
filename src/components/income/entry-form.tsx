"use client";

import { useActionState } from "react";
import { logIncomeEntry } from "@/lib/income/actions";
import { SubmitButton } from "@/components/submit-button";

const today = () => new Date().toISOString().slice(0, 10);

export function EntryForm() {
  const [state, action] = useActionState(logIncomeEntry, {});

  return (
    // React resets uncontrolled fields automatically after a successful
    // action here — no manual form.reset() needed.
    <form action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label htmlFor="label" className="mb-1.5 block text-sm text-foreground-muted">
            Label
          </label>
          <input
            id="label"
            name="label"
            type="text"
            required
            placeholder="e.g. October salary"
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="amount" className="mb-1.5 block text-sm text-foreground-muted">
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="entry_date" className="mb-1.5 block text-sm text-foreground-muted">
            Date
          </label>
          <input
            id="entry_date"
            name="entry_date"
            type="date"
            required
            defaultValue={today()}
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
      </div>
      {state.error ? <p className="text-sm text-negative">{state.error}</p> : null}
      <SubmitButton>Log pay entry</SubmitButton>
    </form>
  );
}
