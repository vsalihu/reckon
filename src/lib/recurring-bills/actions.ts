"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/shared/action-state";
import { calculateNextDueDate, type BillFrequency } from "./calculate";

export async function createRecurringBill(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const frequency = String(formData.get("frequency") ?? "");
  const nextDueDate = String(formData.get("next_due_date") ?? "");

  if (!name) return { error: "Give this bill a name." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };
  if (frequency !== "weekly" && frequency !== "monthly" && frequency !== "annually") {
    return { error: "Choose a frequency." };
  }
  if (!nextDueDate) return { error: "Pick the next due date." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { error } = await supabase.from("recurring_bills").insert({
    user_id: user.id,
    name,
    amount,
    frequency,
    next_due_date: nextDueDate,
  });
  if (error) return { error: error.message };

  revalidatePath("/spending");
  return {};
}

export async function deleteRecurringBill(billId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("recurring_bills").delete().eq("id", billId);
  revalidatePath("/spending");
}

/**
 * Logs today's payment as a spending entry and advances the bill's due
 * date by one period — see docs/recurring-bills.md for why this is a
 * single explicit action rather than an automatic nudge.
 */
export async function markBillPaid(billId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: bill } = await supabase
    .from("recurring_bills")
    .select("name, amount, frequency, next_due_date")
    .eq("id", billId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!bill) return;

  const today = new Date().toISOString().slice(0, 10);

  await supabase.from("spending_entries").insert({
    user_id: user.id,
    category_id: null,
    category_name_snapshot: "Uncategorized",
    label: bill.name,
    amount: bill.amount,
    entry_date: today,
    source: "manual",
  });

  const nextDueDate = calculateNextDueDate(new Date(bill.next_due_date), bill.frequency as BillFrequency);
  await supabase
    .from("recurring_bills")
    .update({ next_due_date: nextDueDate.toISOString().slice(0, 10) })
    .eq("id", billId)
    .eq("user_id", user.id);

  revalidatePath("/spending");
  revalidatePath("/overview");
}
