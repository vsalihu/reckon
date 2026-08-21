"use client";

import { useActionState } from "react";
import { logSpendingEntry } from "@/lib/spending/actions";
import { SubmitButton } from "@/components/submit-button";
import type { CategoryRow } from "@/components/spending/category-list";

const today = () => new Date().toISOString().slice(0, 10);

export function SpendingEntryForm({ categories }: { categories: CategoryRow[] }) {
  const [state, action] = useActionState(logSpendingEntry, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label htmlFor="spending-label" className="mb-1.5 block text-sm text-foreground-muted">
            Label
          </label>
          <input
            id="spending-label"
            name="label"
            type="text"
            required
            placeholder="e.g. Weekly shop"
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="spending-amount" className="mb-1.5 block text-sm text-foreground-muted">
            Amount
          </label>
          <input
            id="spending-amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="spending-date" className="mb-1.5 block text-sm text-foreground-muted">
            Date
          </label>
          <input
            id="spending-date"
            name="entry_date"
            type="date"
            required
            defaultValue={today()}
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
        <div className="col-span-2">
          <label htmlFor="spending-category" className="mb-1.5 block text-sm text-foreground-muted">
            Category
          </label>
          <select
            id="spending-category"
            name="category_id"
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {state.error ? <p className="text-sm text-negative">{state.error}</p> : null}
      <SubmitButton>Log spending</SubmitButton>
    </form>
  );
}
