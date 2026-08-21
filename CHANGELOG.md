# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Email/password and Google OAuth sign-up/sign-in via Supabase Auth, with
  currency chosen once at signup and fixed for the account. Verified
  end-to-end (including RLS) against the live Supabase project.

- Project scaffold: Next.js 16 (App Router) + TypeScript, Tailwind v4.
- Dark navy / brass-gold "ledger" design system with light/dark mode toggle
  (`next-themes`), serif display type (Fraunces) + monospace numerals (IBM
  Plex Mono).
- Supabase client setup (browser, server, service-role) and middleware for
  session refresh.
- Phase 1 database schema (`supabase/schema.sql`): `profiles`,
  `income_targets`, `income_entries`, `goals`, `goal_contributions`,
  `goal_nudges` — with Row Level Security policies and a non-cascading
  delete path from goals to their contribution history.
- UK Income Tax & Employee National Insurance calculation engine for
  2025/26, with rates isolated in a dedicated config file and full unit
  test coverage (`src/lib/tax`).
- "Behind on goal" pace-vs-income formula, documented in
  `docs/behind-on-goal.md` and implemented with unit tests
  (`src/lib/goals/behind-on-goal.ts`).
- Vitest (unit) and Playwright (e2e) test tooling configured.

[Unreleased]: https://github.com/vsalihu/reckon/compare/main...HEAD
