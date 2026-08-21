"use client";

import { useActionState } from "react";
import { createRecurringBill } from "@/lib/recurring-bills/actions";
import { SubmitButton } from "@/components/submit-button";

const today = () => new Date().toISOString().slice(0, 10);

export function RecurringBillForm() {
  const [state, action] = useActionState(createRecurringBill, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label htmlFor="bill-name" className="mb-1.5 block text-sm text-foreground-muted">
            Bill name
          </label>
          <input
            id="bill-name"
            name="name"
            type="text"
            required
            placeholder="e.g. Rent"
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="bill-amount" className="mb-1.5 block text-sm text-foreground-muted">
            Amount
          </label>
          <input
            id="bill-amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="bill-frequency" className="mb-1.5 block text-sm text-foreground-muted">
            Frequency
          </label>
          <select
            id="bill-frequency"
            name="frequency"
            defaultValue="monthly"
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annually">Annually</option>
          </select>
        </div>
        <div className="col-span-2">
          <label htmlFor="bill-next-due" className="mb-1.5 block text-sm text-foreground-muted">
            Next due date
          </label>
          <input
            id="bill-next-due"
            name="next_due_date"
            type="date"
            required
            defaultValue={today()}
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
      </div>
      {state.error ? <p className="text-sm text-negative">{state.error}</p> : null}
      <SubmitButton>Add bill</SubmitButton>
    </form>
  );
}
