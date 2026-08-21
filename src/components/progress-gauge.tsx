import { formatCurrency, type CurrencyCode } from "@/lib/currency";

export function ProgressGauge({
  current,
  target,
  currency,
  label,
}: {
  current: number;
  target: number;
  currency: CurrencyCode;
  label: string;
}) {
  const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm text-foreground-muted">{label}</span>
        <span className="font-numeric text-sm text-foreground-muted">{percent.toFixed(0)}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <div className="mt-2 flex items-baseline justify-between font-numeric text-sm">
        <span className="text-foreground">{formatCurrency(current, currency)}</span>
        <span className="text-foreground-muted">of {formatCurrency(target, currency)}</span>
      </div>
    </div>
  );
}
