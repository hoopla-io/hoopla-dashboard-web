"use client";

import {
  Building2,
  Store,
  ShoppingCart,
  Users,
  BookOpen,
  LayoutPanelTop,
  Bell,
  Coffee,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: partners } = useQuery({
    queryKey: ["partners"],
    queryFn: () => partnersApi.getAll(),
  });

  const { data: shops } = useQuery({
    queryKey: ["shops"],
    queryFn: () => shopsApi.getAll(),
  });

  const { data: orders } = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersApi.getAll(),
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.getAll(),
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
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getAll(),
  });

  const { data: drinks } = useQuery({
    queryKey: ["drinks"],
    queryFn: () => drinksApi.getAll(),
  });

  const { data: shopCategories } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: () => shopCategoriesApi.getAll(),
  });

  const getTotal = (res?: { data?: unknown[]; meta?: { totalItems?: number } | null } | null) =>
    res?.meta?.totalItems ?? res?.data?.length ?? 0;

  const activeStories = stories?.data?.filter((s) => s.is_active).length ?? 0;
  const activeBanners = banners?.data?.filter((b) => b.is_active).length ?? 0;
  const activeCategories = shopCategories?.data?.filter((c) => c.is_active).length ?? 0;

  const primaryStats = [
    {
      name: "Users",
      value: getTotal(users),
      icon: Users,
      href: "/users",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      name: "Partners",
      value: getTotal(partners),
      icon: Building2,
      href: "/partners",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      name: "Shops",
      value: getTotal(shops),
      icon: Store,
      href: "/shops",
      gradient: "from-emerald-500 to-green-600",
    },
    {
      name: "Orders",
      value: getTotal(orders),
      icon: ShoppingCart,
      href: "/orders",
      gradient: "from-orange-500 to-amber-600",
    },
  ];

  const contentStats = [
    {
      name: "Stories",
      total: getTotal(stories),
      active: activeStories,
      icon: BookOpen,
      href: "/stories",
      color: "bg-pink-500/10 text-pink-500",
    },
    {
      name: "Banners",
      total: getTotal(banners),
      active: activeBanners,
      icon: LayoutPanelTop,
      href: "/banners",
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      name: "Notifications",
      total: getTotal(notifications),
      active: null,
      icon: Bell,
      href: "/notifications",
      color: "bg-sky-500/10 text-sky-500",
    },
    {
      name: "Drinks",
      total: getTotal(drinks),
      active: null,
      icon: Coffee,
      href: "/drinks",
      color: "bg-rose-500/10 text-rose-500",
    },
    {
      name: "Categories",
      total: getTotal(shopCategories),
      active: activeCategories,
      icon: LayoutGrid,
      href: "/shop-categories",
      color: "bg-teal-500/10 text-teal-500",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary to-primary/80 px-6 py-8 md:px-8 md:py-10">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
            Welcome back{user?.name ? `, ${user.name}` : ""}!
          </h1>
          <p className="mt-1.5 text-primary-foreground/70 text-sm md:text-base">
            Here&apos;s what&apos;s happening with your platform today.
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -right-2 top-8 h-20 w-20 rounded-full bg-white/5" />
        <div className="absolute right-20 -bottom-4 h-16 w-16 rounded-full bg-white/5" />
      </div>

      {/* Primary Stats - Gradient Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {primaryStats.map((stat) => (
          <Link key={stat.name} href={stat.href} className="group">
            <div className={`relative overflow-hidden rounded-xl bg-linear-to-br ${stat.gradient} p-5 transition-transform hover:scale-[1.02] active:scale-[0.98]`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold text-white">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white/80">
                    {stat.name}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              {/* Decorative */}
              <div className="absolute -bottom-3 -right-3 h-16 w-16 rounded-full bg-white/10" />
            </div>
          </Link>
        ))}
      </div>

      {/* Content & Engagement Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Content & Engagement</h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {contentStats.map((stat) => (
            <Link key={stat.name} href={stat.href} className="group flex">
              <div className="flex flex-col flex-1 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold">{stat.total}</span>
                  {stat.active !== null && (
                    <span className="text-xs font-medium text-emerald-500">
                      {stat.active} active
                    </span>
                  )}
                </div>
                <div className="mt-auto pt-3">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: stat.active !== null && stat.total > 0 ? `${Math.min((stat.active / stat.total) * 100, 100)}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
