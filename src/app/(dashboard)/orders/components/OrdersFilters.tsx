import { useQuery } from "@tanstack/react-query";
import { Building2, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "@/components/ui/search-input";
import { DateRangePicker } from "@/components/pickers/date-range-picker";
import { PageToolbar } from "@/components/layout/page-toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { partnersApi } from "@/lib/api/domains/partners";
import { shopsApi } from "@/lib/api/domains/shops";
import { ORDER_STATUSES, formatOrderStatus } from "@/lib/order-status";
import { ORDER_SOURCES, formatOrderSource } from "@/lib/order-source";
import type { OrdersFiltersState } from "@/app/(dashboard)/orders/hooks/useOrdersFilters";

interface OrdersFiltersProps {
  filters: OrdersFiltersState;
  showListFilters: boolean;
}

export function OrdersFilters({ filters, showListFilters }: OrdersFiltersProps) {
  const { data: partners = [] } = useQuery({
    queryKey: ["partners", "for-orders-filter"],
    queryFn: async () => {
      const first = await partnersApi.getAll({ page: 1, limit: 100 });
      const totalPages = first.meta?.totalPages ?? 1;
      let all = first.data ?? [];
      for (let p = 2; p <= totalPages; p++) {
        const next = await partnersApi.getAll({ page: p, limit: 100 });
        all = all.concat(next.data ?? []);
      }
      return all;
    },
  });

  const { data: partnerShops = [] } = useQuery({
    queryKey: ["shops", "by-partner", filters.partnerId],
    queryFn: () => shopsApi.getByPartner(filters.partnerId!),
    enabled: !!filters.partnerId,
  });

  return (
    <PageToolbar className="flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-end">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker from={filters.from} to={filters.to} onChange={filters.setRange} />

          <Select
            value={filters.partnerId ? String(filters.partnerId) : "all"}
            onValueChange={(val) => filters.setPartnerId(val === "all" ? null : Number(val))}
          >
            <SelectTrigger size="sm" className="w-52">
              <Building2 className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все партнёры</SelectItem>
              {partners.map((partner) => (
                <SelectItem key={partner.id} value={String(partner.id)}>
                  {partner.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.shopId ? String(filters.shopId) : "all"}
            onValueChange={(val) => filters.setShopId(val === "all" ? null : Number(val))}
            disabled={!filters.partnerId}
          >
            <SelectTrigger size="sm" className="w-52">
              <Store className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все заведения</SelectItem>
              {partnerShops.map((shop) => (
                <SelectItem key={shop.id} value={String(shop.id)}>
                  {shop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.source}
            onValueChange={(val) => filters.setSource(val === "all" ? null : val)}
          >
            <SelectTrigger size="sm" className="w-44">
              <span className="text-muted-foreground">Источник:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все</SelectItem>
              {ORDER_SOURCES.map((source) => (
                <SelectItem key={source} value={source}>
                  {formatOrderSource(source)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showListFilters && (
            <>
              <Select
                value={filters.status}
                onValueChange={(val) => filters.setStatus(val === "all" ? null : val)}
              >
                <SelectTrigger size="sm" className="w-52">
                  <span className="text-muted-foreground">Статус:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatOrderStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.isPaid}
                onValueChange={(val) => filters.setIsPaid(val === "all" ? null : val)}
              >
                <SelectTrigger size="sm" className="w-48">
                  <span className="text-muted-foreground">Оплачен клиентом:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="true">Да</SelectItem>
                  <SelectItem value="false">Нет</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.payment}
                onValueChange={(val) => filters.setPayment(val === "all" ? null : val)}
              >
                <SelectTrigger size="sm" className="w-52">
                  <span className="text-muted-foreground">Расчёт:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="paid">Рассчитан</SelectItem>
                  <SelectItem value="not_paid">Не рассчитан</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        {showListFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={filters.search}
              onChange={filters.setSearch}
              placeholder="Телефон клиента…"
              className="w-52"
            />
            <SearchInput
              value={filters.drink}
              onChange={filters.setDrink}
              placeholder="Поиск по товару…"
              className="w-52"
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={filters.includeTest}
            onCheckedChange={(checked) => filters.setIncludeTest(checked === true ? true : null)}
          />
          Включить тестовых партнёров
        </label>
        <Button variant="outline" size="sm" onClick={filters.clear} disabled={!filters.hasFilters}>
          Сбросить фильтры
        </Button>
      </div>
    </PageToolbar>
  );
}
