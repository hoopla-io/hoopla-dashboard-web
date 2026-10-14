import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatSomUZS } from "@/lib/money";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTableShell } from "@/components/data-table/data-table-shell";
import { EmptyState } from "@/components/data-table/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ordersApi } from "@/lib/api/domains/orders";
import { getApiErrorMessage } from "@/lib/api/error";
import type { Order } from "@/lib/api/schemas/orders";
import { ORDER_STATUSES, formatOrderStatus } from "@/lib/order-status";
import { OrderDetailSheet } from "@/components/orders/OrderDetailSheet";
import { formatOrderSource } from "@/lib/order-source";

interface OrdersTabProps {
  shopId: number;
}

const statusColors: Record<string, string> = {
  pending_payment: "bg-orange-500/20 text-orange-500",
  pending: "bg-yellow-500/20 text-yellow-500",
  processing: "bg-blue-500/20 text-blue-500",
  completed: "bg-green-500/20 text-green-500",
  cancelled: "bg-red-500/20 text-red-500",
};

const ITEMS_PER_PAGE = 10;

export function OrdersTab({ shopId }: OrdersTabProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(ITEMS_PER_PAGE);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsDialogOrder, setItemsDialogOrder] = useState<Order | null>(null);
  const [openOrderId, setOpenOrderId] = useState<number | null>(null);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["shop-orders", shopId, page, perPage, statusFilter, searchTerm],
    queryFn: () => ordersApi.getByShop(shopId, {
      page,
      limit: perPage,
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: searchTerm || undefined,
    }),
    enabled: !!shopId,
  });

  const orders = ordersData?.data || [];
  const meta = ordersData?.meta;
  const totalPages = meta?.totalPages || 1;

  const fiscalizeMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.fiscalize(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-orders", shopId] });
      toast.success("Фискализация запрошена");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Не удалось фискализировать заказ")),
  });

  const formatPrice = (price?: number) => formatSomUZS(price);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("ru-RU");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Заказы заведения</CardTitle>
          <CardDescription>Просмотр и управление заказами этого заведения</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Поиск по телефону/пользователю…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="md:max-w-sm"
            />
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatOrderStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID заказа</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Товар</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Источник</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-center">Чек</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">Загрузка…</TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <EmptyState
                        title="Заказы не найдены"
                        description={
                          searchTerm || statusFilter !== "all"
                            ? "Измените или сбросьте фильтры."
                            : "Здесь появятся заказы этого заведения."
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order: Order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
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
                          <span className="font-medium text-sm">{order.user?.name || "-"}</span>
                          <span className="text-xs text-muted-foreground">{order.user?.phone_number}</span>
                        </div>
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
                      <TableCell>{formatPrice(order.price)} сум</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatOrderSource(order.source)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(order.time)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] || "bg-muted"}>
                          {formatOrderStatus(order.status)}
                        </Badge>
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
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              perPage={perPage}
              onPerPageChange={(n) => {
                setPerPage(n);
                setPage(1);
              }}
              isLoading={isLoading}
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
                  {formatPrice(item.price * item.quantity)} сум
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <OrderDetailSheet orderId={openOrderId} onClose={() => setOpenOrderId(null)} />
    </>
  );
}
