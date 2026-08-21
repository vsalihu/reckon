# LISA bonus tracker

Status: Phase 5. Implementation: `src/lib/lisa/`.

## Rules modelled (verified against gov.uk, August 2026)

- **25% government bonus** on Lifetime ISA contributions.
- **£4,000 annual contribution limit** that the bonus applies to (this
  also counts toward the wider £20,000 overall ISA allowance, which this
  app doesn't otherwise track).
- **£1,000 annual bonus cap** — a direct consequence of the two figures
  above (£4,000 × 25%), stated explicitly in the rates file since it's
  the number people actually look for.
- **£450,000 property price limit** for a penalty-free first-home
  withdrawal — frozen since the scheme launched in April 2017, unchanged
  despite house price inflation since.
- **12-month minimum account age** before a first-home withdrawal is
  penalty-free.

The Autumn Budget 2025 confirmed a consultation (early 2026) on
replacing the LISA with a new first-time-buyer savings product, expected
from April 2028. These figures reflect the scheme as it exists today —
revisit if that consultation lands changes.

## Why bonus calculation is per tax year, not per goal lifetime

The £4,000 limit and £1,000 bonus cap are **annual** — they reset every
6 April. A LISA-linked goal typically accumulates contributions over
several years (saving for a house deposit isn't a one-tax-year project),
so `calculateLisaBonus()` groups a goal's contributions by UK tax year
first, applies the cap within each year independently, then sums
bonuses across years:

```
for each tax year with contributions:
  eligible_for_bonus = min(contributed_that_year, £4,000)
  bonus_that_year     = eligible_for_bonus × 25%

total_contributed = sum of all contributions, all time
total_bonus       = sum of bonus_that_year across every tax year
total_available   = total_contributed + total_bonus
```

Contributions within a tax year beyond the £4,000 limit still count as
real money saved (`total_contributed` includes them) — they just don't
earn further bonus that year. `exceededAnnualLimit` on each year's
breakdown flags this so the UI can say so, rather than silently
under-crediting a user's own savings.

## Tax year boundary

UK tax years run 6 April to 5 April. `ukTaxYearLabelFor()` is a small
standalone helper (not tied to the Income Tax rate-year config, which is
a fixed "current year" setting) — it labels *any* date, since LISA
contributions can span years the app's "current tax year" setting has
long since moved past.

## Goal linking

A goal marked `is_lisa = true` (see `supabase/migrations/0005_...sql`)
shows its contributions plus the bonus that would apply, using the exact
same `goal_contributions` rows every other goal feature reads — no
separate LISA ledger, no new table. The "total available toward the
house" figure the brief asks for is `totalAvailable` above: what's
actually been saved plus every bonus actually earned, not just the raw
contribution total.

## Scope

This doesn't model: the wider £20,000 ISA allowance interacting with
other ISA types, the 25% withdrawal penalty for non-qualifying
withdrawals (which claws back more than just the bonus — see the LISA
guide's own explanation of why an early withdrawal costs 6.25% of a
saver's own money, not just the bonus), or eligibility rules (UK
resident, aged 18–39 to open). It assumes every contribution logged to a
LISA-linked goal genuinely is a LISA deposit made within the rules.
