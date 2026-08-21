"use client";

import { useActionState, useState } from "react";
import { createHouseScenario } from "@/lib/scenarios/house-actions";
import { SubmitButton } from "@/components/submit-button";

const fieldClass =
  "h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent";
const labelClass = "mb-1.5 block text-sm text-foreground-muted";

export function HouseScenarioForm() {
  const [state, action] = useActionState(createHouseScenario, {});
  const [mode, setMode] = useState<"rent" | "mortgage">("rent");

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="mode" value={mode} />

      <div>
        <label htmlFor="house-name" className={labelClass}>
          Scenario name
        </label>
        <input
          id="house-name"
          name="name"
          type="text"
          required
          placeholder="e.g. 2-bed flat, city centre"
          className={fieldClass}
        />
      </div>

      <div className="inline-flex self-start rounded-full border border-border p-1">
        {(["rent", "mortgage"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMode(option)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
              mode === option ? "bg-accent text-accent-foreground" : "text-foreground-muted"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {mode === "rent" ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="monthly_rent" className={labelClass}>
              Monthly rent
            </label>
            <input id="monthly_rent" name="monthly_rent" type="number" min="0.01" step="0.01" required className={fieldClass} />
          </div>
          <div>
            <label htmlFor="monthly_bills" className={labelClass}>
              Monthly bills
            </label>
            <input id="monthly_bills" name="monthly_bills" type="number" min="0" step="0.01" defaultValue={0} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="council_tax_monthly" className={labelClass}>
              Council tax / month
            </label>
            <input
              id="council_tax_monthly"
              name="council_tax_monthly"
              type="number"
              min="0"
              step="0.01"
              defaultValue={0}
              className={fieldClass}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="loan_amount" className={labelClass}>
              Loan amount
            </label>
            <input id="loan_amount" name="loan_amount" type="number" min="0.01" step="0.01" required className={fieldClass} />
          </div>
          <div>
            <label htmlFor="interest_rate_apr" className={labelClass}>
              Interest rate %
            </label>
            <input
              id="interest_rate_apr"
              name="interest_rate_apr"
              type="number"
              min="0"
              step="0.01"
              required
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="term_years" className={labelClass}>
              Term (years)
            </label>
            <input id="term_years" name="term_years" type="number" min="1" step="1" required className={fieldClass} />
          </div>
          <div>
            <label htmlFor="buildings_insurance_annual" className={labelClass}>
              Buildings insurance / year
            </label>
            <input
              id="buildings_insurance_annual"
              name="buildings_insurance_annual"
              type="number"
              min="0"
              step="0.01"
              defaultValue={0}
              className={fieldClass}
            />
          </div>
          <div className="col-span-2">
            <label htmlFor="council_tax_annual" className={labelClass}>
              Council tax / year
            </label>
            <input
              id="council_tax_annual"
              name="council_tax_annual"
              type="number"
              min="0"
              step="0.01"
              defaultValue={0}
              className={fieldClass}
            />
          </div>
        </div>
      )}

      {state.error ? <p className="text-sm text-negative">{state.error}</p> : null}
      <SubmitButton>Add scenario</SubmitButton>
    </form>
  );
}
