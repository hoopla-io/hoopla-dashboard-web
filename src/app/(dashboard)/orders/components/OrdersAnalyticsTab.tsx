import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsApi, type OrdersAnalyticsParams } from "@/lib/api/domains/analytics";
import { formatSomUZS } from "@/lib/money";
import type { ChannelMetric } from "@/lib/api/schemas/analytics";
import { KpiTiles } from "@/app/(dashboard)/orders/components/analytics/KpiTiles";
import { DailyStatusChart } from "@/app/(dashboard)/orders/components/analytics/DailyStatusChart";
import { HoursHeatmap } from "@/app/(dashboard)/orders/components/analytics/HoursHeatmap";
import { BarList } from "@/app/(dashboard)/orders/components/analytics/BarList";
import { SlaStats } from "@/app/(dashboard)/orders/components/analytics/SlaStats";
import { ShopsTable } from "@/app/(dashboard)/orders/components/analytics/ShopsTable";
import { PromoSection } from "@/app/(dashboard)/orders/components/analytics/PromoSection";
import { RetentionSection } from "@/app/(dashboard)/orders/components/analytics/RetentionSection";

const REASON_LABELS: Record<string, string> = {
  out_of_stock: "Нет в наличии",
  customer_request: "По просьбе клиента",
  closing_soon: "Скоро закрытие",
  other: "Другое",
  not_recorded: "Причина не указана",
};

const CHANNEL_LABELS: Record<string, string> = {
  unknown: "Не указано",
  rahmat: "Rahmat",
  eight: "Eight",
  counter: "На кассе",
  hoopla: "Hoopla",
  onecafe: "OneCafe",
  kiosk: "Киоск",
  poster: "Poster",
  iiko: "iiko",
  loyverse: "Loyverse",
  clopos: "Clopos",
};

const channelItems = (rows: ChannelMetric[]) =>
  rows.map((r) => ({
    label: CHANNEL_LABELS[r.label] ?? r.label,
    value: r.orders,
    detail: `${formatSomUZS(r.revenue)} сум`,
  }));

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function OrdersAnalyticsTab({ params }: { params: OrdersAnalyticsParams }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders-analytics", params],
    queryFn: () => analyticsApi.getOrders(params),
  });

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[92px] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-sm text-muted-foreground">Не удалось загрузить аналитику. Попробуйте ещё раз.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Повторить
        </Button>
      </div>
    );
  }

  const cancelled = data.current.statuses.find((s) => s.status === "cancelled")?.orders ?? 0;
  const abandoned = data.current.statuses.find((s) => s.status === "pending_payment")?.orders ?? 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {data.from} — {data.to} · по сравнению с {data.previous_from} — {data.previous_to}
      </p>

      <KpiTiles current={data.current} previous={data.previous} />

      <Section title="Заказы по дням" description="Выполненные и отменённые заказы. Наведите на столбец, чтобы увидеть выручку за день.">
        <DailyStatusChart data={data.daily} />
      </Section>

      <Section title="Промокоды" description="Заказы с промокодом в сравнении с остальными.">
        <PromoSection split={data.promo_split} discount={data.promo_discount} codes={data.promo_codes} />
      </Section>

      <Section title="Удержание клиентов" description="Кто возвращается и как быстро.">
        <RetentionSection
          retention={data.retention}
          cohorts={data.cohorts}
          uniqueCustomers={data.current.unique_customers}
          periodEnd={data.to}
        />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Причины отмены заказов"
          description={`Отменено: ${cancelled.toLocaleString("ru-RU")} · Не оплачено: ${abandoned.toLocaleString("ru-RU")}`}
        >
          <BarList
            items={data.cancel_reasons.map((r) => ({
              label: REASON_LABELS[r.reason] ?? r.reason,
              value: r.orders,
            }))}
            emptyText="За этот период отмен нет"
          />
        </Section>
        <Section title="Скорость заведений" description="По событиям кассы: получен → принят → выполнен.">
          <SlaStats sla={data.sla} cancelledBeforeAccept={data.cancelled_before_accept} />
        </Section>
      </div>

      <Section title="Часы пик" description="Выполненные заказы по дням недели и часам, время Ташкента.">
        <HoursHeatmap data={data.heatmap} />
      </Section>

      <Section title="Заведения" description="Топ-20 заведений по выручке за период.">
        <ShopsTable shops={data.shops} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Популярные товары" description="Выполненные заказы с этим товаром.">
          <BarList
            items={data.top_products.map((p) => ({
              label: p.name,
              value: p.orders,
              detail: `${formatSomUZS(p.revenue)} сум`,
            }))}
          />
        </Section>
        <div className="space-y-6">
          <Section title="Платёжный провайдер">
            <BarList items={channelItems(data.payments)} />
          </Section>
          <Section title="Источник и кассовая система">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Источник</p>
                <BarList items={channelItems(data.sources)} />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Кассовая система</p>
                <BarList items={channelItems(data.vendors)} />
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
