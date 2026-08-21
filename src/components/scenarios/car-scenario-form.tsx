"use client";

import { useActionState } from "react";
import { createCarScenario } from "@/lib/scenarios/car-actions";
import { SubmitButton } from "@/components/submit-button";

const fieldClass =
  "h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm text-foreground-muted";

export function CarScenarioForm() {
  const [state, action] = useActionState(createCarScenario, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <div>
        <label htmlFor="car-name" className={labelClass}>
          Scenario name
        </label>
        <input id="car-name" name="name" type="text" required placeholder="e.g. Used Golf" className={fieldClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="price" className={labelClass}>
            Price
          </label>
          <input id="price" name="price" type="number" min="0.01" step="0.01" required className={fieldClass} />
        </div>
        <div>
          <label htmlFor="deposit" className={labelClass}>
            Deposit
          </label>
          <input id="deposit" name="deposit" type="number" min="0" step="0.01" defaultValue={0} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="apr" className={labelClass}>
            APR %
          </label>
          <input id="apr" name="apr" type="number" min="0" step="0.01" defaultValue={0} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="term_months" className={labelClass}>
            Term (months)
          </label>
          <input id="term_months" name="term_months" type="number" min="1" step="1" required className={fieldClass} />
        </div>
        <div>
          <label htmlFor="insurance_annual" className={labelClass}>
            Insurance / year
          </label>
          <input
            id="insurance_annual"
            name="insurance_annual"
            type="number"
            min="0"
            step="0.01"
            defaultValue={0}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="road_tax_annual" className={labelClass}>
            Road tax (VED) / year
          </label>
          <input
            id="road_tax_annual"
            name="road_tax_annual"
            type="number"
            min="0"
            step="0.01"
            defaultValue={0}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="fuel_maintenance_monthly" className={labelClass}>
            Fuel + maintenance / month
          </label>
          <input
            id="fuel_maintenance_monthly"
            name="fuel_maintenance_monthly"
            type="number"
            min="0"
            step="0.01"
            defaultValue={0}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="mot_due_date" className={labelClass}>
            MOT due (reminder only)
          </label>
          <input id="mot_due_date" name="mot_due_date" type="date" className={fieldClass} />
        </div>
      </div>

      {state.error ? <p className="text-sm text-negative">{state.error}</p> : null}
      <SubmitButton>Add scenario</SubmitButton>
    </form>
  );
}
