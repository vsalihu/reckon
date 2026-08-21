-- Phase 3 (Goals & motivation): streaks, milestone celebrations, "what if"
-- slider, and manual round-ups — all extensions of the existing goals
-- system. No new tables; two small additive columns.
--
-- Design notes:
--   - Streaks and the "what if" projection are computed on the fly from
--     goals + goal_contributions (already have everything needed: target,
--     deadline, created_at, contribution amounts/dates) — no schema change.
--   - `goals.celebrated_milestones` records which of {25,50,75,100} have
--     already triggered their one-time celebration, so it never re-fires —
--     including the edge case where a contribution is later corrected or
--     deleted and the funded percentage dips below a threshold and crosses
--     it again. Once a threshold is in this array it stays there.
--   - `goal_contributions.note` is nullable and optional context for a
--     contribution — currently only written by the round-up flow (e.g.
--     "Round-up from 'Weekly shop' (£4.60 → £5.00)"), left null for
--     ordinary quick-add/custom contributions.

alter table public.goals
  add column if not exists celebrated_milestones smallint[] not null default '{}';

alter table public.goal_contributions
  add column if not exists note text;
