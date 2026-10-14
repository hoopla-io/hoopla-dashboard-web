import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsString } from "nuqs";
import { DateRangePicker } from "@/components/pickers/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsApi } from "@/lib/api/domains/analytics";
import { formatSomUZS } from "@/lib/money";
import { GenderChart } from "@/app/(dashboard)/partners/[id]/components/analytics/GenderChart";
import { AgeChart } from "@/app/(dashboard)/partners/[id]/components/analytics/AgeChart";
import { TopBarList } from "@/app/(dashboard)/partners/[id]/components/analytics/TopBarList";
import { DailyOrdersChart } from "@/app/(dashboard)/partners/[id]/components/analytics/DailyOrdersChart";
import { HourlyChart } from "@/app/(dashboard)/partners/[id]/components/analytics/HourlyChart";
import { OperatorsChart } from "@/app/(dashboard)/partners/[id]/components/analytics/OperatorsChart";
import { LoyaltyCard } from "@/app/(dashboard)/partners/[id]/components/analytics/LoyaltyCard";

interface AnalyticsTabProps {
  partnerId: number;
}

interface StatCardProps {
  label: string;
  value: string;
}

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function AnalyticsTab({ partnerId }: AnalyticsTabProps) {
  const [from, setFrom] = useQueryState("analytics_from", parseAsString.withDefault(""));
  const [to, setTo] = useQueryState("analytics_to", parseAsString.withDefault(""));

  const { data, isLoading, isError } = useQuery({
    queryKey: ["partner-analytics", partnerId, from, to],
    queryFn: () => analyticsApi.getByPartner(partnerId, { from: from || undefined, to: to || undefined }),
    enabled: !!partnerId,
  });

  const picker = (
    <DateRangePicker
      from={from}
      to={to}
      emptyLabel="Этот месяц"
      onChange={(f, t) => {
        setFrom(f);
        setTo(t);
      }}
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {picker}
        <div className="p-8 text-center text-muted-foreground">Загрузка аналитики…</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        {picker}
        <div className="p-8 text-center text-destructive">Не удалось загрузить аналитику</div>
      </div>
    );
  }

  const totalRevenue = data.daily.reduce((sum, point) => sum + point.revenue, 0);
  const totalOrders = data.daily.reduce((sum, point) => sum + point.orders, 0);
  const medianFulfillment =
    data.fulfillment.median_minutes === null ? "—" : `${data.fulfillment.median_minutes.toFixed(1)} мин`;
  const returningShare =
    data.unique_users > 0 ? Math.round((data.loyalty.returning_users / data.unique_users) * 100) : 0;

  return (
    <div className="space-y-6">
      {picker}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Уникальные клиенты" value={data.unique_users.toLocaleString("ru-RU")} />
        <StatCard label="Выполненные заказы" value={totalOrders.toLocaleString("ru-RU")} />
        <StatCard label="Выручка" value={`${formatSomUZS(totalRevenue)} сум`} />
        <StatCard label="Медианное время выполнения" value={medianFulfillment} />
        <StatCard
          label="Вернувшиеся клиенты"
          value={`${data.loyalty.returning_users.toLocaleString("ru-RU")} (${returningShare}%)`}
        />
        <StatCard label="Период" value={`${data.from} — ${data.to}`} />
      </div>

      <ChartCard title="Заказы по дням">
        <DailyOrdersChart data={data.daily} />
      </ChartCard>

      <ChartCard title="Заказы по часам (Ташкент)">
        <HourlyChart data={data.hourly} />
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Клиенты по операторам">
          <OperatorsChart data={data.operators} />
        </ChartCard>
        <ChartCard title="Лояльность клиентов">
          <LoyaltyCard data={data.loyalty} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Клиенты по полу">
          <GenderChart data={data.gender} />
        </ChartCard>
        <ChartCard title="Клиенты по возрасту">
          <AgeChart data={data.age} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Топ товаров">
          <TopBarList data={data.top_drinks} />
        </ChartCard>
        <ChartCard title="Топ категорий">
          <TopBarList data={data.top_categories} />
        </ChartCard>
      </div>
    </div>
  );
}
