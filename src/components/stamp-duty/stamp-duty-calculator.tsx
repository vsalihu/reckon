"use client";

import { useMemo, useState } from "react";
import { calculateStampDuty, type StampDutyNation } from "@/lib/stamp-duty";
import { formatCurrency } from "@/lib/currency";

const NATIONS: { value: StampDutyNation; label: string }[] = [
  { value: "england-ni", label: "England / NI" },
  { value: "scotland", label: "Scotland" },
  { value: "wales", label: "Wales" },
];

export function StampDutyCalculator() {
  const [nation, setNation] = useState<StampDutyNation>("england-ni");
  const [price, setPrice] = useState("300000");
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(false);
  const [isAdditionalProperty, setIsAdditionalProperty] = useState(false);

  const result = useMemo(() => {
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return null;
    return calculateStampDuty({ nation, price: parsedPrice, isFirstTimeBuyer, isAdditionalProperty });
  }, [nation, price, isFirstTimeBuyer, isAdditionalProperty]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-1 font-display text-lg text-foreground">Stamp duty calculator</h2>
      <p className="mb-4 text-sm text-foreground-muted">
        England/NI (SDLT), Scotland (LBTT), and Wales (LTT) are three separate tax systems with different rates —
        pick where the property is.
      </p>

      <div className="mb-4 inline-flex flex-wrap rounded-full border border-border p-1">
        {NATIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setNation(option.value)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              nation === option.value ? "bg-accent text-accent-foreground" : "text-foreground-muted"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label htmlFor="stamp-duty-price" className="mb-1.5 block text-sm text-foreground-muted">
        Purchase price
      </label>
      <input
        id="stamp-duty-price"
        type="number"
        min="0"
        step="1000"
        value={price}
        onChange={(event) => setPrice(event.target.value)}
        className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
      />

      <div className="mt-3 flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={isFirstTimeBuyer}
            onChange={(event) => {
              setIsFirstTimeBuyer(event.target.checked);
              if (event.target.checked) setIsAdditionalProperty(false);
            }}
            className="h-4 w-4 accent-accent"
          />
          This is my first home
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={isAdditionalProperty}
            onChange={(event) => {
              setIsAdditionalProperty(event.target.checked);
              if (event.target.checked) setIsFirstTimeBuyer(false);
            }}
            className="h-4 w-4 accent-accent"
          />
          This is an additional property (second home, buy-to-let)
        </label>
      </div>

      {result ? (
        <div className="mt-4 rounded-lg border border-border p-3">
          <p className="text-xs text-foreground-muted">{result.taxName}</p>
          <p className="font-numeric text-2xl text-foreground">{formatCurrency(result.amountDue, "GBP")}</p>
          <p className="text-xs text-foreground-muted">{(result.effectiveRate * 100).toFixed(1)}% effective rate</p>
          {result.note ? <p className="mt-2 text-sm text-foreground-muted">{result.note}</p> : null}
        </div>
      ) : null}

      <p className="mt-4 text-xs text-foreground-muted">
        Estimate only — standard residential purchases. Doesn&apos;t model shared ownership, multiple-dwellings
        relief, or the non-UK-resident surcharge.
      </p>
    </div>
  );
}
