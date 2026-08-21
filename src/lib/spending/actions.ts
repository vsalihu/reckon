"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/shared/action-state";

/** Categories are fully user-defined — created inline the first time someone types a new one. */
export async function createSpendingCategory(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give the category a name." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { error } = await supabase.from("spending_categories").insert({ user_id: user.id, name });
  if (error) {
    if (error.code === "23505") return { error: "You already have a category with that name." };
    return { error: error.message };
  }

  revalidatePath("/spending");
  return {};
}

export async function deleteSpendingCategory(categoryId: string): Promise<void> {
  const supabase = await createClient();
  // Entries survive — category_id is ON DELETE SET NULL, category_name_snapshot preserves the label.
  await supabase.from("spending_categories").delete().eq("id", categoryId);
  revalidatePath("/spending");
}

export async function logSpendingEntry(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const label = String(formData.get("label") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const entryDate = String(formData.get("entry_date") ?? "");
  const categoryId = String(formData.get("category_id") ?? "") || null;

  if (!label) return { error: "Give this a label." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };
  if (!entryDate) return { error: "Pick a date." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  let categoryName = "Uncategorized";
  if (categoryId) {
    const { data: category } = await supabase
      .from("spending_categories")
      .select("name")
      .eq("id", categoryId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (category) categoryName = category.name;
  }

  const { error } = await supabase.from("spending_entries").insert({
    user_id: user.id,
    category_id: categoryId,
    category_name_snapshot: categoryName,
    label,
    amount,
    entry_date: entryDate,
    source: "manual",
  });

  if (error) return { error: error.message };

  revalidatePath("/spending");
  revalidatePath("/overview");
  return {};
}

export async function deleteSpendingEntry(entryId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("spending_entries").delete().eq("id", entryId);
  revalidatePath("/spending");
  revalidatePath("/overview");
}
