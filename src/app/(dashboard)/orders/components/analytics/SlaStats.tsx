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
        За этот период нет событий кассы. Скорость отслеживается только для заказов, прошедших через кассу Hoopla.
      </p>
    );
  }

  const acceptedRate = (sla.accepted / sla.received) * 100;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <Stat label="Время принятия (медиана)" value={formatSeconds(sla.accept_median_sec)} hint={`90% за ${formatSeconds(sla.accept_p90_sec)}`} />
      <Stat label="Время приготовления (медиана)" value={formatMinutes(sla.prep_median_min)} hint={`90% за ${formatMinutes(sla.prep_p90_min)}`} />
      <Stat
        label="Принято заведением"
        value={`${acceptedRate.toFixed(1)}%`}
        hint={`${sla.accepted.toLocaleString("ru-RU")} из ${sla.received.toLocaleString("ru-RU")} полученных`}
      />
      <Stat
        label="Отменено до принятия"
        value={cancelledBeforeAccept.toLocaleString("ru-RU")}
        hint="Получены кассой, но не приняты"
      />
    </div>
  );
}
