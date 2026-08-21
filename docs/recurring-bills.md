# Recurring bill tracker

Status: Phase 6. Implementation: `src/lib/recurring-bills/`.

## What this is (and isn't)

A recurring bill is a record of an **expected** future cost — rent, a
subscription, insurance — not a log of payments that happened. That's
the opposite of `spending_entries`, which only ever records what
actually happened. Keeping them as separate tables (rather than, say, a
"recurring" flag on spending entries) reflects that they answer
different questions: spending entries answer "what did I spend", bills
answer "what am I on the hook for".

No auto-charging, no bank integration, no scheduled job creating
anything on a bill's due date — entirely manual, consistent with the
rest of the app.

## Monthly-equivalent normalization

Bills can be weekly, monthly, or annual. The one number that's actually
useful for "how much of my income is already spoken for" is a monthly
total, so every bill is normalized to its monthly-equivalent cost before
summing:

```
weekly:   amount × (52 / 12)
monthly:  amount
annually: amount / 12
```

`calculateTotalMonthlyCommitment()` sums these across every bill a user
has.

## Upcoming bills

`getUpcomingBills()` filters to bills due within N days (the UI uses
7 and 30, per the brief) and sorts soonest-first. A bill whose due date
has already passed is still included — it didn't stop being relevant
just because the date slipped by; if anything it needs *more*
attention, not less. This app has no notion of "this bill was paid" on
its own (see below), so an overdue bill just sits there until the user
marks it paid and its due date advances.

## Decision: no automatic nudge when a bill becomes due

The brief explicitly left this as a judgment call. Decision: **no**
automatic reminder or notification — not because it wouldn't be useful,
but because it would need the same notification infrastructure the
Phase 1 goal-nudge system uses (a scheduled job, an email sender, a
"don't repeat this notification" record), and building that
infrastructure a second time for a different feature isn't a good use
of this phase relative to the two things actually asked for. It's a
reasonable v2 addition once there's a second consumer to justify
generalizing the nudge system rather than duplicating it.

What *is* built: a one-click **"Mark as paid"** action on each bill.
Clicking it does two things in one step:

1. Creates an ordinary `spending_entries` row (today's date, the bill's
   name as the label, the bill's amount) — so a paid bill shows up in
   the normal spending list and count toward the 50/30/20 check above
   if its category is tagged.
2. Advances the bill's `next_due_date` by one period
   (`calculateNextDueDate()`), so it correctly reappears in "upcoming"
   next time around.

This is explicit and user-triggered, not automatic — it fits the app's
existing manual-entry philosophy while still saving the user from typing
the same rent payment into the spending log by hand every month.

There is deliberately **no structural link** (foreign key) from the
created spending entry back to the bill — same pattern as goal
contributions not being tied to the spending entry a round-up came from
beyond a text note. Keeps the tables independent and avoids a lineage
that would need maintaining if either side is edited or deleted later.
