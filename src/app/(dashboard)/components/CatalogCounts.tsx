import type { DashboardStats } from "@/lib/api/schemas/analytics";
import { Tile } from "@/app/(dashboard)/components/PeriodKpis";

export function CatalogCounts({ counts }: { counts: DashboardStats["counts"] }) {
  const tiles = [
    { label: "Пользователи", value: counts.users, href: "/users" },
    { label: "Партнёры", value: counts.partners.total, footer: `Активные: ${counts.partners.active}`, href: "/partners" },
    { label: "Заведения", value: counts.shops.total, footer: `Активные: ${counts.shops.active}`, href: "/shops" },
    { label: "Товары", value: counts.products, href: "/products" },
    { label: "Истории", value: counts.stories.total, footer: `Активные: ${counts.stories.active}`, href: "/stories" },
    { label: "Баннеры", value: counts.banners.total, footer: `Активные: ${counts.banners.active}`, href: "/banners" },
    { label: "Категории заведений", value: counts.shop_categories.total, footer: `Активные: ${counts.shop_categories.active}`, href: "/shop-categories" },
    { label: "Уведомления в приложении", value: counts.notifications, href: "/notifications" },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
      {tiles.map((t) => (
        <Tile key={t.label} label={t.label} value={t.value.toLocaleString("ru-RU")} footer={t.footer} href={t.href} />
      ))}
    </div>
  );
}
