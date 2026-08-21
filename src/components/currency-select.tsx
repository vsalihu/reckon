import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currency";

export function CurrencySelect({
  value,
  onChange,
}: {
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
}) {
  return (
    <div>
      <label htmlFor="currency" className="mb-1.5 block text-sm text-foreground-muted">
        Currency
      </label>
      <select
        id="currency"
        name="currency"
        value={value}
        onChange={(event) => onChange(event.target.value as CurrencyCode)}
        className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
      >
        {SUPPORTED_CURRENCIES.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.symbol} {currency.label} ({currency.code})
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-foreground-muted">
        Fixed for your account once chosen — everything is tracked in this currency.
      </p>
    </div>
  );
}
