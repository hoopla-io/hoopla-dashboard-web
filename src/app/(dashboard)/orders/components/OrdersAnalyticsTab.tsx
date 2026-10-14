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
  out_of_stock: "Out of stock",
  customer_request: "Customer request",
  closing_soon: "Closing soon",
  other: "Other",
  not_recorded: "No reason recorded",
};

const CHANNEL_LABELS: Record<string, string> = {
  unknown: "Not recorded",
  rahmat: "Rahmat",
  eight: "Eight",
  counter: "At counter",
  hoopla: "Hoopla",
  onecafe: "OneCafe",
  kiosk: "Kiosk",
  poster: "Poster",
  iiko: "iiko",
  loyverse: "Loyverse",
  clopos: "Clopos",
};

const channelItems = (rows: ChannelMetric[]) =>
  rows.map((r) => ({
    label: CHANNEL_LABELS[r.label] ?? r.label,
    value: r.orders,
    detail: `${formatSomUZS(r.revenue)} UZS`,
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
        <p className="text-sm text-muted-foreground">Couldn't load analytics. Try again.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const cancelled = data.current.statuses.find((s) => s.status === "cancelled")?.orders ?? 0;
  const abandoned = data.current.statuses.find((s) => s.status === "pending_payment")?.orders ?? 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {data.from} — {data.to} · compared with {data.previous_from} — {data.previous_to}
      </p>

      <KpiTiles current={data.current} previous={data.previous} />

      <Section title="Orders per day" description="Completed and cancelled orders. Hover a bar for that day's revenue.">
        <DailyStatusChart data={data.daily} />
      </Section>

      <Section title="Promo codes" description="Orders placed with a promo code compared with the rest.">
        <PromoSection split={data.promo_split} discount={data.promo_discount} codes={data.promo_codes} />
      </Section>

      <Section title="Customer retention" description="Who comes back, and how fast.">
        <RetentionSection
          retention={data.retention}
          cohorts={data.cohorts}
          uniqueCustomers={data.current.unique_customers}
          periodEnd={data.to}
        />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Why orders are cancelled"
          description={`${cancelled.toLocaleString()} cancelled · ${abandoned.toLocaleString()} left unpaid`}
        >
          <BarList
            items={data.cancel_reasons.map((r) => ({
              label: REASON_LABELS[r.reason] ?? r.reason,
              value: r.orders,
            }))}
            emptyText="No cancellations in this period"
          />
        </Section>
        <Section title="Shop speed" description="From cassa events: received → accepted → completed.">
          <SlaStats sla={data.sla} cancelledBeforeAccept={data.cancelled_before_accept} />
        </Section>
      </div>

      <Section title="Busiest hours" description="Completed orders by weekday and hour, Tashkent time.">
        <HoursHeatmap data={data.heatmap} />
      </Section>

      <Section title="Shops" description="Top 20 shops by revenue in this period.">
        <ShopsTable shops={data.shops} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Top products" description="Completed orders containing the product.">
          <BarList
            items={data.top_products.map((p) => ({
              label: p.name,
              value: p.orders,
              detail: `${formatSomUZS(p.revenue)} UZS`,
            }))}
          />
        </Section>
        <div className="space-y-6">
          <Section title="Payment provider">
            <BarList items={channelItems(data.payments)} />
          </Section>
          <Section title="Source and POS">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Source</p>
                <BarList items={channelItems(data.sources)} />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">POS</p>
                <BarList items={channelItems(data.vendors)} />
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
