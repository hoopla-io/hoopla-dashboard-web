import type { CohortCell, Retention } from "@/lib/api/schemas/analytics";

const MONTH_OFFSETS = [0, 1, 2, 3, 4, 5];

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function monthsBetween(from: string, to: string) {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

function CohortTable({ cells, periodEnd }: { cells: CohortCell[]; periodEnd: string }) {
  const cohorts = Array.from(new Set(cells.map((c) => c.cohort))).sort();
  const byKey = new Map(cells.map((c) => [`${c.cohort}-${c.offset}`, c.users]));

  if (cohorts.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет выполненных заказов для построения когорт.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-separate border-spacing-[2px] text-xs">
        <thead>
          <tr className="text-muted-foreground">
            <th className="px-2 py-1 text-left font-medium">Первый заказ</th>
            <th className="px-2 py-1 text-right font-medium">Клиенты</th>
            {MONTH_OFFSETS.map((m) => (
              <th key={m} className="px-2 py-1 text-center font-medium">
                {m === 0 ? "Месяц 0" : `+${m}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => {
            const size = byKey.get(`${cohort}-0`) ?? 0;
            return (
              <tr key={cohort}>
                <td className="px-2 py-1.5 font-medium">{cohort}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{size.toLocaleString("ru-RU")}</td>
                {MONTH_OFFSETS.map((m) => {
                  if (m > monthsBetween(cohort, periodEnd)) {
                    return <td key={m} className="rounded-[3px] bg-muted/30" />;
                  }
                  const users = byKey.get(`${cohort}-${m}`) ?? 0;
                  const pct = size > 0 ? (users / size) * 100 : 0;
                  return (
                    <td
                      key={m}
                      title={`Заказали ${users} из ${size} клиентов`}
                      className="rounded-[3px] px-2 py-1.5 text-center tabular-nums"
                      style={{
                        backgroundColor: `color-mix(in oklch, var(--chart-1) ${Math.max(pct, 6)}%, transparent)`,
                        color: pct > 55 ? "white" : undefined,
                      }}
                    >
                      {pct.toFixed(0)}%
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">
        Каждая строка — месяц первого выполненного заказа клиента. Ячейки показывают долю этой группы, сделавшую заказ снова через указанное число месяцев.
      </p>
    </div>
  );
}

export function RetentionSection({ retention, cohorts, uniqueCustomers, periodEnd }: {
  retention: Retention;
  cohorts: CohortCell[];
  uniqueCustomers: number;
  periodEnd: string;
}) {
  const repeatShare = uniqueCustomers > 0 ? (retention.repeat_customers / uniqueCustomers) * 100 : 0;
  const within30 = retention.first_time_customers > 0
    ? (retention.second_order_within_30 / retention.first_time_customers) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Повторные клиенты"
          value={retention.repeat_customers.toLocaleString("ru-RU")}
          hint={`${repeatShare.toFixed(1)}% заказали 2+ раза за период`}
        />
        <Stat
          label="Новые клиенты"
          value={retention.first_time_customers.toLocaleString("ru-RU")}
          hint="Первый выполненный заказ в этом периоде"
        />
        <Stat
          label="Вернулись в течение 30 дней"
          value={`${within30.toFixed(1)}%`}
          hint={`${retention.second_order_within_30.toLocaleString("ru-RU")} из новых клиентов`}
        />
        <Stat
          label="Время до второго заказа"
          value={retention.median_days_to_second != null ? `${retention.median_days_to_second.toFixed(1)} дн.` : "—"}
          hint="Медиана по вернувшимся новым клиентам"
        />
      </div>
      <CohortTable cells={cohorts} periodEnd={periodEnd} />
    </div>
  );
}
