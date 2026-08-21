import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { CategoryForm } from "@/components/spending/category-form";
import { CategoryList } from "@/components/spending/category-list";
import { SpendingEntryForm } from "@/components/spending/entry-form";
import { SpendingEntryList } from "@/components/spending/entry-list";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";

export default async function SpendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("currency").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/onboarding/currency");

  const currency = (SUPPORTED_CURRENCIES.find((c) => c.code === profile.currency)?.code ?? profile.currency) as CurrencyCode;

  const [{ data: categories }, { data: entries }, { data: goals }] = await Promise.all([
    supabase.from("spending_categories").select("id, name").eq("user_id", user.id).order("name", { ascending: true }),
    supabase
      .from("spending_entries")
      .select("id, label, amount, entry_date, category_name_snapshot")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false }),
    supabase.from("goals").select("id, name").eq("owner_id", user.id).order("priority", { ascending: true }),
  ]);

  const entriesWithAmount = (entries ?? []).map((e) => ({ ...e, amount: Number(e.amount) }));
  const total = entriesWithAmount.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <AppHeader email={user.email} />

      <div>
        <h1 className="mb-1 font-display text-2xl text-foreground">Spending</h1>
        <p className="text-sm text-foreground-muted">Categories are entirely up to you — create whatever fits.</p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-display text-lg text-foreground">Categories</h2>
        <CategoryList categories={categories ?? []} />
        <div className="mt-4">
          <CategoryForm />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-display text-lg text-foreground">Log spending</h2>
        <SpendingEntryForm categories={categories ?? []} />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-lg text-foreground">Entries</h2>
          <span className="font-numeric text-sm text-foreground-muted">
            {new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(total)} total
          </span>
        </div>
        <SpendingEntryList entries={entriesWithAmount} goals={goals ?? []} currency={currency} />
      </section>
    </div>
  );
}
