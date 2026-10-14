import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, ReceiptText, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useTableSort } from "@/hooks/use-table-sort";
import { ordersApi } from "@/lib/api/domains/orders";
import { getApiErrorMessage } from "@/lib/api/error";
import { formatSomUZS } from "@/lib/money";
import type { Order } from "@/lib/api/schemas/orders";
import { formatOrderSource } from "@/lib/order-source";
import { formatOrderStatus } from "@/lib/order-status";

interface OrdersTabProps {
  partnerId: number;
}

export function OrdersTab({ partnerId }: OrdersTabProps) {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [ordersFilter, setOrdersFilter] = useState("");
  const [itemsDialogOrder, setItemsDialogOrder] = useState<Order | null>(null);
  const { sort, order, onSort, sortParam, orderParam } = useTableSort(() => setCurrentPage(1));

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["partner_orders", partnerId, currentPage, perPage, ordersFilter, sortParam, orderParam],
    queryFn: () =>
      ordersApi.getAll({
        partner_id: partnerId,
        page: currentPage,
        limit: perPage,
        search: ordersFilter || undefined,
        sort: sortParam,
        order: orderParam,
      }),
    enabled: !!partnerId,
  });

  const orders = ordersData?.data || [];
  const totalPages = ordersData?.meta?.totalPages || 1;

  const fiscalizeMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.fiscalize(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner_orders", partnerId] });
      toast.success("Фискализация запрошена");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Не удалось фискализировать заказ")),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="max-w-sm w-full relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Фильтр заказов…"
            value={ordersFilter}
            onChange={(e) => {
              setOrdersFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Заказы</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="id" sort={sort} order={order} onSort={onSort}>
                    ID
                  </SortableTableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Заведение</TableHead>
                  <TableHead>Товар</TableHead>
                  <SortableTableHead column="price" sort={sort} order={order} onSort={onSort}>
                    Итого
                  </SortableTableHead>
                  <SortableTableHead column="source" sort={sort} order={order} onSort={onSort}>
                    Источник
                  </SortableTableHead>
                  <SortableTableHead column="status" sort={sort} order={order} onSort={onSort}>
                    Статус
                  </SortableTableHead>
                  <SortableTableHead column="created_at" sort={sort} order={order} onSort={onSort}>
                    Дата
                  </SortableTableHead>
                  <TableHead>Отзыв</TableHead>
                  <TableHead className="w-10 text-right">Чек</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingOrders ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-4">Загрузка заказов…</TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="p-0">
                      <EmptyState
                        title="Заказы не найдены"
                        description={
                          ordersFilter
                            ? "Попробуйте изменить или очистить поисковый запрос."
                            : "Здесь появятся заказы этого партнёра."
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>{order.user?.name || order.user?.phone_number || "-"}</TableCell>
                      <TableCell>
                        {order.shop ? (
                          <Link
                            to={`/shops/${order.shop.id}`}
                            className="text-foreground underline-offset-2 hover:underline"
                          >
                            {order.shop.name}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {order.items && order.items.length > 1 ? (
                          <button
                            type="button"
                            className="underline-offset-2 hover:underline"
                            onClick={() => setItemsDialogOrder(order)}
                          >
                            {order.drink?.name || `Позиций: ${order.items.length}`}
                          </button>
                        ) : (
                          order.drink?.name || "-"
                        )}
                      </TableCell>
                      <TableCell>{formatSomUZS(order.price)} сум</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatOrderSource(order.source)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          order.status === "completed" ? "default" :
                            order.status === "cancelled" ? "destructive" :
                              "secondary"
                        }>
                          {formatOrderStatus(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.time ? new Date(order.time).toLocaleDateString("ru-RU") : "-"}</TableCell>
                      <TableCell>
                        {order.feedback ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm">{"★".repeat(order.feedback.rating)}{"☆".repeat(5 - order.feedback.rating)}</span>
                            {order.feedback.comment && (
                              <span className="text-xs text-muted-foreground">{order.feedback.comment}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
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
              onPageChange={setCurrentPage}
              perPage={perPage}
              onPerPageChange={(n) => {
                setPerPage(n);
                setCurrentPage(1);
              }}
              isLoading={isLoadingOrders}
            />
          </DataTableShell>
        </CardContent>
      </Card>

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
                  {formatSomUZS(item.price * item.quantity)} сум
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
