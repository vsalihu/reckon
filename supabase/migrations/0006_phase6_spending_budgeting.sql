-- Phase 6 (Spending & budgeting): 50/30/20 rule check and a recurring
-- bill tracker.
--
-- Design notes:
--   - spending_categories.budget_group is a nullable tag ('needs',
--     'wants', or 'savings') the user applies to their own categories —
--     since categories are fully user-defined (Phase 2), the app can't
--     auto-classify one as a "need" vs a "want". Nullable, not required:
--     an untagged category is simply excluded from the 50/30/20 split
--     rather than forced into a bucket. See docs/budget-rule.md.
--   - recurring_bills is a genuinely new table, unlike most Phase 2-5
--     additions — a recurring bill isn't an extension of goals,
--     scenarios, or spending entries, it's a distinct concept (an
--     *expected future* cost, not a thing that happened). Same
--     ownership/RLS pattern as every other table.
--   - No FK from recurring_bills to spending_entries: "marking a bill
--     paid" creates an ordinary spending_entries row (see
--     docs/recurring-bills.md for why this stays a manual, explicit
--     action rather than an automatic nudge/notification) with no
--     structural link back to the bill — consistent with the rest of
--     the app not cross-referencing manual entries into a rigid lineage.

alter table public.spending_categories
  add column if not exists budget_group text check (budget_group is null or budget_group in ('needs', 'wants', 'savings'));

create table if not exists public.recurring_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  frequency text not null check (frequency in ('weekly', 'monthly', 'annually')),
  next_due_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recurring_bills_user_id_idx on public.recurring_bills (user_id);
create index if not exists recurring_bills_user_id_due_idx on public.recurring_bills (user_id, next_due_date);

alter table public.recurring_bills enable row level security;

create policy "recurring bills are owner-only" on public.recurring_bills
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger recurring_bills_set_updated_at
  before update on public.recurring_bills
  for each row execute function public.set_updated_at();
