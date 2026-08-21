# Reckon

Reckon is a mobile-first web app for tracking income — with automatic UK
tax/National Insurance deductions — and saving toward specific goals (a car,
a house deposit, whatever's next). Log what you earn, log what you save, and
see clearly whether your saving rate is actually keeping pace with your
income, not just the calendar.

**Status:** [v0.5.0](https://github.com/vsalihu/reckon/releases/tag/v0.5.0) —
Phase 1 (auth, income logging, take-home estimate, savings goals with
nudges), Phase 2 (car/house cost calculators, spending tracking, overview
dashboard), Phase 3 (streaks, milestone celebrations, a "what if"
contribution slider, manual round-ups), Phase 4 (mixed PAYE/self-employed
tax, pension modelling, payslip comparison, pay rise simulator), and Phase 5
(lease vs finance vs cash, mortgage overpayment, stamp duty for all three UK
nations, LISA bonus tracker) are built and verified against the live
Supabase project. Not yet deployed to production. Google OAuth is
implemented but not yet enabled (needs a Google Cloud OAuth
client configured in the Supabase dashboard).

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
npm run test:e2e    # end-to-end tests (Playwright) — starts its own dev server automatically
```

The e2e specs (`e2e/`) run against your real `.env.local` Supabase project — `income.spec.ts` and
`goals.spec.ts` use the service-role key to create/delete pre-confirmed test users via the admin
API, sign in through the real UI, and clean up after themselves. `sign-up.spec.ts` exercises the
actual `signUp()` email flow, which can occasionally hit Supabase's shared email rate limit under
heavy local iteration — that's an environment constraint, not an app bug.

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
  schema.sql         # full database schema + RLS policies (current state)
  migrations/        # incremental changes applied on top of schema.sql, in order
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

Phase 1 (done, v0.1.0): auth, manual income logging with UK take-home
estimate, multi-goal savings tracking with drag-reorderable priority, manual
contribution logging, and "behind on goal" nudges (in-app + email).

Phase 2 (done, v0.2.0): car and house cost calculators (loan amortization,
multi-scenario comparison, goal linking), user-defined spending categories
with manual entries, and an overview dashboard pulling income, goals,
spending, and scenarios together with charts.

Phase 3 (done, v0.3.0) — Goals & motivation: per-goal weekly streaks,
one-time milestone celebrations at 25/50/75/100% funded, a live "what if"
contribution slider on each goal's detail page, and manual round-ups from a
spending entry to a goal. All built on the existing goals/contributions
data — no new tables.

Phase 4 (done, v0.4.0) — Income & tax intelligence: mixed PAYE +
self-employed tax calculation (employment type per income entry, combined
Income Tax against one Personal Allowance, National Insurance calculated
separately per income type — see `docs/mixed-income-tax.md`), a flat-rate
pension contribution deduction, a payslip comparison tool, and a pay rise
simulator.

Phase 5 (done, v0.5.0) — Car & house extras: lease vs finance vs cash
comparison for a car scenario, mortgage overpayment modelling (real
month-by-month amortization recalculation), stamp duty calculators for all
three UK nations (SDLT/LBTT/LTT — genuinely separate systems, see
`docs/stamp-duty.md`), and a LISA bonus tracker linked into the existing
goals system.

Next up (not yet built), the last backlog group: Spending & budgeting
(50/30/20 check, recurring bill tracker) — followed eventually by
UK Open Banking
integration (see `docs/car-house-costs.md` and the
`source`/`external_transaction_id` columns on `spending_entries` for how
that's meant to slot in without a restructure), social/accountability
features, and quality-of-life additions. Tracked internally and
prioritized incrementally as the core product is live and in real use.

## License

MIT — see [`LICENSE`](LICENSE).
