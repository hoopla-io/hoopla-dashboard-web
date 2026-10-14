import type { ReactNode } from "react";
import { Ban, CircleCheck, CircleDollarSign, Hourglass, ShoppingBag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { formatSomUZS } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { OrdersSummary } from "@/lib/api/schemas/orders";

type SummaryTone = "primary" | "success" | "danger" | "muted";

const toneClass: Record<SummaryTone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  muted: "bg-muted text-muted-foreground",
};

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
  tone: SummaryTone;
}

function SummaryCard({ icon: Icon, label, value, hint, tone }: SummaryCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", toneClass[tone])}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-lg font-semibold tracking-tight tabular-nums">{value}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function Money({ amount }: { amount: number }) {
  return (
    <>
      {formatSomUZS(amount)} <span className="text-sm font-normal text-muted-foreground">сум</span>
    </>
  );
}

export function OrdersSummaryCards({ summary }: { summary: OrdersSummary | undefined }) {
  if (!summary) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[74px] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  const closed = summary.completed_count + summary.cancelled_count;
  const cancelRate = closed > 0 ? (summary.cancelled_count / closed) * 100 : 0;
  const avgOrder = summary.completed_count > 0 ? summary.revenue_completed / summary.completed_count : 0;

  return (
    <div
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      title="Итоги за выбранный период и по фильтрам. Фильтры по статусу и оплате не применяются."
    >
      <SummaryCard
        icon={CircleDollarSign}
        tone="primary"
        label="Выручка (выполненные)"
        value={<Money amount={summary.revenue_completed} />}
      />
      <SummaryCard
        icon={CircleCheck}
        tone="success"
        label="Выполненные заказы"
        value={summary.completed_count.toLocaleString("ru-RU")}
      />
      <SummaryCard
        icon={ShoppingBag}
        tone="muted"
        label="Средний чек"
        value={<Money amount={Math.round(avgOrder)} />}
      />
      <SummaryCard
        icon={Ban}
        tone="danger"
        label="Отменённые заказы"
        value={summary.cancelled_count.toLocaleString("ru-RU")}
        hint={`${cancelRate.toFixed(1)}% · ${formatSomUZS(summary.cancelled_sum)} сум`}
      />
      <SummaryCard
        icon={Hourglass}
        tone="muted"
        label="В работе"
        value={summary.active_count.toLocaleString("ru-RU")}
        hint="Оплаченные, запланированные, ожидающие или готовящиеся"
      />
    </div>
  );
}
