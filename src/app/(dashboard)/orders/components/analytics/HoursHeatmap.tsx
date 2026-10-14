import type { HeatmapCell } from "@/lib/api/schemas/analytics";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

export function HoursHeatmap({ data }: { data: HeatmapCell[] }) {
  const byKey = new Map(data.map((c) => [`${c.weekday}-${c.hour}`, c.orders]));
  const max = Math.max(...data.map((c) => c.orders), 0);

  if (max === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        За этот период выполненных заказов нет
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid min-w-full grid-cols-[2.5rem_repeat(24,minmax(1.25rem,1fr))] gap-[2px] text-[10px] text-muted-foreground">
        <div />
        {HOURS.map((h) => (
          <div key={h} className="text-center tabular-nums">
            {h % 3 === 0 ? h : ""}
          </div>
        ))}
        {WEEKDAYS.map((day, i) => (
          <div key={day} className="contents">
            <div className="flex items-center text-xs">{day}</div>
            {HOURS.map((h) => {
              const orders = byKey.get(`${i + 1}-${h}`) ?? 0;
              const intensity = orders === 0 ? 0 : 12 + (orders / max) * 88;
              return (
                <div
                  key={h}
                  title={`${day} ${String(h).padStart(2, "0")}:00 — заказов: ${orders}`}
                  className="h-6 rounded-[3px] bg-muted/50"
                  style={
                    orders > 0
                      ? { backgroundColor: `color-mix(in oklch, var(--chart-1) ${intensity}%, transparent)` }
                      : undefined
                  }
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Меньше</span>
        <div
          className="h-2 w-24 rounded-full"
          style={{ background: "linear-gradient(to right, color-mix(in oklch, var(--chart-1) 12%, transparent), var(--chart-1))" }}
        />
        <span>Больше (макс. {max})</span>
      </div>
    </div>
  );
}
