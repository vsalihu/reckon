"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/shared/action-state";

function parseNonNegativeNumber(formData: FormData, key: string): number | null {
  const value = Number(formData.get(key));
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

export async function createHouseScenario(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const mode = String(formData.get("mode") ?? "");

  if (!name) return { error: "Give this scenario a name." };
  if (mode !== "rent" && mode !== "mortgage") return { error: "Choose rent or mortgage." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  if (mode === "rent") {
    const monthlyRent = parseNonNegativeNumber(formData, "monthly_rent");
    const monthlyBills = parseNonNegativeNumber(formData, "monthly_bills");
    const councilTaxMonthly = parseNonNegativeNumber(formData, "council_tax_monthly");

    if (monthlyRent === null || monthlyRent === 0) return { error: "Enter a valid monthly rent." };
    if (monthlyBills === null) return { error: "Enter a valid monthly bills figure." };
    if (councilTaxMonthly === null) return { error: "Enter a valid monthly council tax figure." };

    const { error } = await supabase.from("house_scenarios").insert({
      user_id: user.id,
      name,
      mode: "rent",
      monthly_rent: monthlyRent,
      monthly_bills: monthlyBills,
      council_tax_monthly: councilTaxMonthly,
    });
    if (error) return { error: error.message };
  } else {
    const loanAmount = parseNonNegativeNumber(formData, "loan_amount");
    const interestRateApr = parseNonNegativeNumber(formData, "interest_rate_apr");
    const termYears = Number(formData.get("term_years"));
    const buildingsInsuranceAnnual = parseNonNegativeNumber(formData, "buildings_insurance_annual");
    const councilTaxAnnual = parseNonNegativeNumber(formData, "council_tax_annual");

    if (loanAmount === null || loanAmount === 0) return { error: "Enter a valid loan amount." };
    if (interestRateApr === null) return { error: "Enter a valid interest rate." };
    if (!Number.isInteger(termYears) || termYears <= 0) return { error: "Enter a valid term in years." };
    if (buildingsInsuranceAnnual === null) return { error: "Enter a valid annual buildings insurance cost." };
    if (councilTaxAnnual === null) return { error: "Enter a valid annual council tax." };

    const { error } = await supabase.from("house_scenarios").insert({
      user_id: user.id,
      name,
      mode: "mortgage",
      loan_amount: loanAmount,
      interest_rate_apr: interestRateApr,
      term_years: termYears,
      buildings_insurance_annual: buildingsInsuranceAnnual,
      council_tax_annual: councilTaxAnnual,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/calculators/house");
  return {};
}

export async function deleteHouseScenario(scenarioId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("house_scenarios").delete().eq("id", scenarioId);
  revalidatePath("/calculators/house");
}

export async function linkHouseScenarioToGoal(scenarioId: string, goalId: string | null): Promise<void> {
  const supabase = await createClient();
  await supabase.from("house_scenarios").update({ linked_goal_id: goalId }).eq("id", scenarioId);
  revalidatePath("/calculators/house");
}

/** Creates a new goal from a mortgage scenario (target = loan amount as a stand-in for a deposit target) and links it. */
export async function createGoalFromHouseScenario(scenarioId: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in." };

  const { data: scenario, error: scenarioError } = await supabase
    .from("house_scenarios")
    .select("name, loan_amount")
    .eq("id", scenarioId)
    .eq("user_id", user.id)
    .single();
  if (scenarioError || !scenario) return { error: "Couldn't find that scenario." };
  if (!scenario.loan_amount) {
    return { error: "This scenario has no loan amount to base a savings target on — link it to an existing goal instead." };
  }

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
      target_amount: Number(scenario.loan_amount) * 0.1, // typical 10% deposit as a starting point
      deadline: deadline.toISOString().slice(0, 10),
      priority: (maxPriorityRow?.priority ?? -1) + 1,
    })
    .select("id")
    .single();
  if (goalError || !goal) return { error: goalError?.message ?? "Couldn't create the goal." };

  await supabase.from("house_scenarios").update({ linked_goal_id: goal.id }).eq("id", scenarioId);

  revalidatePath("/calculators/house");
  revalidatePath("/dashboard");
  return {};
}
