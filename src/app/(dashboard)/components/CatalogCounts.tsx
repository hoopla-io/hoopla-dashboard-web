import type { DashboardStats } from "@/lib/api/schemas/analytics";
import { Tile } from "@/app/(dashboard)/components/PeriodKpis";

export function CatalogCounts({ counts }: { counts: DashboardStats["counts"] }) {
  const tiles = [
    { label: "Users", value: counts.users, href: "/users" },
    { label: "Partners", value: counts.partners.total, footer: `${counts.partners.active} active`, href: "/partners" },
    { label: "Shops", value: counts.shops.total, footer: `${counts.shops.active} active`, href: "/shops" },
    { label: "Products", value: counts.products, href: "/products" },
    { label: "Stories", value: counts.stories.total, footer: `${counts.stories.active} active`, href: "/stories" },
    { label: "Banners", value: counts.banners.total, footer: `${counts.banners.active} active`, href: "/banners" },
    { label: "Shop categories", value: counts.shop_categories.total, footer: `${counts.shop_categories.active} active`, href: "/shop-categories" },
    { label: "In-app notifications", value: counts.notifications, href: "/notifications" },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
      {tiles.map((t) => (
        <Tile key={t.label} label={t.label} value={t.value.toLocaleString()} footer={t.footer} href={t.href} />
      ))}
    </div>
  );
}
