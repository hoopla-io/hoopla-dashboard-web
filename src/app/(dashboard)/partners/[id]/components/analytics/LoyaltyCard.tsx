import type { Loyalty } from "@/lib/api/schemas/analytics";

interface LoyaltyCardProps {
  data: Loyalty;
}

export function LoyaltyCard({ data }: LoyaltyCardProps) {
  const rows = [
    { label: "New customers", value: data.new_users },
    { label: "Returning customers", value: data.returning_users },
    { label: "Repeat customers (2+ orders)", value: data.repeat_users },
  ];
  const max = Math.max(...rows.map((row) => row.value), 1);
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        No data for this period
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium">{row.label}</span>
            <span className="shrink-0 text-muted-foreground">{row.value.toLocaleString()}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <p className="pt-2 text-sm text-muted-foreground">
        Orders per customer: <span className="font-medium text-foreground">{data.orders_per_user.toFixed(2)}</span>
      </p>
    </div>
  );
}
