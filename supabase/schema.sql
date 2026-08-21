-- Reckon database schema — Phase 1
--
-- Run against a fresh Supabase project via the SQL Editor, or via the
-- Supabase CLI (`supabase db push`) once migrations are set up.
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
--   - Phase 2+ tables (car/house scenarios, spending categories) are not
--     created here — this file only leaves room for them via
--     `goals.linked_scenario_type` / `linked_scenario_id`, nullable and
--     unused until that phase.

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  currency text not null check (currency in ('GBP', 'USD')),
  display_name text,
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
-- ============================================================
create table if not exists public.income_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  amount numeric(12, 2) not null check (amount > 0),
  entry_date date not null,
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
  -- Phase 2+: link this goal to a car/house cost scenario. Unused in Phase 1.
  linked_scenario_type text check (linked_scenario_type in ('car', 'house')),
  linked_scenario_id uuid,
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
