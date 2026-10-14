import type { OrderDetail } from "@/lib/api/schemas/orders";
import { formatOrderStatus } from "@/lib/order-status";

const EVENT_LABELS: Record<string, string> = {
  "order.received": "Received by cassa",
  "order.accepted": "Accepted",
  "order.paid": "Paid",
  "order.completed": "Completed",
  "order.cancelled": "Cancelled",
  "order.status_changed": "Status changed",
};

const REASON_LABELS: Record<string, string> = {
  out_of_stock: "Out of stock",
  customer_request: "Customer request",
  closing_soon: "Closing soon",
  other: "Other",
};

interface TimelineEntry {
  key: string;
  at: string;
  title: string;
  lines: string[];
}

const formatTime = (value: string) => new Date(value).toLocaleString();

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
    { key: "placed", at: order.placed_at, title: "Placed by customer", lines: [] },
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
      lines.push(`By ${admin || "admin"} in the dashboard`);
    } else if (event.staff_name) {
      lines.push(`By ${event.staff_name}`);
    }
    if (reason) lines.push(describeReason(reason));

    entries.push({ key: `e-${event.id}`, at: event.at, title, lines });
  }

  const hasCompletedEvent = order.timeline.some((e) => e.type === "order.completed");
  if (order.completed_at && !hasCompletedEvent) {
    entries.push({ key: "completed", at: order.completed_at, title: "Completed", lines: [] });
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
                {entry.key === "placed" || minutes > 180 ? formatTime(entry.at) : `+${minutes.toFixed(1)} min`}
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
          No cassa events. This order was not routed through the Hoopla cassa.
        </li>
      )}
    </ol>
  );
}
