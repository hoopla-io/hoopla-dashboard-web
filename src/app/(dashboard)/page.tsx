import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { TriangleAlert } from "lucide-react";

import { analyticsApi } from "@/lib/api/domains/analytics";
import { useAuthStore } from "@/stores/auth-store";
import { PageHeader } from "@/components/layout/page-header";
import { PeriodKpis, Tile } from "@/app/(dashboard)/components/PeriodKpis";
import { CatalogCounts } from "@/app/(dashboard)/components/CatalogCounts";
import { RecentOrders } from "@/app/(dashboard)/components/RecentOrders";

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const today = useMemo(() => format(new Date(), "EEEE, MMMM d"), []);
  const todayParam = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const { data: stats, isError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: analyticsApi.getDashboardStats,
    refetchInterval: 60_000,
  });

  const weekFrom = stats ? stats.this_week.from.slice(0, 10) : todayParam;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={user?.name ? `${today} · Welcome back, ${user.name}.` : today}
      />

      {isError && (
        <p className="text-sm text-destructive">Couldn't load dashboard stats. They refresh every minute.</p>
      )}

      {stats ? (
        <>
          <section className="space-y-3">
            <SectionTitle title="Today" hint="Tashkent time, test partners excluded" />
            <PeriodKpis
              current={stats.today}
              previous={stats.yesterday}
              comparedTo="same time yesterday"
              ordersHref={`/orders?from=${todayParam}&to=${todayParam}`}
              extra={
                <Tile
                  label="In progress now"
                  value={stats.active_orders.total.toLocaleString()}
                  href="/orders?status=pending"
                  footer={
                    stats.active_orders.stuck > 0 ? (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <TriangleAlert className="size-3.5" />
                        {stats.active_orders.stuck} waiting over 30 min
                      </span>
                    ) : (
                      "None waiting over 30 min"
                    )
                  }
                />
              }
            />
          </section>

          <section className="space-y-3">
            <SectionTitle title="This week" hint="Since Monday" />
            <PeriodKpis
              current={stats.this_week}
              previous={stats.last_week}
              comparedTo="same point last week"
              ordersHref={`/orders?view=analytics&from=${weekFrom}&to=${todayParam}`}
              extra={
                <Tile
                  label="New users"
                  value={stats.this_week.new_users.toLocaleString()}
                  href="/users"
                  footer={`${stats.this_week.unique_customers.toLocaleString()} customers ordered`}
                />
              }
            />
          </section>

          <section className="space-y-3">
            <SectionTitle title="Platform" hint="Live counts" />
            <CatalogCounts counts={stats.counts} />
          </section>
        </>
      ) : (
        !isError && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[104px] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-foreground">Recent orders</h2>
            <Link
              to="/orders"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              View all
            </Link>
          </div>
          <RecentOrders />
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">Quick actions</h2>
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
            <Link
              to="/partners?action=create"
              className="text-sm text-foreground underline-offset-4 hover:underline"
            >
              Add a partner
            </Link>
            <Link
              to="/shops?action=create"
              className="text-sm text-foreground underline-offset-4 hover:underline"
            >
              Add a shop
            </Link>
            <Link
              to="/products?action=create"
              className="text-sm text-foreground underline-offset-4 hover:underline"
            >
              Add a product
            </Link>
            <Link
              to="/stories?action=create"
              className="text-sm text-foreground underline-offset-4 hover:underline"
            >
              Publish a story
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              Tip: press{" "}
              <kbd className="inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>{" "}
              from anywhere to jump.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
