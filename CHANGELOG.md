# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.4.0] - 2026-08-21

Phase 4 (Income & tax intelligence): mixed PAYE/self-employed tax
calculation, pension modelling, payslip comparison, and a pay rise
simulator.

### Added

- **Mixed PAYE + self-employed tax**: employment type is now per income
  entry (`income_entries.employment_type`), not per account, so a user
  can log some entries PAYE and others self-employed within the same tax
  year. Income Tax is calculated once on combined taxable income (one
  Personal Allowance, one set of bands); National Insurance is
  calculated separately per income type — Class 1 on PAYE only, Class 2/4
  on self-employed profit only — and summed only at the end. Documented
  in detail in `docs/mixed-income-tax.md`, since combining the NI bases
  would be a subtle and easy mistake.
- **Class 2/4 NI rates**: isolated in `rates.uk.self-employed.2025-26.ts`,
  same pattern as the existing PAYE rates file. Verified 2025/26 figures
  against gov.uk before implementing, and caught a real discrepancy in
  the process: Class 2 NI stopped being mandatory for most self-employed
  people from April 2024 — profits at/above the £6,845 Small Profits
  Threshold get an NI credit for £0, not a flat weekly charge. Modelled
  as £0 mandatory with the voluntary £3.50/week option (below the
  threshold) surfaced separately rather than silently charged or hidden.
- **Pension contribution modelling**: a flat percentage of PAYE gross
  only (self-employed pension contributions work differently, so
  explicitly out of scope, per the brief). Shows as its own clearly
  labelled deduction line in the take-home breakdown, kept distinct from
  tax/NI.
- **Take-home estimate reworked**: now aggregates logged income entries
  by employment type for the combined estimate, rather than the single
  manually-set annual target (which stays as the separate
  progress-tracking goal, unaffected by employment type) — per the
  brief's "annual figures are an aggregate across mixed entry types."
- **Payslip comparison** (`/tax-tools`): paste a real payslip's
  gross/net for a period; flags a mismatch without claiming either
  figure is "wrong" — a comparison tool, not a source of truth.
- **Pay rise simulator** (`/tax-tools`): given a new salary, shows the
  real extra take-home (not the raw increase) plus an effective rate.
  Thin wrapper around the existing mixed-income engine — no new tax
  logic.
- Migration 0004: two additive columns
  (`income_entries.employment_type`, `profiles.pension_contribution_percent`)
  — no new tables.
- 27 new unit tests (97 total) specifically targeting mixed scenarios,
  Class 2/4 boundaries, pension scoping, payslip tolerance, and pay-rise
  band-crossing behavior.
- 5 new Playwright e2e tests (27 total, 26 passing without the one
  Supabase-email-rate-limited exception).

## [0.3.0] - 2026-08-21

Phase 3 (Goals & motivation): streaks, milestone celebrations, a "what if"
contribution slider, and manual round-ups — all extensions of the existing
goals system, no new tables.

### Added

- **Streaks**: goal cards show a 🔥 current-streak badge for consecutive
  weeks where contributions met or exceeded that week's suggested pace.
  Weekly buckets counted from goal creation (not calendar weeks); each
  week's required pace is recomputed via the existing
  `calculateSuggestedContribution`, so "met" means the same thing here as
  everywhere else. Counts the trailing run from now backwards and floors
  at 0 — a miss doesn't go negative, it resets.
- **Milestone celebrations**: a one-time, non-blocking toast (Sonner,
  styled to the ledger surfaces) fires the first time a goal crosses
  25/50/75/100% funded. Persisted via `goals.celebrated_milestones` so it
  never re-fires for a threshold already shown — including across a
  contribution correction/deletion that dips the percentage back down and
  crosses it again later.
- **"What if" slider**: new `/goals/[id]` detail page with a live,
  unsaved slider for weekly/monthly contribution amount that
  recalculates the projected completion date on every move — the reverse
  of the Phase 1 suggested-contribution formula (given a contribution,
  solve for the date, instead of given a date, solve for the
  contribution).
- **Manual round-ups**: a spending entry with a non-whole amount gets an
  inline "Round up +£X" control; picking a goal logs the spare change as
  a contribution with a note recording its provenance
  (`goal_contributions.note`). Stays manual and per-entry — no automatic
  or retroactive round-up.
- Migration 0003: two additive columns
  (`goals.celebrated_milestones`, `goal_contributions.note`) — everything
  else (streaks, the what-if projection) is computed from data the schema
  already had.
- 25 new unit tests (70 total): streak bucketing, milestone-crossing
  diffing, the reverse contribution formula, and round-up rounding.
- 9 new Playwright e2e tests (22 total, 21 passing without the one
  Supabase-email-rate-limited exception): streak display against a
  seeded backdated goal, one-time milestone toasts, live slider
  exploration, and round-up logging.

## [0.2.0] - 2026-08-21

Phase 2: car and house cost calculators, manual spending tracking, and an
overview dashboard tying everything together.

### Added

- **Car cost calculator**: price/deposit/APR/term → monthly finance
  payment (standard loan amortization formula), plus insurance, road tax
  (VED), and fuel/maintenance → total monthly cost of ownership. MOT is
  modelled as a reminder date, deliberately excluded from the cost total
  (rationale in `docs/car-house-costs.md`). Multiple scenarios compare
  side by side, cheapest first.
- **House cost calculator**: toggle between rent (rent + bills + council
  tax) and mortgage (amortized repayment + buildings insurance/12 +
  council tax/12) modes. Same multi-scenario comparison.
- **Scenario → goal linking**: any car or house scenario can attach to an
  existing savings goal or spawn a new one pre-filled with a sensible
  target (deposit for a car; 10% of loan amount for a mortgage). Link
  lives on the scenario (`linked_goal_id`), superseding the Phase 1
  placeholder columns on `goals`.
- **Spending tracking**: fully user-defined categories (create/delete
  inline, no fixed list) and manual spending entries, following the same
  pattern as income entries. `spending_entries` carries `source` and
  `external_transaction_id` from day one so an automated feed (Open
  Banking, later) can slot in without restructuring.
- **Overview dashboard**: income vs target, goal pace, spending by
  category (chart), and a car/house scenario summary on one page.
  Category chart built per the project's dataviz skill — fixed
  categorical color order validated for CVD-safety against both the
  light and dark surfaces (`node scripts/validate_palette.js`), values
  always shown as direct labels rather than gated behind hover.
- Shared app navigation (`AppHeader`/`AppNav`) across all authenticated
  pages.
- 12 new unit tests (57 total): loan amortization, car/house cost
  breakdowns.
- 7 new Playwright e2e tests (19 total, 18 passing without external rate
  limits): car scenario creation/deletion/goal-linking, house rent and
  mortgage modes, spending categories/entries, and the overview dashboard
  aggregating data logged elsewhere.

### Changed

- `goals.linked_scenario_type`/`linked_scenario_id` (Phase 1 placeholder,
  never used) dropped in favor of `linked_goal_id` on the scenario tables.

## [0.1.0] - 2026-08-21

First working build of the Phase 1 core loop: sign up, log income, see
accurate take-home pay, create and fund savings goals.

### Added

- **Auth**: email/password and Google OAuth sign-up/sign-in via Supabase
  Auth. Currency (GBP or USD, structured to add more later) is chosen once
  at signup and fixed for the account. Verified end-to-end — including Row
  Level Security — against the live Supabase project.
- **Income tracking**: users set an annual gross income target and
  manually log individual pay entries; a progress gauge compares logged
  total against the target.
- **UK take-home estimate**: Income Tax and Employee National Insurance
  calculated from the 2025/26 HMRC rates and thresholds, kept in a single
  dedicated config file (`src/lib/tax/rates.uk.2025-26.ts`) so next year's
  rates are a one-file update. Gated to GBP accounts. Labeled as an
  estimate — no student loan/pension modelling in Phase 1.
- **Savings goals**: create/delete goals (delete removes the goal but
  keeps its contribution history, per spec), drag-and-reorder priority,
  and manual funding via quick-add buttons (+25/+100 in the account's
  currency) or a custom amount.
- **Auto-suggested contribution**: target amount divided by time remaining
  to the deadline, shown per goal.
- **"Behind on goal" detection**: compares a goal's actual contribution
  rate against the user's actual income rate over a trailing 90-day
  window — not just deadline pace. Formula and edge cases documented in
  `docs/behind-on-goal.md`.
- **Nudges**: an in-app banner on behind/overdue goal cards (recomputed
  live on every load) and a daily email nudge (Vercel Cron ->
  `/api/cron/nudges`) with a 7-day cooldown per goal, behind a modular
  `EmailSender` interface so the provider can change later without
  touching the nudge logic.
- **Design system**: dark navy / brass-gold "ledger" aesthetic with a
  light/dark toggle, serif display type (Fraunces) and monospace numerals
  (IBM Plex Mono), mobile-first.
- **Database**: Phase 1 schema (`supabase/schema.sql`) with Row Level
  Security on every user-owned table, plus loosely-planned columns
  (`goals.linked_scenario_type/id`) for Phase 2+ car/house scenario
  linking without a painful future migration.
- **Testing**: Vitest unit tests for the tax engine, behind-on-goal
  formula, suggested-contribution math, and nudge cooldown (33 tests);
  Playwright e2e coverage for sign-up, income logging, and goal
  creation/funding/deletion against a real dev server and the live
  Supabase project.

[Unreleased]: https://github.com/vsalihu/reckon/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/vsalihu/reckon/releases/tag/v0.4.0
[0.3.0]: https://github.com/vsalihu/reckon/releases/tag/v0.3.0
[0.2.0]: https://github.com/vsalihu/reckon/releases/tag/v0.2.0
[0.1.0]: https://github.com/vsalihu/reckon/releases/tag/v0.1.0
