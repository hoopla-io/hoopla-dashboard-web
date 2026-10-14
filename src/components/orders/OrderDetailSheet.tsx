import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ordersApi } from "@/lib/api/domains/orders";
import { formatSomUZS } from "@/lib/money";
import { formatOrderStatus, orderStatusTone } from "@/lib/order-status";
import { formatOrderSource, orderSourceVariant } from "@/lib/order-source";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { OrderMoneySection } from "@/components/orders/OrderMoneySection";
import { OrderStatusChange } from "@/components/orders/OrderStatusChange";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

interface OrderDetailSheetProps {
  orderId: number | null;
  onClose: () => void;
}

export function OrderDetailSheet({ orderId, onClose }: OrderDetailSheetProps) {
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => ordersApi.getById(orderId!),
    enabled: !!orderId,
  });

  const itemName = (itemId: number | null) =>
    itemId ? order?.items.find((i) => i.id === itemId)?.name : undefined;

  return (
    <Sheet open={!!orderId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            Order #{orderId}
            {order && (
              <>
                <StatusBadge label={formatOrderStatus(order.status)} tone={orderStatusTone[order.status] ?? "neutral"} />
                <Badge variant={orderSourceVariant(order.source)}>{formatOrderSource(order.source)}</Badge>
              </>
            )}
          </SheetTitle>
          <SheetDescription>
            {order ? `Placed ${new Date(order.placed_at).toLocaleString()}` : "Loading order…"}
          </SheetDescription>
        </SheetHeader>

        {isLoading && <p className="px-4 text-sm text-muted-foreground">Loading…</p>}
        {isError && <p className="px-4 text-sm text-destructive">Couldn't load this order.</p>}

        {order && (
          <div className="space-y-8 px-4 pb-8">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <Link to={`/users/${order.user.id}`} className="underline-offset-2 hover:underline">
                  {order.user.name || "—"}
                </Link>
                <p className="text-xs text-muted-foreground">{order.user.phone_number}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Shop</p>
                <Link to={`/shops/${order.shop.id}`} className="underline-offset-2 hover:underline">
                  {order.shop.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  <Link to={`/partners/${order.partner.id}`} className="underline-offset-2 hover:underline">
                    {order.partner.name}
                  </Link>
                </p>
              </div>
              {order.table && (
                <div>
                  <p className="text-xs text-muted-foreground">Table</p>
                  <p>{order.table}</p>
                </div>
              )}
              {order.pickup_time && (
                <div>
                  <p className="text-xs text-muted-foreground">Scheduled pickup</p>
                  <p>{new Date(order.pickup_time).toLocaleString()}</p>
                </div>
              )}
              {order.vendor && (
                <div>
                  <p className="text-xs text-muted-foreground">POS</p>
                  <p>
                    {order.vendor}
                    {order.vendor_order_id && order.vendor_order_id !== String(order.id) && (
                      <span className="ml-1 font-mono text-xs text-muted-foreground">#{order.vendor_order_id}</span>
                    )}
                  </p>
                </div>
              )}
              {order.fiscal_link?.trim() && (
                <div>
                  <p className="text-xs text-muted-foreground">Fiscal receipt</p>
                  <Button asChild variant="link" size="sm" className="h-auto px-0">
                    <a href={order.fiscal_link.trim()} target="_blank" rel="noopener noreferrer">
                      Open <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                </div>
              )}
            </div>

            {order.comment && (
              <p className="rounded-md bg-muted p-3 text-sm">“{order.comment}”</p>
            )}

            <Section title="Items">
              <div className="space-y-3">
                {order.items.map((item) => {
                  const modifiersTotal = item.modifiers.reduce((sum, m) => sum + m.price * m.quantity, 0);
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium">
                          {item.name} <span className="text-muted-foreground">× {item.quantity}</span>
                        </span>
                        <span className="font-mono tabular-nums">
                          {formatSomUZS((item.price + modifiersTotal) * item.quantity)}
                        </span>
                      </div>
                      {item.modifiers.map((m, i) => (
                        <div key={`${m.name}-${i}`} className="flex justify-between gap-3 pl-4 text-xs text-muted-foreground">
                          <span>+ {m.name}{m.quantity > 1 ? ` × ${m.quantity}` : ""}</span>
                          {m.price > 0 && <span className="font-mono tabular-nums">{formatSomUZS(m.price * m.quantity)}</span>}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </Section>

            <Section title="Payment">
              <OrderMoneySection order={order} />
            </Section>

            <Section title="Timeline">
              <OrderTimeline order={order} />
            </Section>

            {order.feedbacks.length > 0 && (
              <Section title="Feedback">
                <div className="space-y-3">
                  {order.feedbacks.map((f) => (
                    <div key={f.id} className="space-y-0.5 text-sm">
                      <p className="inline-flex items-center gap-1">
                        <Star className="size-3.5 fill-foreground" />
                        {f.rating}/5
                        {itemName(f.order_item_id) && (
                          <span className="text-xs text-muted-foreground">· {itemName(f.order_item_id)}</span>
                        )}
                      </p>
                      {f.comment && <p className="text-muted-foreground">{f.comment}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Change status">
              <OrderStatusChange key={`${order.id}-${order.status}`} order={order} />
            </Section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
