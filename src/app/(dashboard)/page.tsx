import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";

import { partnersApi } from "@/lib/api/domains/partners";
import { shopsApi } from "@/lib/api/domains/shops";
import { ordersApi } from "@/lib/api/domains/orders";
import { usersApi } from "@/lib/api/domains/users";
import { storiesApi } from "@/lib/api/domains/stories";
import { bannersApi } from "@/lib/api/domains/banners";
import { notificationsApi } from "@/lib/api/domains/notifications";
import { drinksApi } from "@/lib/api/domains/drinks";
import { shopCategoriesApi } from "@/lib/api/domains/shop-categories";
import { useAuthStore } from "@/stores/auth-store";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

type ListResponse = { data?: unknown[]; meta?: { totalItems?: number } | null } | null | undefined;

const getTotal = (res: ListResponse) =>
  res?.meta?.totalItems ?? res?.data?.length ?? 0;

const statusTone: Record<string, StatusTone> = {
  pending_payment: "pending",
  pending: "warning",
  processing: "processing",
  completed: "success",
  cancelled: "danger",
};

const statusLabel: Record<string, string> = {
  pending_payment: "Awaiting payment",
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

type StatCellProps = {
  label: string;
  value: number;
  meta?: string;
  href: string;
};

function StatCell({ label, value, meta, href }: StatCellProps) {
  return (
    <Link
      to={href}
      className="group flex flex-col gap-1 bg-card p-5 transition-colors hover:bg-muted/40"
    >
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-3xl font-semibold tracking-tight tabular-nums text-foreground">
        {value.toLocaleString()}
      </span>
      {meta ? (
        <span className="text-xs text-muted-foreground">{meta}</span>
      ) : null}
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: partners } = useQuery({
    queryKey: ["dashboard-overview", "partners"],
    queryFn: () => partnersApi.getAll({ limit: 1 }),
  });
  const { data: shops } = useQuery({
    queryKey: ["dashboard-overview", "shops"],
    queryFn: () => shopsApi.getAll({ limit: 1 }),
  });
  const { data: orders } = useQuery({
    queryKey: ["dashboard-overview", "orders"],
    queryFn: () => ordersApi.getAll({ limit: 8 }),
  });
  const { data: users } = useQuery({
    queryKey: ["dashboard-overview", "users"],
    queryFn: () => usersApi.getAll({ limit: 1 }),
  });
  const { data: stories } = useQuery({
    queryKey: ["stories"],
    queryFn: () => storiesApi.getAll(),
  });
  const { data: banners } = useQuery({
    queryKey: ["banners"],
    queryFn: () => bannersApi.getAll(),
  });
  const { data: notifications } = useQuery({
    queryKey: ["dashboard-overview", "notifications"],
    queryFn: () => notificationsApi.getAll({ limit: 1 }),
  });
  const { data: drinks } = useQuery({
    queryKey: ["dashboard-overview", "drinks"],
    queryFn: () => drinksApi.getAll({ limit: 1 }),
  });
  const { data: shopCategories } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: () => shopCategoriesApi.getAll(),
  });

  const activeStories = stories?.data?.filter((s) => s.is_active).length ?? 0;
  const activeBanners = banners?.data?.filter((b) => b.is_active).length ?? 0;
  const activeCategories =
    shopCategories?.data?.filter((c) => c.is_active).length ?? 0;

  const today = useMemo(() => format(new Date(), "EEEE, MMMM d"), []);

  const recentOrders = (orders?.data ?? []).slice(0, 8);

  const primaryStats: StatCellProps[] = [
    { label: "Users", value: getTotal(users), href: "/users" },
    { label: "Partners", value: getTotal(partners), href: "/partners" },
    { label: "Shops", value: getTotal(shops), href: "/shops" },
    { label: "Orders", value: getTotal(orders), href: "/orders" },
  ];

  const contentStats: StatCellProps[] = [
    {
      label: "Stories",
      value: getTotal(stories),
      meta: `${activeStories} active`,
      href: "/stories",
    },
    {
      label: "Banners",
      value: getTotal(banners),
      meta: `${activeBanners} active`,
      href: "/banners",
    },
    {
      label: "Drinks",
      value: getTotal(drinks),
      href: "/drinks",
    },
    {
      label: "Categories",
      value: getTotal(shopCategories),
      meta: `${activeCategories} active`,
      href: "/shop-categories",
    },
    {
      label: "Notifications",
      value: getTotal(notifications),
      href: "/notifications",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={
          user?.name
            ? `${today} · Welcome back, ${user.name}.`
            : today
        }
      />

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-foreground">Overview</h2>
          <span className="text-xs text-muted-foreground">Across the platform</span>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
          {primaryStats.map((stat) => (
            <StatCell key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-foreground">Content & engagement</h2>
          <span className="text-xs text-muted-foreground">Live counts</span>
        </div>
        <div
          className={cn(
            "grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border",
            "md:grid-cols-3 lg:grid-cols-5"
          )}
        >
          {contentStats.map((stat) => (
            <StatCell key={stat.label} {...stat} />
          ))}
        </div>
      </section>

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
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {recentOrders.length === 0 ? (
              <div className="flex min-h-[200px] items-center justify-center px-6 py-10 text-center">
                <p className="text-xs text-muted-foreground">
                  No orders yet. New orders will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentOrders.map((order) => {
                  const tone = statusTone[order.status] ?? "neutral";
                  const label = statusLabel[order.status] ?? order.status;
                  const ts = order.time ? new Date(order.time) : null;
                  return (
                    <li key={order.id}>
                      <Link
                        to="/orders"
                        className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
                      >
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                          #{order.id}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-foreground">
                            {order.drink?.name ?? "Drink"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {order.shop?.name ?? "—"}
                            {order.user?.name ? ` · ${order.user.name}` : ""}
                          </p>
                        </div>
                        <StatusBadge label={label} tone={tone} />
                        <span className="hidden w-24 text-right text-xs text-muted-foreground sm:inline">
                          {ts ? formatDistanceToNow(ts, { addSuffix: true }) : "—"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
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
              to="/drinks?action=create"
              className="text-sm text-foreground underline-offset-4 hover:underline"
            >
              Add a drink
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
