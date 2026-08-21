"use client";

import { useTransition } from "react";
import { deleteSpendingCategory, setCategoryBudgetGroup } from "@/lib/spending/actions";

export interface CategoryRow {
  id: string;
  name: string;
  budget_group: string | null;
}

const BUDGET_GROUP_LABEL: Record<string, string> = { needs: "Needs", wants: "Wants", savings: "Savings" };

export function CategoryList({ categories }: { categories: CategoryRow[] }) {
  const [, startTransition] = useTransition();

  if (categories.length === 0) {
    return <p className="text-sm text-foreground-muted">No categories yet — add one below.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {categories.map((category) => (
        <li
          key={category.id}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground"
        >
          <span className="flex-1">{category.name}</span>
          <select
            value={category.budget_group ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              startTransition(() => {
                setCategoryBudgetGroup(category.id, value);
              });
            }}
            aria-label={`Budget group for ${category.name}`}
            className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-accent"
          >
            <option value="">Untagged</option>
            {Object.entries(BUDGET_GROUP_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <form action={deleteSpendingCategory.bind(null, category.id)}>
            <button
              type="submit"
              aria-label={`Delete category ${category.name}`}
              className="text-foreground-muted transition-colors hover:text-negative"
            >
              ×
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
