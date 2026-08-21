"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { CurrencyCode } from "@/lib/currency";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { PENDING_CURRENCY_COOKIE, type AuthActionState } from "@/lib/auth/types";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Email/password signup. Also creates the `profiles` row with the chosen
 * currency in the same step — currency is fixed at signup per the brief.
 */
export async function signUpWithEmail(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const currency = String(formData.get("currency") ?? "") as CurrencyCode;

  if (!SUPPORTED_CURRENCIES.some((c) => c.code === currency)) {
    return { error: "Please choose a currency." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Something went wrong creating your account. Please try again." };

  // If email confirmation is required, there's no session yet — stash the
  // chosen currency in the same cookie the Google flow uses, so it survives
  // until the user clicks the confirmation link and lands in the callback
  // route (see src/app/auth/callback/route.ts), which creates the profile.
  if (data.session) {
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: data.user.id, currency });
    if (profileError) return { error: profileError.message };
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  cookieStore.set(PENDING_CURRENCY_COOKIE, currency, { maxAge: 86_400, httpOnly: true, sameSite: "lax" });

  redirect("/sign-up/check-email");
}

export async function signInWithEmail(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };
  redirect("/dashboard");
}

/**
 * Kicks off the Google OAuth flow. Requires Google configured as a Supabase
 * Auth provider. `currency` is only meaningful for new accounts — existing
 * users just sign in as normal — but we don't know which case this is
 * until the callback runs, so it's always stashed.
 */
export async function signInWithGoogle(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const currency = String(formData.get("currency") ?? "") as CurrencyCode;
  if (!SUPPORTED_CURRENCIES.some((c) => c.code === currency)) {
    return { error: "Please choose a currency." };
  }

  const cookieStore = await cookies();
  cookieStore.set(PENDING_CURRENCY_COOKIE, currency, { maxAge: 600, httpOnly: true, sameSite: "lax" });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${siteUrl()}/auth/callback` },
  });

  if (error || !data.url) return { error: error?.message ?? "Could not start Google sign-in." };
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
