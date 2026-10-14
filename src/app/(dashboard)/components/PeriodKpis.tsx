import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Delta } from "@/components/ui/delta";
import { formatSomUZS } from "@/lib/money";
import type { PeriodStats } from "@/lib/api/schemas/analytics";

const cancelRate = (p: PeriodStats) => {
  const closed = p.completed + p.cancelled;
  return closed > 0 ? (p.cancelled / closed) * 100 : 0;
};

export function Tile({ label, value, footer, href }: {
  label: string;
  value: ReactNode;
  footer?: ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-foreground">{value}</span>
      <span className="flex min-h-4 items-center gap-2 text-xs text-muted-foreground">{footer}</span>
    </>
  );
  const className = "flex flex-col gap-1 bg-card p-5";
  return href ? (
    <Link to={href} className={`${className} transition-colors hover:bg-muted/40`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function PeriodKpis({ current, previous, comparedTo, ordersHref, extra }: {
  current: PeriodStats;
  previous: PeriodStats;
  comparedTo: string;
  ordersHref: string;
  extra: ReactNode;
}) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
      <Tile
        label="Заказы"
        value={current.orders.toLocaleString("ru-RU")}
        href={ordersHref}
        footer={
          <>
            <Delta current={current.orders} previous={previous.orders} />
            <span>по сравнению с {comparedTo}</span>
          </>
        }
      />
      <Tile
        label="Выручка"
        value={formatSomUZS(current.revenue)}
        footer={
          <>
            <Delta current={current.revenue} previous={previous.revenue} />
            <span>Выполнено: {current.completed.toLocaleString("ru-RU")}</span>
          </>
        }
      />
      <Tile
        label="Доля отмен"
        value={`${cancelRate(current).toFixed(1)}%`}
        footer={
          <>
            <Delta current={cancelRate(current)} previous={cancelRate(previous)} inverse points />
            <span>Отменено: {current.cancelled.toLocaleString("ru-RU")}</span>
          </>
        }
      />
      {extra}
    </div>
  );
}
