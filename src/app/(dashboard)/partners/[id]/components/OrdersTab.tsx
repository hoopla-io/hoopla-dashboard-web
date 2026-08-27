import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
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
import { formatSomUZS } from "@/lib/money";
import type { Order } from "@/lib/api/schemas/orders";

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
      toast.success("Fiscalization requested");
    },
    onError: () => toast.error("Failed to fiscalize order"),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="max-w-sm w-full relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter orders..."
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
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="id" sort={sort} order={order} onSort={onSort}>
                    ID
                  </SortableTableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Drink</TableHead>
                  <SortableTableHead column="price" sort={sort} order={order} onSort={onSort}>
                    Total
                  </SortableTableHead>
                  <SortableTableHead column="status" sort={sort} order={order} onSort={onSort}>
                    Status
                  </SortableTableHead>
                  <SortableTableHead column="created_at" sort={sort} order={order} onSort={onSort}>
                    Date
                  </SortableTableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingOrders ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">Loading orders...</TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-0">
                      <EmptyState
                        title="No orders found"
                        description={
                          ordersFilter
                            ? "Try adjusting or clearing your search."
                            : "Orders placed with this partner will appear here."
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
                            {order.drink?.name || `${order.items.length} items`}
                          </button>
                        ) : (
                          order.drink?.name || "-"
                        )}
                      </TableCell>
                      <TableCell>{formatSomUZS(order.price)} сум</TableCell>
                      <TableCell>
                        <Badge variant={
                          order.status === "completed" ? "default" :
                            order.status === "cancelled" ? "destructive" :
                              "secondary"
                        }>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.time ? new Date(order.time).toLocaleDateString() : "-"}</TableCell>
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
                        {order.status === "completed" && !order.fiscal_link?.trim() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fiscalizeMutation.mutate(order.id)}
                            disabled={fiscalizeMutation.isPending}
                          >
                            Fiscalize
                          </Button>
                        )}
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
            <DialogTitle>Order #{itemsDialogOrder?.id} items</DialogTitle>
            <DialogDescription>Line items for this order.</DialogDescription>
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
