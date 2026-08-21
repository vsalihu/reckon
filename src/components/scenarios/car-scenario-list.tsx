import { calculateCarMonthlyCost } from "@/lib/finance/car-costs";
import { deleteCarScenario, linkCarScenarioToGoal, createGoalFromCarScenario } from "@/lib/scenarios/car-actions";
import { ScenarioGoalLink, type GoalOption } from "@/components/scenarios/scenario-goal-link";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";

export interface CarScenarioRow {
  id: string;
  name: string;
  price: number;
  deposit: number;
  apr: number;
  term_months: number;
  insurance_annual: number;
  road_tax_annual: number;
  fuel_maintenance_monthly: number;
  mot_due_date: string | null;
  linked_goal_id: string | null;
}

export function CarScenarioList({
  scenarios,
  goals,
  currency,
}: {
  scenarios: CarScenarioRow[];
  goals: GoalOption[];
  currency: CurrencyCode;
}) {
  if (scenarios.length === 0) {
    return <p className="text-sm text-foreground-muted">No car scenarios yet — add one below to compare.</p>;
  }

  const withCosts = scenarios
    .map((scenario) => ({
      scenario,
      cost: calculateCarMonthlyCost({
        price: scenario.price,
        deposit: scenario.deposit,
        apr: scenario.apr,
        termMonths: scenario.term_months,
        insuranceAnnual: scenario.insurance_annual,
        roadTaxAnnual: scenario.road_tax_annual,
        fuelMaintenanceMonthly: scenario.fuel_maintenance_monthly,
      }),
    }))
    .sort((a, b) => a.cost.totalMonthly - b.cost.totalMonthly);

  return (
    <ul className="flex flex-col gap-4">
      {withCosts.map(({ scenario, cost }) => (
        <li key={scenario.id} className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <p className="text-foreground">{scenario.name}</p>
              <p className="text-xs text-foreground-muted">
                {formatCurrency(scenario.price, currency)} price · {formatCurrency(scenario.deposit, currency)} deposit ·{" "}
                {scenario.apr}% APR · {scenario.term_months}mo
              </p>
            </div>
            <form action={deleteCarScenario.bind(null, scenario.id)}>
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
            <dt className="text-foreground-muted">Finance</dt>
            <dd className="text-right text-foreground">{formatCurrency(cost.financePayment, currency)}/mo</dd>
            <dt className="text-foreground-muted">Insurance</dt>
            <dd className="text-right text-foreground">{formatCurrency(cost.insuranceMonthly, currency)}/mo</dd>
            <dt className="text-foreground-muted">Road tax</dt>
            <dd className="text-right text-foreground">{formatCurrency(cost.roadTaxMonthly, currency)}/mo</dd>
            <dt className="text-foreground-muted">Fuel + maintenance</dt>
            <dd className="text-right text-foreground">{formatCurrency(cost.fuelMaintenanceMonthly, currency)}/mo</dd>
            <dt className="border-t border-border pt-1 font-medium text-foreground">Total</dt>
            <dd className="border-t border-border pt-1 text-right font-medium text-foreground">
              {formatCurrency(cost.totalMonthly, currency)}/mo
            </dd>
          </dl>

          {scenario.mot_due_date ? (
            <p className="mt-3 text-xs text-foreground-muted">
              MOT due {new Date(scenario.mot_due_date).toLocaleDateString("en-GB")}
            </p>
          ) : null}

          <div className="mt-3">
            <ScenarioGoalLink
              scenarioId={scenario.id}
              linkedGoalId={scenario.linked_goal_id}
              goals={goals}
              onLink={linkCarScenarioToGoal}
              onCreateGoal={createGoalFromCarScenario}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
