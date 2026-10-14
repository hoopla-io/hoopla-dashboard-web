import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ordersApi } from "@/lib/api/domains/orders";
import { getApiErrorMessage } from "@/lib/api/error";
import { formatSomUZS } from "@/lib/money";
import { EDITABLE_ORDER_STATUSES, formatOrderStatus } from "@/lib/order-status";
import type { OrderDetail } from "@/lib/api/schemas/orders";

const som = (value: number) => `${formatSomUZS(Math.round(value))} UZS`;

export function OrderStatusChange({ order }: { order: OrderDetail }) {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);

  const options = EDITABLE_ORDER_STATUSES.filter((s) => s !== order.status);
  const reasonRequired = target === "cancelled";
  const canSubmit = !!target && (!reasonRequired || reason.trim().length > 0);
  const refundWarning = target === "cancelled" && order.money.customer_paid > 0;

  const reset = () => {
    setTarget("");
    setReason("");
    setConfirming(false);
  };

  const mutation = useMutation({
    mutationFn: () => ordersApi.changeStatus({ id: order.id, status: target, reason: reason.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["shop-orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", order.id] });
      queryClient.invalidateQueries({ queryKey: ["orders-analytics"] });
      toast.success(`Order #${order.id} is now ${formatOrderStatus(target).toLowerCase()}`);
      reset();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update order status"));
      setConfirming(false);
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={target}
          onValueChange={(value) => {
            setTarget(value);
            setConfirming(false);
          }}
        >
          <SelectTrigger size="sm" className="w-48">
            <SelectValue placeholder="New status…" />
          </SelectTrigger>
          <SelectContent>
            {options.map((status) => (
              <SelectItem key={status} value={status}>
                {formatOrderStatus(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {target && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Cancel
          </Button>
        )}
      </div>

      {target && (
        <>
          <Textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setConfirming(false);
            }}
            maxLength={500}
            placeholder={reasonRequired ? "Why is this order cancelled? (required)" : "Reason (optional)"}
            className="min-h-20 text-sm"
          />

          {refundWarning && (
            <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p>
                Cancelling here does not refund the customer. They paid {som(order.money.customer_paid)}
                {" "}(wallet {som(order.money.wallet)}, card {som(order.money.card)}
                {order.money.gift_card > 0 ? `, gift card ${som(order.money.gift_card)}` : ""}). Refund it separately.
              </p>
            </div>
          )}

          {confirming ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">
                Change #{order.id} from {formatOrderStatus(order.status)} to {formatOrderStatus(target)}?
              </span>
              <Button
                size="sm"
                variant={target === "cancelled" ? "destructive" : "default"}
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Saving…" : "Confirm"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirming(false)} disabled={mutation.isPending}>
                Back
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setConfirming(true)} disabled={!canSubmit}>
              Change to {formatOrderStatus(target)}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
