import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/submit-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("currency").eq("id", user.id).maybeSingle();

  if (!profile) redirect("/onboarding/currency");

  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === profile.currency);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-display text-2xl text-foreground">Reckon</p>
          <p className="text-sm text-foreground-muted">{user.email}</p>
        </div>
        <ThemeToggle />
      </header>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-foreground-muted">Tracking in</p>
        <p className="font-numeric text-xl text-foreground">
          {currency ? `${currency.symbol} ${currency.label} (${currency.code})` : profile.currency}
        </p>
      </div>

      <p className="text-sm text-foreground-muted">
        Income logging and savings goals land here next — auth and your profile are wired up and working.
      </p>

      <form action={signOut} className="mt-auto">
        <SubmitButton className="bg-transparent border border-border text-foreground hover:opacity-100 hover:border-negative hover:text-negative">
          Sign out
        </SubmitButton>
      </form>
    </div>
  );
}
