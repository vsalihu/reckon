"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/shared/action-state";

function parsePositiveNumber(formData: FormData, key: string, { allowZero = true } = {}): number | null {
  const value = Number(formData.get(key));
  if (!Number.isFinite(value)) return null;
  if (allowZero ? value < 0 : value <= 0) return null;
  return value;
}

export async function createCarScenario(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const price = parsePositiveNumber(formData, "price", { allowZero: false });
  const deposit = parsePositiveNumber(formData, "deposit");
  const apr = parsePositiveNumber(formData, "apr");
  const termMonths = Number(formData.get("term_months"));
  const insuranceAnnual = parsePositiveNumber(formData, "insurance_annual");
  const roadTaxAnnual = parsePositiveNumber(formData, "road_tax_annual");
  const fuelMaintenanceMonthly = parsePositiveNumber(formData, "fuel_maintenance_monthly");
  const motDueDate = String(formData.get("mot_due_date") ?? "") || null;
  const leaseMonthlyQuoteRaw = String(formData.get("lease_monthly_quote") ?? "").trim();
  const leaseMonthlyQuote = leaseMonthlyQuoteRaw ? parsePositiveNumber(formData, "lease_monthly_quote") : null;

  if (!name) return { error: "Give this scenario a name." };
  if (price === null) return { error: "Enter a valid price." };
  if (deposit === null) return { error: "Enter a valid deposit (0 or more)." };
  if (deposit > price) return { error: "Deposit can't be more than the price." };
  if (apr === null) return { error: "Enter a valid APR." };
  if (!Number.isInteger(termMonths) || termMonths <= 0) return { error: "Enter a valid term in months." };
  if (insuranceAnnual === null) return { error: "Enter a valid annual insurance cost." };
  if (roadTaxAnnual === null) return { error: "Enter a valid annual road tax." };
  if (fuelMaintenanceMonthly === null) return { error: "Enter a valid monthly fuel/maintenance cost." };
  if (leaseMonthlyQuoteRaw && leaseMonthlyQuote === null) return { error: "Enter a valid lease quote, or leave it blank." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { error } = await supabase.from("car_scenarios").insert({
    user_id: user.id,
    name,
    price,
    deposit,
    apr,
    term_months: termMonths,
    insurance_annual: insuranceAnnual,
    road_tax_annual: roadTaxAnnual,
    fuel_maintenance_monthly: fuelMaintenanceMonthly,
    mot_due_date: motDueDate,
    lease_monthly_quote: leaseMonthlyQuote,
  });

  if (error) return { error: error.message };

  revalidatePath("/calculators/car");
  return {};
}

export async function deleteCarScenario(scenarioId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("car_scenarios").delete().eq("id", scenarioId);
  revalidatePath("/calculators/car");
}

export async function linkCarScenarioToGoal(scenarioId: string, goalId: string | null): Promise<void> {
  const supabase = await createClient();
  await supabase.from("car_scenarios").update({ linked_goal_id: goalId }).eq("id", scenarioId);
  revalidatePath("/calculators/car");
}

/** Creates a new goal from a scenario (target = deposit, or price if no deposit) and links it. */
export async function createGoalFromCarScenario(scenarioId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { data: scenario, error: scenarioError } = await supabase
    .from("car_scenarios")
    .select("name, price, deposit")
    .eq("id", scenarioId)
    .eq("user_id", user.id)
    .single();
  if (scenarioError || !scenario) return { error: "Couldn't find that scenario." };

  const targetAmount = Number(scenario.deposit) > 0 ? Number(scenario.deposit) : Number(scenario.price);
  const deadline = new Date();
  deadline.setFullYear(deadline.getFullYear() + 1);

  const { data: maxPriorityRow } = await supabase
    .from("goals")
    .select("priority")
    .eq("owner_id", user.id)
    .order("priority", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .insert({
      owner_id: user.id,
      name: `${scenario.name} deposit`,
      target_amount: targetAmount,
      deadline: deadline.toISOString().slice(0, 10),
      priority: (maxPriorityRow?.priority ?? -1) + 1,
    })
    .select("id")
    .single();
  if (goalError || !goal) return { error: goalError?.message ?? "Couldn't create the goal." };

  await supabase.from("car_scenarios").update({ linked_goal_id: goal.id }).eq("id", scenarioId);

  revalidatePath("/calculators/car");
  revalidatePath("/dashboard");
  return {};
}
