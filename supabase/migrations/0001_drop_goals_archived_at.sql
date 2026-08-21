-- Removes goals.archived_at — Phase 1 goal deletion is a real DELETE of
-- the goals row (per the brief), not a soft-archive. See schema.sql for
-- the current full schema; this file documents the change that was
-- applied on top of the initial supabase/schema.sql run.
alter table public.goals drop column if exists archived_at;
