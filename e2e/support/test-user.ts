import "./env";
import { createClient } from "@supabase/supabase-js";
import type { CurrencyCode } from "@/lib/currency";

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const TEST_PASSWORD = "TestPassword123!";

/**
 * Creates a pre-confirmed user + profile directly via the admin API,
 * bypassing the email confirmation step so e2e specs can sign in through
 * the real UI without needing to click a real email link.
 */
export async function createConfirmedTestUser(currency: CurrencyCode = "GBP") {
  const admin = adminClient();
  const email = `viktor.salihu2017+e2e${Date.now()}${Math.random().toString(36).slice(2, 6)}@gmail.com`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("Failed to create test user");

  await admin.from("profiles").insert({ id: data.user.id, currency });

  return { id: data.user.id, email };
}

export async function deleteTestUser(userId: string) {
  const admin = adminClient();
  await admin.auth.admin.deleteUser(userId);
}
