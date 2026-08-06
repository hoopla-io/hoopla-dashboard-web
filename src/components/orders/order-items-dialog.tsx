import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatSomUZS } from "@/lib/money";
import { groupOrderItems } from "@/lib/orderItems";
import type { Order } from "@/lib/api/schemas/orders";

interface Props {
  order: Order | null;
  onOpenChange: (open: boolean) => void;
}

/** Shared line-item breakdown for a cart order — each drink with its
 * quantity and, grouped underneath, whichever modifiers belong to it. */
export function OrderItemsDialog({ order, onOpenChange }: Props) {
  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order #{order?.id} items</DialogTitle>
          <DialogDescription>Line items for this order.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {groupOrderItems(order?.items).map(({ drink, modifiers }) => (
            <div key={drink.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {drink.name} × {drink.quantity}
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {formatSomUZS(drink.price * drink.quantity)} UZS
                </span>
              </div>
              {modifiers.map((modifier) => (
                <div
                  key={modifier.id}
                  className="flex items-center justify-between pl-4 text-xs text-muted-foreground"
                >
                  <span>+ {modifier.name}</span>
                  <span className="font-mono tabular-nums">
                    {formatSomUZS(modifier.price)} UZS
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
