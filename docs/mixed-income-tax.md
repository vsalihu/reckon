# Mixed PAYE + self-employed tax calculation

Status: Phase 4. Revisit each April alongside the rate config files.

## The problem

Income Tax and National Insurance are not the same kind of calculation.
Once a user can log both PAYE and self-employed income in the same tax
year, it's tempting to just add everything up and run one calculation —
that's wrong for NI, and the brief is explicit about it: **Income Tax
combines; National Insurance does not.**

## Income Tax: combined

There is one Personal Allowance and one set of Income Tax bands per
person, regardless of how many sources their income comes from. HMRC
taxes the total:

```
combined_gross = paye_gross + self_employed_profit
```

`combined_gross` goes through the existing single-employment calculation
unchanged — `calculatePersonalAllowance` (taper above £100,000) then the
20%/40%/45% bands (`calculateIncomeTax`) — exactly as if it were one
number, because for Income Tax purposes it effectively is.

## National Insurance: separate bases, then summed

Employee Class 1 NI and self-employed Class 2/4 NI are different taxes
with different thresholds and different rules. They are calculated
independently, each against only its own income type, and only added
together at the very end as a total deduction:

```
class_1_ni  = employee_ni(paye_gross)              -- existing Phase 1 calc, unchanged
class_4_ni  = class_4_ni(self_employed_profit)      -- new, this phase
class_2_ni  = 0 (mandatory) -- see below
total_ni    = class_1_ni + class_4_ni + class_2_ni
```

**This is the part it's easy to get subtly wrong**: `class_4_ni` must be
calculated on `self_employed_profit` alone, not on `combined_gross`. A
user with £40,000 PAYE and £20,000 self-employed profit does **not** pay
Class 4 on £60,000 — Class 4 only ever sees the £20,000, because Class 1
already covers the PAYE portion under its own rules. Combining the NI
bases would double-count the Personal Allowance-equivalent thresholds
that each NI class already has built into its own limits, and would
charge Class 4 (a self-employment-specific tax) on income that was never
self-employed.

### Class 4 NI (`src/lib/tax/rates.uk.self-employed.2025-26.ts`)

Same two-band shape as employee NI, applied to self-employed profit:

- 0% below the Lower Profits Limit (£12,570 for 2025/26)
- 6% between the Lower and Upper Profits Limits (£12,570–£50,270)
- 2% above the Upper Profits Limit

### Class 2 NI — mostly £0 under current law

Class 2 stopped being a mandatory flat charge from April 2024. For
2025/26 (verified against gov.uk, cross-checked across two searches):

- Self-employed profit **at or above** the Small Profits Threshold
  (£6,845) gets a National Insurance credit automatically — **£0
  mandatory cost**.
- Profit **below** that threshold has the *option* to pay Class 2
  voluntarily, at £3.50/week (£182/year), to protect State Pension
  entitlement.

This calculator only reports **mandatory** liability, which is always
£0 — the voluntary election is a personal financial planning choice, not
a deduction that happens to someone automatically, so it's never
subtracted from the take-home estimate. `calculateClass2Ni()` returns
`voluntaryAvailable`/`voluntaryAnnual` so the UI can surface the option
without silently either charging for it or hiding that it exists.

## Pension deduction — PAYE only

The brief scopes pension modelling to a simple flat percentage of PAYE
salary, explicitly not full employer-match/annual-allowance/
salary-sacrifice modelling, and explicitly PAYE-only ("self-employed
pension contributions work differently in reality"). Self-employed
profit is never included in the pension deduction base:

```
pension_deduction = paye_gross × (pension_contribution_percent / 100)
```

This is a simplification worth naming explicitly: it's deducted from net
pay as a separate line, not treated as reducing taxable income the way a
real net-pay-arrangement or salary-sacrifice pension scheme would. A more
accurate model would need to know which of several real pension
mechanisms applies, which is exactly the complexity the brief says to
avoid for now.

## Net take-home

```
net = combined_gross − income_tax − class_1_ni − class_4_ni − pension_deduction
```

(`class_2_ni` is always 0 and omitted from the visible subtraction, but
included in the formula for completeness/future-proofing if that ever
changes.)

## Estimate, not Self Assessment

Real Self Assessment involves allowable expenses, the trading allowance,
and other detail this doesn't model — `self_employed_profit` here is
assumed to already be "profit" (revenue minus allowable expenses) as
entered by the user, not raw turnover. Labelled as an estimate throughout
the UI for the same reason the single-employment estimate already is.

## Where this lives in code

`src/lib/tax/mixed-income.ts` — `calculateMixedIncomeTakeHome()` is the
entry point; `calculateClass2Ni()` and `calculateClass4Ni()` are exported
separately for the unit tests and any UI that wants the NI breakdown
without the full combined estimate. Rates: `rates.uk.self-employed.2025-26.ts`
(self-employed) alongside the existing `rates.uk.2025-26.ts` (Income Tax +
Class 1), both wired through `current-year.ts` the same way.
