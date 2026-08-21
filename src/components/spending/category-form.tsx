"use client";

import { useActionState } from "react";
import { createSpendingCategory } from "@/lib/spending/actions";
import { SubmitButton } from "@/components/submit-button";

export function CategoryForm() {
  const [state, action] = useActionState(createSpendingCategory, {});

  return (
    <form action={action} className="flex items-end gap-2">
      <div className="flex-1">
        <label htmlFor="category-name" className="mb-1.5 block text-sm text-foreground-muted">
          New category
        </label>
        <input
          id="category-name"
          name="name"
          type="text"
          required
          placeholder="e.g. Groceries"
          className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
        />
      </div>
      <SubmitButton className="h-11 w-auto px-4">Add</SubmitButton>
      {state.error ? <p className="text-sm text-negative">{state.error}</p> : null}
    </form>
  );
}
