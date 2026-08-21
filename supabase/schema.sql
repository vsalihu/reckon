-- Reckon database schema — current as of Phase 2.
--
-- This file is the full schema for a fresh project. An already-provisioned
-- project (like the live one) instead applied this as Phase 1, then each
-- file in supabase/migrations/ in order — see that directory for the
-- history of how the schema below was arrived at incrementally.
--
-- Design notes:
--   - `profiles` extends `auth.users` 1:1 (Supabase convention) and is
--     where currency is fixed at signup.
--   - Every user-owned table has `user_id` + Row Level Security so users
--     can only ever see their own rows.
--   - `goals.owner_type`/`owner_id` are deliberately not just a bare
--     `user_id` FK — the backlog's "shared household goals" idea needs a
--     goal to eventually belong to more than one user. For Phase 1,
--     `owner_type` is always 'user' and `owner_id` is the creator's user
--     id; a future migration can introduce a `households` table and swap
--     the type without reshaping `goal_contributions`.
--   - Deleting a goal is a real DELETE of the `goals` row (the brief is
--     explicit: "removes the goal itself"), but must NOT cascade-delete its
--     contributions — `goal_contributions.goal_id` uses ON DELETE SET NULL,
--     not CASCADE, and keeps a denormalised `goal_name_snapshot` (captured
--     at contribution time) so history still reads sensibly once the goal
--     row is gone.
--   - car_scenarios/house_scenarios link to a goal via `linked_goal_id` on
--     the scenario itself (scenario -> goal), not the other way around —
--     see migrations/0002 for why this superseded the Phase 1 placeholder
--     columns goals.linked_scenario_type/linked_scenario_id.
--   - spending_entries carries `source`/`external_transaction_id` from day
--     one even though Phase 2 only ever writes `source = 'manual'` — so a
--     later automated feed (Open Banking) can slot in without restructuring.

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  currency text not null check (currency in ('GBP', 'USD')),
  display_name text,
  -- flat % of PAYE gross only, per the brief's scope decision — see
  -- migrations/0004 and docs/mixed-income-tax.md.
  pension_contribution_percent numeric(5, 2) not null default 0
    check (pension_contribution_percent >= 0 and pension_contribution_percent <= 100),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by owner" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles are editable by owner" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles are insertable by owner" on public.profiles
  for insert with check (auth.uid() = id);

-- ============================================================
-- income_targets — one active annual gross target per user
-- ============================================================
create table if not exists public.income_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  annual_gross_amount numeric(12, 2) not null check (annual_gross_amount >= 0),
  tax_year text not null, -- e.g. '2025/26', matches src/lib/tax rate files
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists income_targets_user_id_idx on public.income_targets (user_id);

alter table public.income_targets enable row level security;

create policy "income targets are owner-only" on public.income_targets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- income_entries — individually logged pay entries
--
-- employment_type is per entry, not per account (brief's explicit scope
-- decision): a user can log some entries PAYE and others self-employed
-- within the same tax year. Annual PAYE/self-employed totals for tax
-- purposes are aggregated from these rows grouped by this column — see
-- docs/mixed-income-tax.md.
-- ============================================================
create table if not exists public.income_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  amount numeric(12, 2) not null check (amount > 0),
  entry_date date not null,
  employment_type text not null default 'paye' check (employment_type in ('paye', 'self_employed')),
  created_at timestamptz not null default now()
);

create index if not exists income_entries_user_id_date_idx on public.income_entries (user_id, entry_date desc);

alter table public.income_entries enable row level security;

create policy "income entries are owner-only" on public.income_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- goals
-- ============================================================
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  -- see design note above re: owner_type/owner_id
  owner_type text not null default 'user' check (owner_type in ('user')),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  deadline date not null,
  priority integer not null default 0, -- lower = higher priority; user-reorderable
  -- which of {25,50,75,100} have already triggered their one-time
  -- milestone celebration — see migrations/0003 for why this stays put
  -- even if a later correction drops the funded % back down.
  celebrated_milestones smallint[] not null default '{}',
  -- marks this goal as LISA-linked so its detail view shows the 25%
  -- government bonus alongside contributions — see docs/lisa-bonus.md.
  is_lisa boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_owner_id_idx on public.goals (owner_id);
create index if not exists goals_owner_id_priority_idx on public.goals (owner_id, priority);

alter table public.goals enable row level security;

create policy "goals are owner-only" on public.goals
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ============================================================
-- goal_contributions — manually logged funding entries
--
-- goal_id uses ON DELETE SET NULL (not CASCADE): deleting a goal must not
-- delete the money log. name_snapshot preserves what the goal was called
-- so history still reads sensibly once the goal record is gone.
-- ============================================================
create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid references public.goals (id) on delete set null,
  goal_name_snapshot text not null,
  amount numeric(12, 2) not null check (amount > 0),
  contributed_at date not null default current_date,
  note text, -- optional context, e.g. round-up provenance; null for ordinary contributions
  created_at timestamptz not null default now()
);

create index if not exists goal_contributions_user_id_idx on public.goal_contributions (user_id);
create index if not exists goal_contributions_goal_id_idx on public.goal_contributions (goal_id);

alter table public.goal_contributions enable row level security;

create policy "goal contributions are owner-only" on public.goal_contributions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- goal_nudges — log of "behind on goal" nudges already sent, so we don't
-- spam the same warning every time a cron job runs.
-- ============================================================
create table if not exists public.goal_nudges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  channel text not null check (channel in ('in_app', 'email')),
  sent_at timestamptz not null default now(),
  dismissed_at timestamptz
);

create index if not exists goal_nudges_user_id_goal_id_idx on public.goal_nudges (user_id, goal_id);

alter table public.goal_nudges enable row level security;

create policy "goal nudges are owner-only" on public.goal_nudges
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- car_scenarios
-- ============================================================
create table if not exists public.car_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,

  -- finance
  price numeric(12, 2) not null check (price >= 0),
  deposit numeric(12, 2) not null default 0 check (deposit >= 0),
  apr numeric(6, 3) not null default 0 check (apr >= 0), -- annual percentage rate, e.g. 8.9
  term_months integer not null check (term_months > 0),

  -- running costs
  insurance_annual numeric(12, 2) not null default 0 check (insurance_annual >= 0),
  road_tax_annual numeric(12, 2) not null default 0 check (road_tax_annual >= 0),
  fuel_maintenance_monthly numeric(12, 2) not null default 0 check (fuel_maintenance_monthly >= 0),
  mot_due_date date, -- reminder only, not part of the cost total — see docs/car-house-costs.md

  -- comparison input for the lease/finance/cash tool — "enter what you were
  -- quoted," not a calculated figure. See docs/car-house-costs.md.
  lease_monthly_quote numeric(12, 2) check (lease_monthly_quote is null or lease_monthly_quote >= 0),

  linked_goal_id uuid references public.goals (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists car_scenarios_user_id_idx on public.car_scenarios (user_id);

alter table public.car_scenarios enable row level security;

create policy "car scenarios are owner-only" on public.car_scenarios
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- house_scenarios
-- ============================================================
create table if not exists public.house_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  mode text not null check (mode in ('rent', 'mortgage')),

  -- rent mode (all monthly figures, per the brief)
  monthly_rent numeric(12, 2) check (monthly_rent >= 0),
  monthly_bills numeric(12, 2) check (monthly_bills >= 0),
  council_tax_monthly numeric(12, 2) check (council_tax_monthly >= 0),

  -- mortgage mode
  loan_amount numeric(12, 2) check (loan_amount >= 0),
  interest_rate_apr numeric(6, 3) check (interest_rate_apr >= 0),
  term_years integer check (term_years > 0),
  buildings_insurance_annual numeric(12, 2) check (buildings_insurance_annual >= 0),
  council_tax_annual numeric(12, 2) check (council_tax_annual >= 0),

  -- mortgage overpayment modelling — only meaningful in mortgage mode; see
  -- docs/car-house-costs.md. Month is 1-indexed from the mortgage start so
  -- "no lump sum" (null) and "lump sum in month 1" are unambiguous.
  overpayment_monthly numeric(12, 2) check (overpayment_monthly is null or overpayment_monthly >= 0),
  overpayment_lump_sum numeric(12, 2) check (overpayment_lump_sum is null or overpayment_lump_sum >= 0),
  overpayment_lump_sum_month integer check (overpayment_lump_sum_month is null or overpayment_lump_sum_month >= 1),

  linked_goal_id uuid references public.goals (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint house_scenario_mode_fields_present check (
    (mode = 'rent' and monthly_rent is not null)
    or (mode = 'mortgage' and loan_amount is not null and interest_rate_apr is not null and term_years is not null)
  )
);

create index if not exists house_scenarios_user_id_idx on public.house_scenarios (user_id);

alter table public.house_scenarios enable row level security;

create policy "house scenarios are owner-only" on public.house_scenarios
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- spending_categories — fully user-defined, no fixed list
-- ============================================================
create table if not exists public.spending_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists spending_categories_user_id_idx on public.spending_categories (user_id);

alter table public.spending_categories enable row level security;

create policy "spending categories are owner-only" on public.spending_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- spending_entries — manual now; shaped for an automated feed later
-- ============================================================
create table if not exists public.spending_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.spending_categories (id) on delete set null,
  category_name_snapshot text not null,
  label text not null,
  amount numeric(12, 2) not null check (amount > 0),
  entry_date date not null,
  source text not null default 'manual' check (source in ('manual')), -- widen when Open Banking lands
  external_transaction_id text, -- unused until an automated feed exists; for future dedup
  created_at timestamptz not null default now()
);

create index if not exists spending_entries_user_id_date_idx on public.spending_entries (user_id, entry_date desc);
create index if not exists spending_entries_category_id_idx on public.spending_entries (category_id);

alter table public.spending_entries enable row level security;

create policy "spending entries are owner-only" on public.spending_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- updated_at trigger helper
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger income_targets_set_updated_at
  before update on public.income_targets
  for each row execute function public.set_updated_at();

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

create trigger car_scenarios_set_updated_at
  before update on public.car_scenarios
  for each row execute function public.set_updated_at();

create trigger house_scenarios_set_updated_at
  before update on public.house_scenarios
  for each row execute function public.set_updated_at();
