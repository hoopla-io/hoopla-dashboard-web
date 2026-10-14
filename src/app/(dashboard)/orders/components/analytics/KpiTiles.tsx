import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatSomUZS } from "@/lib/money";
import type { OrdersKpi } from "@/lib/api/schemas/analytics";

interface KpiValues {
  revenue: number;
  completed: number;
  cancelled: number;
  avgOrder: number;
  cancelRate: number;
}

function kpiValues(kpi: OrdersKpi): KpiValues {
  const completed = kpi.statuses.find((s) => s.status === "completed");
  const cancelled = kpi.statuses.find((s) => s.status === "cancelled");
  const revenue = completed?.revenue ?? 0;
  const completedCount = completed?.orders ?? 0;
  const cancelledCount = cancelled?.orders ?? 0;
  const closed = completedCount + cancelledCount;
  return {
    revenue,
    completed: completedCount,
    cancelled: cancelledCount,
    avgOrder: completedCount > 0 ? revenue / completedCount : 0,
    cancelRate: closed > 0 ? (cancelledCount / closed) * 100 : 0,
  };
}

function Delta({ current, previous, inverse = false, points = false }: {
  current: number;
  previous: number;
  inverse?: boolean;
  points?: boolean;
}) {
  if (!points && previous === 0) {
    return <span className="text-xs text-muted-foreground">no prior data</span>;
  }
  const diff = points ? current - previous : ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 0.05) {
    return <span className="text-xs text-muted-foreground">no change</span>;
  }
  const up = diff > 0;
  const good = inverse ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      )}
    >
      <Icon className="size-3.5" />
      {Math.abs(diff).toFixed(1)}
      {points ? " pp" : "%"}
    </span>
  );
}

function Tile({ label, value, delta, hint }: {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold tracking-tight tabular-nums">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {delta}
        {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export function KpiTiles({ current, previous }: { current: OrdersKpi; previous: OrdersKpi }) {
  const cur = kpiValues(current);
  const prev = kpiValues(previous);
  const newCustomers = Math.max(current.unique_customers - current.returning_customers, 0);
  const walletShare = cur.revenue > 0 ? (current.cashback_used / cur.revenue) * 100 : 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Tile
        label="Revenue (completed)"
        value={`${formatSomUZS(cur.revenue)} UZS`}
        delta={<Delta current={cur.revenue} previous={prev.revenue} />}
      />
      <Tile
        label="Completed orders"
        value={cur.completed.toLocaleString()}
        delta={<Delta current={cur.completed} previous={prev.completed} />}
      />
      <Tile
        label="Avg order value"
        value={`${formatSomUZS(Math.round(cur.avgOrder))} UZS`}
        delta={<Delta current={cur.avgOrder} previous={prev.avgOrder} />}
      />
      <Tile
        label="Cancel rate"
        value={`${cur.cancelRate.toFixed(1)}%`}
        delta={<Delta current={cur.cancelRate} previous={prev.cancelRate} inverse points />}
        hint={`${cur.cancelled.toLocaleString()} cancelled`}
      />
      <Tile
        label="Customers"
        value={current.unique_customers.toLocaleString()}
        delta={<Delta current={current.unique_customers} previous={previous.unique_customers} />}
        hint={`${newCustomers.toLocaleString()} new · ${current.returning_customers.toLocaleString()} returning`}
      />
      <Tile
        label="Avg rating"
        value={current.avg_rating != null ? `${current.avg_rating.toFixed(2)} / 5` : "—"}
        hint={`${current.feedback_count.toLocaleString()} reviews`}
      />
      <Tile
        label="Paid from wallet"
        value={`${formatSomUZS(Math.round(current.cashback_used))} UZS`}
        hint={`${walletShare.toFixed(1)}% of revenue`}
      />
      <Tile
        label="Cashback earned"
        value={`${formatSomUZS(Math.round(current.cashback_earned))} UZS`}
        hint={`${current.promo_orders.toLocaleString()} orders with promo`}
      />
    </div>
  );
}
