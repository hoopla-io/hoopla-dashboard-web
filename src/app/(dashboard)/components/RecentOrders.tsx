import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

import { StatusBadge } from "@/components/ui/status-badge";
import { ordersApi } from "@/lib/api/domains/orders";
import { formatOrderSource } from "@/lib/order-source";
import { formatOrderStatus, orderStatusTone } from "@/lib/order-status";

export function RecentOrders() {
  const { data } = useQuery({
    queryKey: ["orders", "recent"],
    queryFn: () => ordersApi.getAll({ page: 1, limit: 8 }),
  });
  const orders = data?.data ?? [];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {orders.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center px-6 py-10 text-center">
          <p className="text-xs text-muted-foreground">No orders yet. New orders will appear here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {orders.map((order) => {
            const ts = order.time ? new Date(order.time) : null;
            return (
              <li key={order.id}>
                <Link
                  to={`/orders?order=${order.id}`}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">#{order.id}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      {order.drink?.name ?? (order.items?.length ? `${order.items.length} items` : "Product")}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.shop?.name ?? "—"}
                      {order.user?.name ? ` · ${order.user.name}` : ""}
                      {` · ${formatOrderSource(order.source)}`}
                    </p>
                  </div>
                  <StatusBadge label={formatOrderStatus(order.status)} tone={orderStatusTone[order.status] ?? "neutral"} />
                  <span className="hidden w-24 text-right text-xs text-muted-foreground sm:inline">
                    {ts ? formatDistanceToNow(ts, { addSuffix: true }) : "—"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
