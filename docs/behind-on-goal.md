# "Behind on goal" formula

Status: Phase 1 default. Revisit once real usage data exists.

## The problem with deadline-only pacing

The naive check — "have they saved `elapsed_time / total_time` of the
target?" — ignores that saving capacity isn't constant. Someone who just
started a higher-paying job, or is between pay cheques, will look "behind"
under naive pacing even though they're saving a perfectly reasonable share
of what they're actually earning. The brief asks for the comparison to be
relative to income earned in the same period, not just wall-clock time.

## Definitions

For a goal `g` with `target_amount`, `deadline`, and `created_at`:

- **Required rate** — the constant share of income the user would need to
  divert to this goal to hit it on time, estimated once at goal creation
  and re-derived if the deadline or target changes:

  ```
  required_rate = remaining_amount / income_expected_before_deadline
  ```

  where `remaining_amount = target_amount - total_contributed_so_far`, and
  `income_expected_before_deadline` is the user's `annual_gross_amount`
  (from `income_targets`) pro-rated for the time left until `deadline`.

- **Actual rate**, measured over a trailing window (default: the last 90
  days, or since goal creation if younger than that):

  ```
  actual_rate = contributions_to_goal_in_window / income_logged_in_window
  ```

  - `contributions_to_goal_in_window` — sum of `goal_contributions.amount`
    for this goal, `contributed_at` within the window.
  - `income_logged_in_window` — sum of `income_entries.amount`,
    `entry_date` within the same window, for the same user (not
    goal-specific — income isn't earmarked to a goal until contributed).

- **Behind** when:

  ```
  actual_rate < required_rate * BEHIND_THRESHOLD
  ```

  `BEHIND_THRESHOLD = 0.9` by default (10% tolerance) — avoids flip-flopping
  the nudge on/off from noise around exact equality.

## Edge cases

- **No income logged in the window** → `actual_rate` is undefined (0/0).
  Treat as "not enough data yet", not "behind" — don't nudge. Needs at
  least one income entry and one window with income > 0 before this check
  activates.
- **Goal has no contributions yet and is brand new** (< 7 days old) →
  suppress the nudge; give the user a week before judging pace.
- **Deadline already passed** → this is a distinct "overdue" state, handled
  separately from "behind on pace" (overdue goals get a different message,
  not a pace percentage).
- **`required_rate` computed as negative or zero** (target already met, or
  `remaining_amount <= 0`) → goal is funded; never behind.

## Where this lives in code

Implementation: `src/lib/goals/behind-on-goal.ts` (pure function, unit
tested against the edge cases above — no DB access in the function itself,
callers pass in the aggregated numbers).

## Nudging

When a goal is `behind`:

- **In-app**: a banner is shown on the goal card/detail view. Re-computed
  live on page load — no need to persist "is behind" as state.
- **Email**: sent at most once per rolling 7-day period per goal to avoid
  spam, tracked via `goal_nudges` (channel = 'email'). A scheduled job
  (Supabase cron / Edge Function, see README) evaluates all users' goals
  daily and inserts a `goal_nudges` row + sends the email when a goal is
  newly behind and no email nudge exists for that goal in the last 7 days.
