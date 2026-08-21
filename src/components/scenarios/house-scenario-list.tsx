import { calculateHouseMonthlyCost, type HouseCostInput } from "@/lib/finance/house-costs";
import { deleteHouseScenario, linkHouseScenarioToGoal, createGoalFromHouseScenario } from "@/lib/scenarios/house-actions";
import { ScenarioGoalLink, type GoalOption } from "@/components/scenarios/scenario-goal-link";
import { MortgageOverpaymentForm } from "@/components/scenarios/mortgage-overpayment-form";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";

export interface HouseScenarioRow {
  id: string;
  name: string;
  mode: "rent" | "mortgage";
  monthly_rent: number | null;
  monthly_bills: number | null;
  council_tax_monthly: number | null;
  loan_amount: number | null;
  interest_rate_apr: number | null;
  term_years: number | null;
  buildings_insurance_annual: number | null;
  council_tax_annual: number | null;
  overpayment_monthly: number | null;
  overpayment_lump_sum: number | null;
  overpayment_lump_sum_month: number | null;
  linked_goal_id: string | null;
}

function toCostInput(scenario: HouseScenarioRow): HouseCostInput {
  if (scenario.mode === "rent") {
    return {
      mode: "rent",
      monthlyRent: scenario.monthly_rent ?? 0,
      monthlyBills: scenario.monthly_bills ?? 0,
      councilTaxMonthly: scenario.council_tax_monthly ?? 0,
    };
  }
  return {
    mode: "mortgage",
    loanAmount: scenario.loan_amount ?? 0,
    interestRateApr: scenario.interest_rate_apr ?? 0,
    termYears: scenario.term_years ?? 1,
    buildingsInsuranceAnnual: scenario.buildings_insurance_annual ?? 0,
    councilTaxAnnual: scenario.council_tax_annual ?? 0,
  };
}

export function HouseScenarioList({
  scenarios,
  goals,
  currency,
}: {
  scenarios: HouseScenarioRow[];
  goals: GoalOption[];
  currency: CurrencyCode;
}) {
  if (scenarios.length === 0) {
    return <p className="text-sm text-foreground-muted">No house scenarios yet — add one below to compare.</p>;
  }

  const withCosts = scenarios
    .map((scenario) => ({ scenario, cost: calculateHouseMonthlyCost(toCostInput(scenario)) }))
    .sort((a, b) => a.cost.totalMonthly - b.cost.totalMonthly);

  return (
    <ul className="flex flex-col gap-4">
      {withCosts.map(({ scenario, cost }) => (
        <li key={scenario.id} className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-foreground">{scenario.name}</p>
              <p className="text-xs capitalize text-foreground-muted">{scenario.mode}</p>
            </div>
            <form action={deleteHouseScenario.bind(null, scenario.id)}>
              <button
                type="submit"
                aria-label={`Delete ${scenario.name}`}
                className="text-foreground-muted transition-colors hover:text-negative"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-7 0v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7"
                  />
                </svg>
              </button>
            </form>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 font-numeric text-sm">
            {scenario.mode === "rent" ? (
              <>
                <dt className="text-foreground-muted">Rent</dt>
                <dd className="text-right text-foreground">{formatCurrency(scenario.monthly_rent ?? 0, currency)}/mo</dd>
                <dt className="text-foreground-muted">Bills</dt>
                <dd className="text-right text-foreground">{formatCurrency(scenario.monthly_bills ?? 0, currency)}/mo</dd>
                <dt className="text-foreground-muted">Council tax</dt>
                <dd className="text-right text-foreground">
                  {formatCurrency(scenario.council_tax_monthly ?? 0, currency)}/mo
                </dd>
              </>
            ) : (
              <>
                <dt className="text-foreground-muted">Mortgage</dt>
                <dd className="text-right text-foreground">{formatCurrency(cost.mortgagePayment ?? 0, currency)}/mo</dd>
                <dt className="text-foreground-muted">Buildings insurance</dt>
                <dd className="text-right text-foreground">
                  {formatCurrency((scenario.buildings_insurance_annual ?? 0) / 12, currency)}/mo
                </dd>
                <dt className="text-foreground-muted">Council tax</dt>
                <dd className="text-right text-foreground">
                  {formatCurrency((scenario.council_tax_annual ?? 0) / 12, currency)}/mo
                </dd>
              </>
            )}
            <dt className="border-t border-border pt-1 font-medium text-foreground">Total</dt>
            <dd className="border-t border-border pt-1 text-right font-medium text-foreground">
              {formatCurrency(cost.totalMonthly, currency)}/mo
            </dd>
          </dl>

          {scenario.mode === "mortgage" ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-accent">Overpayment calculator</summary>
              <MortgageOverpaymentForm
                scenario={{
                  id: scenario.id,
                  loan_amount: scenario.loan_amount ?? 0,
                  interest_rate_apr: scenario.interest_rate_apr ?? 0,
                  term_years: scenario.term_years ?? 1,
                  overpayment_monthly: scenario.overpayment_monthly,
                  overpayment_lump_sum: scenario.overpayment_lump_sum,
                  overpayment_lump_sum_month: scenario.overpayment_lump_sum_month,
                }}
                currency={currency}
              />
            </details>
          ) : null}

          <div className="mt-3">
            <ScenarioGoalLink
              scenarioId={scenario.id}
              linkedGoalId={scenario.linked_goal_id}
              goals={goals}
              onLink={linkHouseScenarioToGoal}
              onCreateGoal={createGoalFromHouseScenario}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
