# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/vsalihu/reckon/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/vsalihu/reckon/releases/tag/v0.1.0
