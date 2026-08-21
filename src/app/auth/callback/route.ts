import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PENDING_CURRENCY_COOKIE } from "@/lib/auth/types";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";

/**
 * Lands here after: (a) Google OAuth redirects back with a `code`, or
 * (b) a user clicks the email confirmation link (Supabase appends `code`
 * there too when using the PKCE flow). Either way we exchange the code for
 * a session, then make sure a `profiles` row exists.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!existingProfile) {
    const cookieStore = await cookies();
    const pendingCurrency = cookieStore.get(PENDING_CURRENCY_COOKIE)?.value as CurrencyCode | undefined;
    cookieStore.delete(PENDING_CURRENCY_COOKIE);

    const currency = SUPPORTED_CURRENCIES.some((c) => c.code === pendingCurrency) ? pendingCurrency! : undefined;

    if (!currency) {
      // No currency on record (e.g. cookie expired) — ask before entering the app.
      return NextResponse.redirect(`${origin}/onboarding/currency`);
    }

    await supabase.from("profiles").insert({ id: data.user.id, currency });
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
