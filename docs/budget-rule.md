# 50/30/20 rule check

Status: Phase 6. Implementation: `src/lib/spending/budget-rule.ts`.

## Why categories need a manual tag

Spending categories are fully user-defined (Phase 2) — there's no fixed
list the app could pattern-match against to decide "Groceries" is a need
and "Streaming subscriptions" is a want. So the split is entirely
opt-in: a user tags each of their own categories as `needs`, `wants`, or
`savings` (`spending_categories.budget_group`, nullable). An untagged
category is simply excluded from the 50/30/20 split — not silently
counted as a need or a want, which would misrepresent the numbers.

## What feeds each bucket

- **Needs** — sum of `spending_entries.amount` where the entry's category
  is tagged `needs`.
- **Wants** — same, for categories tagged `wants`.
- **Savings** — `goal_contributions` count automatically (the brief is
  explicit: "goal contributions already count toward the savings side
  automatically") **plus** any spending entries in a category tagged
  `savings`. The latter exists for savings-adjacent spending that isn't
  a goal contribution — e.g. a standing order into a general savings
  account that isn't earmarked to a specific goal in this app yet.
- **After-tax income** — the same combined PAYE + self-employed net
  figure the take-home card already computes
  (`calculateMixedIncomeTakeHome`, Phase 4), from logged income entries.
  Reusing this rather than inventing a second income figure keeps "how
  much did I actually take home" consistent across the whole app.

## Period

Like the rest of the spending and income views in this app (the spending
page's running total, the dashboard's logged-income gauge), this
operates over **all logged data**, not a rolling month or the current
tax year specifically. There's no date-range picker anywhere else in the
app yet, so adding one just for this check would be inconsistent with
how every other total in Reckon currently works. Worth revisiting once
there's a real need for period filtering more broadly.

## Informational, not prescriptive

Per the brief: this shows the numbers and how far each bucket sits from
its target, and stops there. `deltaPercentPoints` is signed (positive =
over target, negative = under) so the UI can show direction without
attaching a verdict — no color-coded "you're overspending" messaging,
no suggested cuts. The user decides what a deviation means for them; a
`needs` bucket running high might mean an expensive city to live in, not
a spending problem.

## Edge cases

- **£0 after-tax income** — every bucket's percentage is 0 rather than
  `NaN`/`Infinity` from a division by zero (no income logged yet is a
  normal starting state, not an error).
- **Spending in untagged categories** — not counted in any bucket,
  reflected in `unaccountedFor` (`afterTaxIncome − sum of all three
  buckets`) alongside genuinely un-allocated income, so the numbers stay
  honest about what they do and don't cover.
