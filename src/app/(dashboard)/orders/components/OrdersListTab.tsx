import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { ExternalLink, ReceiptText, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useTableSort } from "@/hooks/use-table-sort";
import { ordersApi } from "@/lib/api/domains/orders";
import { getApiErrorMessage } from "@/lib/api/error";
import type { Order } from "@/lib/api/schemas/orders";
import { orderStatusTone, formatOrderStatus } from "@/lib/order-status";
import { formatOrderSource, orderSourceVariant } from "@/lib/order-source";
import { formatSomUZS } from "@/lib/money";
import { OrderDetailSheet } from "@/components/orders/OrderDetailSheet";
import { OrdersSummaryCards } from "@/app/(dashboard)/orders/components/OrdersSummaryCards";
import type { OrdersFiltersState } from "@/app/(dashboard)/orders/hooks/useOrdersFilters";

const formatPrice = (price?: number) => formatSomUZS(price);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("ru-RU");
};

export function OrdersListTab({ filters }: { filters: OrdersFiltersState }) {
  const queryClient = useQueryClient();
  const { page: currentPage, setPage: setCurrentPage } = filters;
  const [perPage, setPerPage] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [itemsDialogOrder, setItemsDialogOrder] = useState<Order | null>(null);
  const [openOrderId, setOpenOrderId] = useQueryState("order", parseAsInteger);
  const { sort, order, onSort, sortParam, orderParam } = useTableSort(() =>
    setCurrentPage(1)
  );

  const { data: ordersData, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders", currentPage, perPage, filters.listParams, sortParam, orderParam],
    queryFn: () =>
      ordersApi.getAll({
        ...filters.listParams,
        page: currentPage,
        limit: perPage,
        sort: sortParam,
        order: orderParam,
      }),
  });

  const orders = ordersData?.data || [];
  const totalPages = ordersData?.meta?.totalPages || 1;

  const fiscalizeMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.fiscalize(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Фискализация запрошена");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Не удалось фискализировать заказ")),
  });

  return (
    <div className="space-y-6">
      {isError ? null : <OrdersSummaryCards summary={ordersData?.meta?.summary} />}

      <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead column="id" sort={sort} order={order} onSort={onSort}>
                Заказ
              </SortableTableHead>
              <TableHead>Пользователь</TableHead>
              <TableHead>Товар</TableHead>
              <SortableTableHead column="price" sort={sort} order={order} onSort={onSort}>
                Цена
              </SortableTableHead>
              <TableHead>Промокод</TableHead>
              <TableHead>Заведение</TableHead>
              <SortableTableHead column="source" sort={sort} order={order} onSort={onSort}>
                Источник
              </SortableTableHead>
              <SortableTableHead column="created_at" sort={sort} order={order} onSort={onSort}>
                Время
              </SortableTableHead>
              <SortableTableHead column="updated_at" sort={sort} order={order} onSort={onSort}>
                Обновлён
              </SortableTableHead>
              <TableHead>Отзыв</TableHead>
              <SortableTableHead column="status" sort={sort} order={order} onSort={onSort}>
                Статус
              </SortableTableHead>
              <TableHead>Расчёт</TableHead>
              <TableHead className="text-center">Чек</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={13} className="py-10 text-center text-sm text-muted-foreground">
                  Загрузка…
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={13} className="py-10 text-center">
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Не удалось загрузить заказы. Проверьте подключение и попробуйте ещё раз.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      Повторить
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="p-0">
                  <EmptyState
                    title="Заказы не найдены"
                    description={
                      filters.hasFilters
                        ? "Попробуйте изменить или сбросить фильтры."
                        : "Заказы появятся здесь, как только поступят."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order: Order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs tabular-nums">
                    <button
                      type="button"
                      className="underline-offset-2 hover:underline"
                      onClick={() => setOpenOrderId(order.id)}
                    >
                      #{order.id}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{order.user?.name || "—"}</span>
                      <span className="text-xs text-muted-foreground">
                        {order.user?.phone_number}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.items && order.items.length > 1 ? (
                      <button
                        type="button"
                        className="underline-offset-2 hover:underline"
                        onClick={() => setItemsDialogOrder(order)}
                      >
                        {order.drink?.name || `Позиций: ${order.items.length}`}
                      </button>
                    ) : (
                      order.drink?.name || "—"
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums">
                    {formatPrice(order.price)}{" "}
                    <span className="text-xs text-muted-foreground">сум</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {order.promo_code || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.shop ? (
                      <Link
                        to={`/shops/${order.shop.id}`}
                        className="text-foreground underline-offset-2 hover:underline"
                      >
                        {order.shop.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={orderSourceVariant(order.source)}>
                      {formatOrderSource(order.source)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(order.time)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(order.last_update)}
                  </TableCell>
                  <TableCell>
                    {order.feedback ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 text-xs text-foreground">
                          <Star className="size-3 fill-foreground text-foreground" />
                          {order.feedback.rating}/5
                        </span>
                        {order.feedback.comment && (
                          <span
                            className="max-w-[140px] truncate text-xs text-muted-foreground"
                            title={order.feedback.comment}
                          >
                            {order.feedback.comment}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={formatOrderStatus(order.status)}
                      tone={orderStatusTone[order.status] ?? "neutral"}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={order.settlement_paid ? "Рассчитан" : "Не рассчитан"}
                      tone={order.settlement_paid ? "success" : "neutral"}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    {order.status === "completed" && (order.fiscal_link?.trim() ? (
                      <Button asChild variant="outline" size="icon-sm" title="Открыть фискальный чек">
                        <a
                          href={order.fiscal_link.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Открыть фискальный чек"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => fiscalizeMutation.mutate(order.id)}
                        disabled={fiscalizeMutation.isPending}
                        title="Фискализировать заказ"
                        aria-label="Фискализировать заказ"
                      >
                        <ReceiptText className="size-4" />
                      </Button>
                    ))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setCurrentPage(p)}
          perPage={perPage}
          onPerPageChange={(n) => {
            setPerPage(n);
            setCurrentPage(1);
          }}
          isLoading={isLoading}
        />
      </DataTableShell>

      <Dialog
        open={!!itemsDialogOrder}
        onOpenChange={(open) => {
          if (!open) setItemsDialogOrder(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Позиции заказа #{itemsDialogOrder?.id}</DialogTitle>
            <DialogDescription>Состав этого заказа.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {itemsDialogOrder?.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {formatPrice(item.price * item.quantity)} сум
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <OrderDetailSheet orderId={openOrderId} onClose={() => setOpenOrderId(null)} />
    </div>
  );
}
