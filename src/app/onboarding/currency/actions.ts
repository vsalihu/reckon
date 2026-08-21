"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";
import type { AuthActionState } from "@/lib/auth/types";

export async function setOnboardingCurrency(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const currency = String(formData.get("currency") ?? "") as CurrencyCode;
  if (!SUPPORTED_CURRENCIES.some((c) => c.code === currency)) {
    return { error: "Please choose a currency." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { error } = await supabase.from("profiles").upsert({ id: user.id, currency });
  if (error) return { error: error.message };

  redirect("/dashboard");
}
