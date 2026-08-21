"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CURRENT_UK_TAX_YEAR } from "@/lib/tax";
import type { AuthActionState } from "@/lib/auth/types";

/**
 * Sets (or replaces) the user's annual gross income target for the current
 * tax year. Phase 1 keeps one active target per user — upsert on user_id
 * would need a unique constraint we don't have, so this deletes any
 * existing target(s) for the current tax year first, then inserts fresh.
 */
export async function setIncomeTarget(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const amount = Number(formData.get("annual_gross_amount"));
  if (!Number.isFinite(amount) || amount < 0) {
    return { error: "Enter a valid annual amount." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  await supabase
    .from("income_targets")
    .delete()
    .eq("user_id", user.id)
    .eq("tax_year", CURRENT_UK_TAX_YEAR.taxYear);

  const { error } = await supabase.from("income_targets").insert({
    user_id: user.id,
    annual_gross_amount: amount,
    tax_year: CURRENT_UK_TAX_YEAR.taxYear,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return {};
}

export async function logIncomeEntry(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const label = String(formData.get("label") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const entryDate = String(formData.get("entry_date") ?? "");

  if (!label) return { error: "Give this pay entry a label." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };
  if (!entryDate) return { error: "Pick a date." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { error } = await supabase.from("income_entries").insert({
    user_id: user.id,
    label,
    amount,
    entry_date: entryDate,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return {};
}

export async function deleteIncomeEntry(entryId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("income_entries").delete().eq("id", entryId);
  revalidatePath("/dashboard");
}
