import type { ReactNode } from "react";
import { Ban, CircleCheck, CircleDollarSign, Wallet } from "lucide-react";
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
  tone: SummaryTone;
}

function SummaryCard({ icon: Icon, label, value, tone }: SummaryCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", toneClass[tone])}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-lg font-semibold tracking-tight tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function Money({ amount }: { amount: number }) {
  return (
    <>
      {formatSomUZS(amount)} <span className="text-sm font-normal text-muted-foreground">UZS</span>
    </>
  );
}

export function OrdersSummaryCards({ summary }: { summary: OrdersSummary | undefined }) {
  if (!summary) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[74px] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      title="Totals for the selected period and filters. Status and payment filters are not applied."
    >
      <SummaryCard
        icon={CircleDollarSign}
        tone="primary"
        label="Revenue (completed)"
        value={<Money amount={summary.revenue_completed} />}
      />
      <SummaryCard
        icon={CircleCheck}
        tone="success"
        label="Completed orders"
        value={summary.completed_count.toLocaleString()}
      />
      <SummaryCard
        icon={Ban}
        tone="danger"
        label="Cancelled orders"
        value={summary.cancelled_count.toLocaleString()}
      />
      <SummaryCard
        icon={Wallet}
        tone="muted"
        label="Cancelled amount"
        value={<Money amount={summary.cancelled_sum} />}
      />
    </div>
  );
}
