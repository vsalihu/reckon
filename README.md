# Reckon

Reckon is a mobile-first web app for tracking income — with automatic UK
tax/National Insurance deductions — and saving toward specific goals (a car,
a house deposit, whatever's next). Log what you earn, log what you save, and
see clearly whether your saving rate is actually keeping pace with your
income, not just the calendar.

**Status:** Phase 1 in active development. Not yet deployed.

## Stack

| Layer      | Choice                                             |
| ---------- | --------------------------------------------------- |
| Framework  | [Next.js](https://nextjs.org) (App Router), TypeScript |
| Backend    | [Supabase](https://supabase.com) — Postgres, Auth, scheduled jobs |
| Styling    | Tailwind CSS v4, custom "ledger" design system      |
| Deployment | [Vercel](https://vercel.com)                        |
| Unit tests | [Vitest](https://vitest.dev)                        |
| E2E tests  | [Playwright](https://playwright.dev)                |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project's URL + keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database setup

The full Phase 1 schema — tables, indexes, and Row Level Security policies —
lives in [`supabase/schema.sql`](supabase/schema.sql). Run it against a
fresh Supabase project via the SQL Editor, or via the Supabase CLI once
migrations are introduced.

### Testing

```bash
npm run test        # unit tests (Vitest) — tax/NI, goal pace logic, etc.
npm run test:watch  # unit tests, watch mode
npm run test:e2e     # end-to-end tests (Playwright) — needs `npm run dev` reachable
```

## Project structure

```
src/
  app/               # Next.js App Router routes
  components/        # shared UI components
  lib/
    tax/             # UK Income Tax + NI calculation engine (rates isolated per tax year)
    goals/           # savings goal logic (pace, "behind on goal" formula)
    supabase/        # Supabase client factories (browser / server / service-role)
supabase/
  schema.sql         # Phase 1 database schema + RLS policies
docs/
  behind-on-goal.md  # the exact "behind on goal" formula and its rationale
e2e/                 # Playwright end-to-end tests
```

## How the UK tax estimate works

Income Tax and Employee National Insurance are calculated from a single
annual gross figure using the current tax year's published HMRC rates and
thresholds, kept in one clearly-labelled config file per tax year
(`src/lib/tax/rates.uk.<year>.ts`) so they're easy to update each April
without touching the calculation logic itself.

This is an **estimate**: it does not model student loan repayments, pension
contributions, or multiple/self-employment income. See
[`src/lib/tax/calculate.ts`](src/lib/tax/calculate.ts) for the full
implementation and its test suite for verified figures against known
salary bands.

## How "behind on goal" is decided

Rather than just comparing progress against the calendar, Reckon compares
how much you're actually contributing to a goal against how much you're
actually earning in the same period — see
[`docs/behind-on-goal.md`](docs/behind-on-goal.md) for the full formula,
edge cases, and rationale.

## Versioning & releases

This project follows [Semantic Versioning](https://semver.org/). Every
release is tagged and published with a changelog-style description of what
changed — see [`CHANGELOG.md`](CHANGELOG.md) and the
[Releases page](https://github.com/vsalihu/reckon/releases).

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).

## Roadmap

Phase 1 (current): auth, manual income logging with UK take-home estimate,
multi-goal savings tracking with drag-reorderable priority, manual
contribution logging, and "behind on goal" nudges (in-app + email).

Phase 2+ (schema-planned, not yet built): car/house cost calculators,
goal-linked cost scenarios, user-defined spending categories, an overview
dashboard, and UK Open Banking integration.

A larger backlog beyond that (streaks, milestone celebrations, payslip
comparison, mortgage tools, shared household goals, and more) is tracked
internally and will be prioritized once the Phase 1 core is live and in
real use.

## License

MIT — see [`LICENSE`](LICENSE).
