import type { OrderDetail } from "@/lib/api/schemas/orders";
import { formatOrderStatus } from "@/lib/order-status";

const EVENT_LABELS: Record<string, string> = {
  "order.received": "Получен кассой",
  "order.accepted": "Принят",
  "order.paid": "Оплачен",
  "order.completed": "Выполнен",
  "order.cancelled": "Отменён",
  "order.status_changed": "Статус изменён",
};

const REASON_LABELS: Record<string, string> = {
  out_of_stock: "Нет в наличии",
  customer_request: "По просьбе клиента",
  closing_soon: "Скоро закрытие",
  other: "Другое",
};

interface TimelineEntry {
  key: string;
  at: string;
  title: string;
  lines: string[];
}

const formatTime = (value: string) => new Date(value).toLocaleString("ru-RU");

const asText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

function describeReason(raw: string): string {
  const [code, ...rest] = raw.split(":");
  const label = REASON_LABELS[code.trim()];
  const note = rest.join(":").trim();
  if (!label) return raw;
  return note ? `${label}: ${note}` : label;
}

function buildEntries(order: OrderDetail): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    { key: "placed", at: order.placed_at, title: "Оформлен клиентом", lines: [] },
  ];

  for (const event of order.timeline) {
    const details = event.details ?? {};
    const lines: string[] = [];
    const by = asText(details.by);
    const admin = asText(details.admin);
    const reason = asText(details.reason);
    const from = asText(details.from);
    const to = asText(details.to);

    let title = EVENT_LABELS[event.type] ?? event.type;
    if (by === "dashboard") {
      title = from && to ? `${formatOrderStatus(from)} → ${formatOrderStatus(to)}` : title;
      lines.push(`${admin || "Администратор"} в панели управления`);
    } else if (event.staff_name) {
      lines.push(`Сотрудник: ${event.staff_name}`);
    }
    if (reason) lines.push(describeReason(reason));

    entries.push({ key: `e-${event.id}`, at: event.at, title, lines });
  }

  const hasCompletedEvent = order.timeline.some((e) => e.type === "order.completed");
  if (order.completed_at && !hasCompletedEvent) {
    entries.push({ key: "completed", at: order.completed_at, title: "Выполнен", lines: [] });
  }

  return entries.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export function OrderTimeline({ order }: { order: OrderDetail }) {
  const entries = buildEntries(order);
  const start = new Date(entries[0]?.at ?? order.placed_at).getTime();

  return (
    <ol className="relative space-y-4 border-l pl-5">
      {entries.map((entry) => {
        const minutes = (new Date(entry.at).getTime() - start) / 60000;
        return (
          <li key={entry.key} className="relative">
            <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-background bg-foreground/60" />
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium">{entry.title}</p>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {entry.key === "placed" || minutes > 180 ? formatTime(entry.at) : `+${minutes.toFixed(1)} мин`}
              </span>
            </div>
            {entry.lines.map((line) => (
              <p key={line} className="text-xs text-muted-foreground">
                {line}
              </p>
            ))}
          </li>
        );
      })}
      {order.timeline.length === 0 && (
        <li className="text-xs text-muted-foreground">
          Нет событий кассы. Этот заказ не проходил через кассу Hoopla.
        </li>
      )}
    </ol>
  );
}
