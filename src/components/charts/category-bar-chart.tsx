import { formatCurrency, type CurrencyCode } from "@/lib/currency";

const VIZ_COLORS = ["--viz-1", "--viz-2", "--viz-3", "--viz-4", "--viz-5", "--viz-6", "--viz-7", "--viz-8"];
const MAX_SLOTS = VIZ_COLORS.length;

export interface CategoryTotal {
  name: string;
  total: number;
}

/**
 * Horizontal bar chart, one bar per spending category. Single series (one
 * metric: amount) with categorical color for identity — every bar carries
 * its own always-visible label (name + value), so identity and value are
 * never gated behind hover, and no separate legend is needed alongside the
 * direct labels. Categories beyond the 8 validated slots fold into "Other"
 * (muted, non-identity gray) rather than reusing or cycling a hue.
 */
export function CategoryBarChart({ categories, currency }: { categories: CategoryTotal[]; currency: CurrencyCode }) {
  if (categories.length === 0) {
    return <p className="text-sm text-foreground-muted">No spending logged yet.</p>;
  }

  const sorted = [...categories].sort((a, b) => b.total - a.total);
  const shown = sorted.slice(0, MAX_SLOTS - 1);
  const rest = sorted.slice(MAX_SLOTS - 1);
  const otherTotal = rest.reduce((sum, c) => sum + c.total, 0);

  const rows = otherTotal > 0 ? [...shown, { name: "Other", total: otherTotal }] : shown;
  const max = Math.max(...rows.map((r) => r.total), 1);

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => {
        const isOther = row.name === "Other" && otherTotal > 0 && index === rows.length - 1 && rest.length > 0;
        const color = isOther ? "var(--viz-other)" : `var(${VIZ_COLORS[index % VIZ_COLORS.length]})`;
        const widthPercent = (row.total / max) * 100;

        return (
          <div key={row.name}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="text-foreground">{row.name}</span>
              <span className="font-numeric text-foreground-muted">{formatCurrency(row.total, currency)}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${widthPercent}%`, backgroundColor: color }}
                role="img"
                aria-label={`${row.name}: ${formatCurrency(row.total, currency)}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
