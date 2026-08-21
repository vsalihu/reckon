# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/vsalihu/reckon/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/vsalihu/reckon/releases/tag/v0.2.0
[0.1.0]: https://github.com/vsalihu/reckon/releases/tag/v0.1.0
