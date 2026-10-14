import type { ReactNode } from "react";

import { formatSomUZS } from "@/lib/money";
import type { OrderDetail } from "@/lib/api/schemas/orders";

function Row({ label, value, muted = false, strong = false }: {
  label: ReactNode;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-3 text-sm ${muted ? "text-muted-foreground" : ""} ${strong ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

const som = (value: number) => `${formatSomUZS(Math.round(value))} UZS`;

export function OrderMoneySection({ order }: { order: OrderDetail }) {
  const { money } = order;
  const due = Math.max(money.subtotal - money.promo_discount, 0);
  const card = [money.card_system, money.card_pan].filter(Boolean).join(" · ");

  return (
    <div className="space-y-2">
      <Row label="Subtotal" value={som(money.subtotal)} />
      {money.promo_discount > 0 && (
        <Row
          label={<>Promo <span className="font-mono text-xs">{order.promo_code}</span></>}
          value={`− ${som(money.promo_discount)}`}
          muted
        />
      )}
      <Row label="To pay" value={som(due)} strong />
      <div className="my-2 border-t" />
      <Row label="Paid from wallet" value={som(money.wallet)} muted={money.wallet === 0} />
      <Row
        label={<>Card{card && <span className="ml-1 text-xs text-muted-foreground">({card})</span>}</>}
        value={som(money.card)}
        muted={money.card === 0}
      />
      {money.gift_card > 0 && <Row label="Gift card" value={som(money.gift_card)} />}
      <Row label="Customer paid" value={som(money.customer_paid)} strong />
      {money.card_status && money.card_status !== "success" && (
        <p className="text-xs text-muted-foreground">Last card invoice: {money.card_status}</p>
      )}
      <div className="my-2 border-t" />
      <Row label="Cashback earned" value={som(money.cashback_earned)} muted />
      <Row label="Settled with partner" value={order.settlement_status === "paid" ? "Yes" : "No"} muted />
    </div>
  );
}
