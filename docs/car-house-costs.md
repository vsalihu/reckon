# Car & house cost calculators

Status: Phase 2 (base calculators), extended in Phase 5 (lease/cash
comparison, mortgage overpayment). Implementation: `src/lib/finance/`.

## Loan amortization

Both car finance and mortgage repayments use the standard fixed-rate
amortizing loan formula:

```
M = P × r × (1 + r)^n / ((1 + r)^n − 1)
```

where `P` is the principal, `r` is the **monthly** interest rate
(`APR / 100 / 12`), and `n` is the number of monthly payments.

Edge case: at 0% APR (`r = 0`), the formula divides by zero — the monthly
payment is simply `P / n` in that case, handled explicitly in
`calculateLoanPayment()`.

## Car scenario: total monthly cost of ownership

```
total = financePayment + insuranceAnnual / 12 + roadTaxAnnual / 12 + fuelMaintenanceMonthly
```

- `financePayment` — from the amortization formula above, on `price − deposit`
  over `termMonths`.
- **MOT is deliberately excluded from this total.** It's modelled as a
  reminder date (`mot_due_date`) rather than a recurring cost line: an MOT
  is a pass/fail roadworthiness test with a small, fairly fixed fee
  (currently a maximum of £54.85 for a car in the UK), not a cost that
  scales meaningfully with the scenario the way insurance or fuel does.
  Folding a once-a-year ~£55 fee into a "monthly cost of ownership" figure
  adds noise without adding decision-relevant signal, and a due-date
  reminder is more useful for what MOT actually requires from the user
  (booking a test on time) than a monthly average would be.

## House scenario: total monthly cost

Rent mode — all inputs are already monthly figures:

```
total = monthlyRent + monthlyBills + councilTaxMonthly
```

Mortgage mode — mirrors the car scenario's annual-figures-divided-by-12
pattern, since buildings insurance and council tax are conventionally
quoted annually:

```
total = mortgagePayment + buildingsInsuranceAnnual / 12 + councilTaxAnnual / 12
```

`mortgagePayment` is the same amortization formula, on `loanAmount` over
`termYears × 12` months.

## Multi-scenario comparison

Scenarios are independent rows a user can create freely; the UI lists them
side by side sorted by total monthly cost (cheapest first) so comparison
doesn't require manual arithmetic.

## Lease vs finance vs cash (Phase 5)

`calculateCarOwnershipComparison()` puts three ownership paths side by
side for the same car, using the running costs (insurance, road tax,
fuel/maintenance) a scenario already has — they apply identically to all
three paths, since they're a cost of driving the car, not of how it's
paid for:

- **Cash** — `price` paid upfront; monthly cost is running costs only;
  owns the car from day one.
- **Finance** — reuses `calculateCarMonthlyCost()` unchanged (the
  existing amortizing-loan calculation); owns the car once the finance
  is repaid. Modelled as HP-style (fully amortizing to zero balance) —
  a PCP-style balloon payment at the end isn't modelled, since the
  scenario has no balloon-payment field.
- **Lease** — the user enters a monthly lease quote directly rather than
  a calculated figure. Leasing math (residual values, mileage
  allowances, provider margin) varies too much by deal to model from
  first principles, so this is "enter what you were quoted, compare it
  against the alternatives" — a comparison tool, not a lease-rate
  calculator. Never owns the car; returned at the end of the term.

The lease path only appears when a quote has actually been entered
(`car_scenarios.lease_monthly_quote` is nullable) — no lease line is
shown for a scenario nobody's got a lease quote for.

## Mortgage overpayment (Phase 5)

`calculateMortgageOverpaymentImpact()` runs a real month-by-month
amortization simulation — not an approximation — twice: once with the
standard payment only, once adding a monthly overpayment and/or a
one-off lump sum at a chosen month. Each month: `interest = balance ×
monthlyRate`, `principalPortion = payment − interest`,
`balance −= principalPortion`, continuing until the balance clears. The
difference between the two runs' total interest paid and months taken is
the interest saved and time saved.

This is why a lump sum paid earlier saves more than the same lump sum
paid later — it reduces the balance interest is calculated against for
more of the remaining term. The standard payment amount itself doesn't
change when overpaying (it's still `calculateLoanPayment()`'s output);
the overpayment is genuinely *extra*, which is what pays down the
balance faster and shortens the schedule.

## Goal linking

A scenario can optionally point at a savings goal via `linked_goal_id`
(see `supabase/migrations/0002_phase2_scenarios_and_spending.sql` for why
the link lives on the scenario, not the goal). The UI supports both
creating a new goal from a scenario (pre-filling the target amount from
the deposit, for a car, or nothing in particular for a house — there's no
single obvious number) and attaching an existing goal.
