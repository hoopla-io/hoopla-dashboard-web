export interface BarListItem {
  label: string;
  value: number;
  detail?: string;
}

export function BarList({ items, emptyText = "Нет данных за этот период" }: { items: BarListItem[]; emptyText?: string }) {
  if (items.length === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium">{item.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {item.value.toLocaleString("ru-RU")}
              {item.detail ? ` · ${item.detail}` : ""}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-chart-1"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
