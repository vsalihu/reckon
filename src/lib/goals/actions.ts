"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/lib/auth/types";

export async function createGoal(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const targetAmount = Number(formData.get("target_amount"));
  const deadline = String(formData.get("deadline") ?? "");

  if (!name) return { error: "Give your goal a name." };
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) return { error: "Enter a valid target amount." };
  if (!deadline) return { error: "Pick a deadline." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { data: maxPriorityRow } = await supabase
    .from("goals")
    .select("priority")
    .eq("owner_id", user.id)
    .order("priority", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPriority = (maxPriorityRow?.priority ?? -1) + 1;

  const { error } = await supabase.from("goals").insert({
    owner_id: user.id,
    name,
    target_amount: targetAmount,
    deadline,
    priority: nextPriority,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return {};
}

/**
 * Real DELETE of the goal row (per the brief). Contributions survive —
 * goal_contributions.goal_id is ON DELETE SET NULL, and each contribution
 * keeps a goal_name_snapshot captured at the time it was logged.
 */
export async function deleteGoal(goalId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("goals").delete().eq("id", goalId);
  revalidatePath("/dashboard");
}

/** Persists a new priority order after drag-and-reorder. `orderedIds` is the full list, highest priority first. */
export async function reorderGoals(orderedIds: string[]): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("goals").update({ priority: index }).eq("id", id).eq("owner_id", user.id),
    ),
  );

  revalidatePath("/dashboard");
}

export async function logContribution(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const goalId = String(formData.get("goal_id") ?? "");
  const amount = Number(formData.get("amount"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("name")
    .eq("id", goalId)
    .eq("owner_id", user.id)
    .single();

  if (goalError || !goal) return { error: "Couldn't find that goal." };

  const { error } = await supabase.from("goal_contributions").insert({
    user_id: user.id,
    goal_id: goalId,
    goal_name_snapshot: goal.name,
    amount,
    note,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/spending");
  revalidatePath("/overview");
  return {};
}

/**
 * Persists which milestones (25/50/75/100) have already triggered their
 * one-time celebration, so the toast never re-fires for the same
 * threshold — see src/lib/goals/milestones.ts and migrations/0003.
 * Read-then-write (not an atomic array append): acceptable here since a
 * single user only ever crosses their own goal's milestones from their
 * own session, no meaningful concurrent-write risk.
 */
export async function markMilestonesCelebrated(goalId: string, newlyCrossed: number[]): Promise<void> {
  if (newlyCrossed.length === 0) return;

  const supabase = await createClient();
  const { data: goal } = await supabase.from("goals").select("celebrated_milestones").eq("id", goalId).maybeSingle();
  if (!goal) return;

  const merged = Array.from(new Set([...(goal.celebrated_milestones ?? []), ...newlyCrossed]));
  await supabase.from("goals").update({ celebrated_milestones: merged }).eq("id", goalId);
  revalidatePath("/dashboard");
}
