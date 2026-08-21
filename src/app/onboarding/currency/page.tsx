"use client";

import { useActionState, useState } from "react";
import { setOnboardingCurrency } from "./actions";
import { AuthCard } from "@/components/auth-card";
import { CurrencySelect } from "@/components/currency-select";
import { SubmitButton } from "@/components/submit-button";
import type { CurrencyCode } from "@/lib/currency";

export default function OnboardingCurrencyPage() {
  const [currency, setCurrency] = useState<CurrencyCode>("GBP");
  const [state, action] = useActionState(setOnboardingCurrency, {});

  return (
    <AuthCard title="One last thing" subtitle="Pick the currency you'll track everything in.">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="currency" value={currency} />
        <CurrencySelect value={currency} onChange={setCurrency} />
        {state.error ? <p className="text-sm text-negative">{state.error}</p> : null}
        <SubmitButton>Continue</SubmitButton>
      </form>
    </AuthCard>
  );
}
