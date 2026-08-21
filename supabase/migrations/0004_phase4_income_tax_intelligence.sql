-- Phase 4 (Income & tax intelligence): mixed PAYE/self-employed tax,
-- pension modelling. Two additive columns — no new tables.
--
-- Design notes:
--   - Employment type is per income entry, not per account (per the
--     brief's explicit scope decision): a user can log some entries as
--     PAYE and others as self-employed within the same tax year. Annual
--     PAYE/self-employed totals for tax purposes are aggregated from
--     `income_entries` grouped by this column, not from the single
--     manually-set `income_targets.annual_gross_amount` (which stays as
--     the progress-tracking goal, unaffected by employment type).
--   - `profiles.pension_contribution_percent` is a simple flat percentage
--     applied to PAYE gross only, per the brief's scope decision — not
--     full employer-match/annual-allowance/salary-sacrifice modelling.
--     Defaults to 0 (no behaviour change for existing users until they
--     opt in).

alter table public.income_entries
  add column if not exists employment_type text not null default 'paye'
    check (employment_type in ('paye', 'self_employed'));

alter table public.profiles
  add column if not exists pension_contribution_percent numeric(5, 2) not null default 0
    check (pension_contribution_percent >= 0 and pension_contribution_percent <= 100);
