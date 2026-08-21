import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components, Server Actions, and Route
 * Handlers. Reads/writes the auth session via Next.js cookies.
 *
 * The `set` call inside a Server Component (not a Server Action/Route
 * Handler) will throw — that's expected and safely ignored, because
 * middleware refreshes the session on every request instead.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component — safe to ignore, middleware handles refresh.
          }
        },
      },
    },
  );
}
