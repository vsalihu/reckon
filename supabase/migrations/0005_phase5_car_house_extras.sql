-- Phase 5 (Car & house extras): lease vs finance vs cash comparison,
-- mortgage overpayment modelling, and LISA-linked goals. All additive
-- columns on existing tables — no new tables. Stamp duty is a stateless
-- calculator (nation + price + FTB/additional-property flags in, a
-- figure out) and needs no schema at all.
--
-- Design notes:
--   - car_scenarios.lease_monthly_quote is nullable and purely a
--     comparison input — leasing math varies too much by provider to
--     model from first principles (per the brief), so this is "enter
--     what you were quoted," not a calculated figure. Cash and finance
--     paths are derived from columns car_scenarios already has.
--   - house_scenarios overpayment columns are nullable and only
--     meaningful in mortgage mode; rent-mode scenarios simply never set
--     them. `overpayment_lump_sum_month` is 1-indexed from the mortgage
--     start (month 1 = first payment) so "no lump sum" and "lump sum in
--     month 1" are both unambiguously representable (null vs 1).
--   - goals.is_lisa marks a goal as LISA-linked so the goal detail view
--     can show contributions plus the 25% government bonus that would
--     apply, subject to the current annual limits — see
--     docs/lisa-bonus.md. A boolean flag, not a new table: a LISA-linked
--     goal is still just a goal: same contributions table, same
--     targets/deadlines, one extra fact about it.

alter table public.car_scenarios
  add column if not exists lease_monthly_quote numeric(12, 2) check (lease_monthly_quote is null or lease_monthly_quote >= 0);

alter table public.house_scenarios
  add column if not exists overpayment_monthly numeric(12, 2) check (overpayment_monthly is null or overpayment_monthly >= 0),
  add column if not exists overpayment_lump_sum numeric(12, 2) check (overpayment_lump_sum is null or overpayment_lump_sum >= 0),
  add column if not exists overpayment_lump_sum_month integer check (overpayment_lump_sum_month is null or overpayment_lump_sum_month >= 1);

alter table public.goals
  add column if not exists is_lisa boolean not null default false;
