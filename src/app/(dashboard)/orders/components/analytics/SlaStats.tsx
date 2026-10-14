import type { OrderSla } from "@/lib/api/schemas/analytics";
import { formatMinutes, formatSeconds } from "@/app/(dashboard)/orders/components/analytics/format";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SlaStats({ sla, cancelledBeforeAccept }: { sla: OrderSla; cancelledBeforeAccept: number }) {
  if (sla.received === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No cassa events in this period. Speed is tracked only for orders routed through the Hoopla cassa.
      </p>
    );
  }

  const acceptedRate = (sla.accepted / sla.received) * 100;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <Stat label="Time to accept (median)" value={formatSeconds(sla.accept_median_sec)} hint={`90% within ${formatSeconds(sla.accept_p90_sec)}`} />
      <Stat label="Prep time (median)" value={formatMinutes(sla.prep_median_min)} hint={`90% within ${formatMinutes(sla.prep_p90_min)}`} />
      <Stat
        label="Accepted by shop"
        value={`${acceptedRate.toFixed(1)}%`}
        hint={`${sla.accepted.toLocaleString()} of ${sla.received.toLocaleString()} received`}
      />
      <Stat
        label="Cancelled before accept"
        value={cancelledBeforeAccept.toLocaleString()}
        hint="Received by cassa, never accepted"
      />
    </div>
  );
}
