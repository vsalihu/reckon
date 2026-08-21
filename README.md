# Reckon

Reckon is a mobile-first web app for tracking income — with automatic UK
tax/National Insurance deductions — and saving toward specific goals (a car,
a house deposit, whatever's next). Log what you earn, log what you save, and
see clearly whether your saving rate is actually keeping pace with your
income, not just the calendar.

**Status:** [v0.6.0](https://github.com/vsalihu/reckon/releases/tag/v0.6.0) —
Phases 1 through 6 are complete: auth, income logging with an accurate UK
take-home estimate (mixed PAYE/self-employed, pension modelling), savings
goals with streaks/milestones/nudges/a "what if" slider, car and house cost
calculators (finance, lease, cash, mortgage overpayment, stamp duty for all
three UK nations), a LISA bonus tracker, spending tracking with a 50/30/20
check, and a recurring bill tracker. This is a genuinely complete state
relative to everything currently scoped — see the Roadmap below for what's
deliberately deferred. Built and verified against the live Supabase project,
not yet deployed to production. Google OAuth is
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

The full current schema — tables, indexes, and Row Level Security policies —
lives in [`supabase/schema.sql`](supabase/schema.sql). Run it against a
fresh Supabase project via the SQL Editor, or via the Supabase CLI. An
already-provisioned project instead applied this as the Phase 1 base, then
each file in [`supabase/migrations/`](supabase/migrations/) in order.

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

Phase 6 (done, v0.6.0) — Spending & budgeting: a 50/30/20 rule check
(categories tagged Needs/Wants/Savings, goal contributions counting
automatically toward savings, after-tax income reusing the Phase 4
take-home figure — see `docs/budget-rule.md`), and a recurring bill
tracker (`docs/recurring-bills.md`) with upcoming-bills views, a
monthly-commitment total, and a one-click "mark as paid" action.

**This closes out the full currently-scoped feature backlog.** Three
items remain deliberately deferred, not forgotten:

- **UK Open Banking integration** — needs a live provider decision
  (GoCardless's old free tier closed to new signups mid-2025; evaluate
  Enable Banking, TrueLayer, or Yapily Connect, re-checking current
  status when this starts). `spending_entries.source` and
  `external_transaction_id` are already shaped for this to slot in
  without a restructure.
- **Shared household goals** — real data-model implications (goal
  ownership isn't 1:1 with a user anymore) that haven't been decided yet.
- **Anonymous savings benchmarking** — needs real aggregate UK savings
  data; not something to build against placeholder numbers.

With the backlog otherwise clear, deploying to Vercel (deferred since
Phase 1) is a natural next step to consider, rather than assuming further
feature work is automatically next.

## License

MIT — see [`LICENSE`](LICENSE).
