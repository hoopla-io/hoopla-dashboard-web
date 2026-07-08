import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
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
  const { data, isLoading, isError } = useQuery({
    queryKey: ["partner-analytics", partnerId],
    queryFn: () => analyticsApi.getByPartner(partnerId),
    enabled: !!partnerId,
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>;
  }

  if (isError || !data) {
    return <div className="p-8 text-center text-destructive">Failed to load analytics</div>;
  }

  const totalRevenue = data.daily.reduce((sum, point) => sum + point.revenue, 0);
  const totalOrders = data.daily.reduce((sum, point) => sum + point.orders, 0);
  const avgFulfillment =
    data.fulfillment.avg_minutes === null ? "—" : `${data.fulfillment.avg_minutes.toFixed(1)} min`;
  const returningShare =
    data.unique_users > 0 ? Math.round((data.loyalty.returning_users / data.unique_users) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Unique customers" value={data.unique_users.toLocaleString()} />
        <StatCard label="Completed orders" value={totalOrders.toLocaleString()} />
        <StatCard label="Revenue" value={`${formatSomUZS(totalRevenue)} UZS`} />
        <StatCard label="Avg fulfillment" value={avgFulfillment} />
        <StatCard
          label="Returning customers"
          value={`${data.loyalty.returning_users.toLocaleString()} (${returningShare}%)`}
        />
        <StatCard label="Period" value={`${data.from} — ${data.to}`} />
      </div>

      <ChartCard title="Daily orders">
        <DailyOrdersChart data={data.daily} />
      </ChartCard>

      <ChartCard title="Orders by hour (Tashkent)">
        <HourlyChart data={data.hourly} />
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Customers by operator">
          <OperatorsChart data={data.operators} />
        </ChartCard>
        <ChartCard title="Customer loyalty">
          <LoyaltyCard data={data.loyalty} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Customers by gender">
          <GenderChart data={data.gender} />
        </ChartCard>
        <ChartCard title="Customers by age">
          <AgeChart data={data.age} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Top drinks">
          <TopBarList data={data.top_drinks} />
        </ChartCard>
        <ChartCard title="Top categories">
          <TopBarList data={data.top_categories} />
        </ChartCard>
      </div>
    </div>
  );
}
