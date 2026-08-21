import { calculateCarOwnershipComparison, type CarOwnershipPath } from "@/lib/finance/car-ownership-comparison";
import { formatCurrency, type CurrencyCode } from "@/lib/currency";
import type { CarScenarioRow } from "@/components/scenarios/car-scenario-list";

export function CarOwnershipComparisonTable({ scenario, currency }: { scenario: CarScenarioRow; currency: CurrencyCode }) {
  const comparison = calculateCarOwnershipComparison({
    price: scenario.price,
    deposit: scenario.deposit,
    apr: scenario.apr,
    termMonths: scenario.term_months,
    insuranceAnnual: scenario.insurance_annual,
    roadTaxAnnual: scenario.road_tax_annual,
    fuelMaintenanceMonthly: scenario.fuel_maintenance_monthly,
    leaseMonthlyQuote: scenario.lease_monthly_quote,
  });

  const paths = [comparison.cash, comparison.finance, comparison.lease].filter((p): p is CarOwnershipPath => p !== null);

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[420px] text-left font-numeric text-sm">
        <thead>
          <tr className="text-xs text-foreground-muted">
            <th className="pb-1 font-normal"> </th>
            {paths.map((path) => (
              <th key={path.label} className="pb-1 pl-3 text-right font-normal">
                {path.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-border">
            <td className="py-1.5 text-foreground-muted">Monthly</td>
            {paths.map((path) => (
              <td key={path.label} className="py-1.5 pl-3 text-right text-foreground">
                {formatCurrency(path.monthlyCost, currency)}
              </td>
            ))}
          </tr>
          <tr className="border-t border-border">
            <td className="py-1.5 text-foreground-muted">Total over term</td>
            {paths.map((path) => (
              <td key={path.label} className="py-1.5 pl-3 text-right font-medium text-foreground">
                {formatCurrency(path.totalCostOverTerm, currency)}
              </td>
            ))}
          </tr>
          <tr className="border-t border-border">
            <td className="py-1.5 align-top text-foreground-muted">You own</td>
            {paths.map((path) => (
              <td key={path.label} className="py-1.5 pl-3 text-right align-top text-xs text-foreground-muted">
                {path.ownsAtEnd ? "Yes" : "No"}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      {comparison.lease === null ? (
        <p className="mt-2 text-xs text-foreground-muted">Add a lease quote to this scenario to compare against leasing.</p>
      ) : null}
    </div>
  );
}
