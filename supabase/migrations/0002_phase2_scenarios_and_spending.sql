-- Phase 2: car/house cost scenarios and spending tracking.
--
-- Design notes:
--   - Goal linking lives on the scenario side (car_scenarios.linked_goal_id /
--     house_scenarios.linked_goal_id), not on goals. The brief frames it as
--     "each scenario can optionally link to a savings goal" — a one-way
--     pointer from scenario to goal is the natural shape, and avoids a
--     polymorphic FK on goals (which type of scenario would it even point
--     to?). This supersedes goals.linked_scenario_type/linked_scenario_id
--     from the Phase 1 schema, which are dropped below — nothing used them
--     yet, so no data migration is needed.
--   - linked_goal_id uses ON DELETE SET NULL, consistent with the rest of
--     the schema's "deleting one thing shouldn't destroy history in
--     another table" pattern: deleting a goal just unlinks the scenario.
--   - MOT is modelled as a reminder date (mot_due_date), not a cost line —
--     see docs/car-house-costs.md for why it's excluded from the monthly
--     total.
--   - spending_categories/spending_entries follow the same manual-entry,
--     user-owned, RLS-everywhere pattern as income_entries. Two columns
--     are added specifically so an automated feed (Open Banking, a later
--     phase) can slot in without restructuring: `source` (manual vs a
--     future feed value) and `external_transaction_id` (nullable, for
--     dedup against a provider's transaction ID) — both unused by Phase 2
--     itself, which only ever writes source = 'manual'.

-- ============================================================
-- drop Phase 1's placeholder scenario-link columns on goals
-- ============================================================
alter table public.goals drop column if exists linked_scenario_type;
alter table public.goals drop column if exists linked_scenario_id;

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
  mot_due_date date, -- reminder only, not part of the cost total — see note above

  linked_goal_id uuid references public.goals (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists car_scenarios_user_id_idx on public.car_scenarios (user_id);

alter table public.car_scenarios enable row level security;

create policy "car scenarios are owner-only" on public.car_scenarios
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger car_scenarios_set_updated_at
  before update on public.car_scenarios
  for each row execute function public.set_updated_at();

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

create trigger house_scenarios_set_updated_at
  before update on public.house_scenarios
  for each row execute function public.set_updated_at();

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
