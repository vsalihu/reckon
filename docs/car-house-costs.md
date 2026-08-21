# Car & house cost calculators

Status: Phase 2. Implementation: `src/lib/finance/`.

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

## Goal linking

A scenario can optionally point at a savings goal via `linked_goal_id`
(see `supabase/migrations/0002_phase2_scenarios_and_spending.sql` for why
the link lives on the scenario, not the goal). The UI supports both
creating a new goal from a scenario (pre-filling the target amount from
the deposit, for a car, or nothing in particular for a house — there's no
single obvious number) and attaching an existing goal.
