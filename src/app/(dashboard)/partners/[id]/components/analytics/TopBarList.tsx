import { formatSomUZS } from "@/lib/money";
import type { NamedMetric } from "@/lib/api/schemas/analytics";

interface TopBarListProps {
  data: NamedMetric[];
}

export function TopBarList({ data }: TopBarListProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        No data for this period
      </div>
    );
  }

  const max = Math.max(...data.map((item) => item.orders), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium">{item.name}</span>
            <span className="shrink-0 text-muted-foreground">
              {item.orders.toLocaleString()} · {formatSomUZS(item.revenue)} UZS
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${(item.orders / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
