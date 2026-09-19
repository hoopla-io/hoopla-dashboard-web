import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatOrderSource } from "@/lib/order-source";

interface OrdersTabProps {
  userId: number;
}

const STATUSES = ["completed", "cancelled", "preparing", "pending_payment", "error"];

const formatStatus = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");

export function OrdersTab({ userId }: OrdersTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const [itemsDialogOrder, setItemsDialogOrder] = useState<Order | null>(null);
  const { sort, order, onSort, sortParam, orderParam } = useTableSort(() => setCurrentPage(1));

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["user_orders", userId, currentPage, perPage, statusFilter, sortParam, orderParam],
    queryFn: () =>
      ordersApi.getAll({
        user_id: userId,
        include_test: true,
        page: currentPage,
        limit: perPage,
        status: statusFilter === "all" ? undefined : statusFilter,
        sort: sortParam,
        order: orderParam,
      }),
    enabled: !!userId,
  });

  const orders = ordersData?.data || [];
  const totalPages = ordersData?.meta?.totalPages || 1;
  const summary = ordersData?.meta?.summary;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-48">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatStatus(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {summary ? (
          <p className="text-sm text-muted-foreground">
            {summary.completed_count} completed · {formatSomUZS(summary.revenue_completed)} сум ·{" "}
            {summary.cancelled_count} cancelled
          </p>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order history</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead column="id" sort={sort} order={order} onSort={onSort}>
                    ID
                  </SortableTableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Product</TableHead>
                  <SortableTableHead column="price" sort={sort} order={order} onSort={onSort}>
                    Total
                  </SortableTableHead>
                  <SortableTableHead column="source" sort={sort} order={order} onSort={onSort}>
                    Source
                  </SortableTableHead>
                  <SortableTableHead column="status" sort={sort} order={order} onSort={onSort}>
                    Status
                  </SortableTableHead>
                  <SortableTableHead column="created_at" sort={sort} order={order} onSort={onSort}>
                    Date
                  </SortableTableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead className="w-10 text-right">Fiscal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">Loading orders...</TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-0">
                      <EmptyState
                        title="No orders found"
                        description={
                          statusFilter !== "all"
                            ? "Try another status."
                            : "Orders placed by this user will appear here."
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">#{item.id}</TableCell>
                      <TableCell>
                        {item.shop ? (
                          <Link
                            to={`/shops/${item.shop.id}`}
                            className="text-foreground underline-offset-2 hover:underline"
                          >
                            {item.shop.name}
                          </Link>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {item.items && item.items.length > 1 ? (
                          <button
                            type="button"
                            className="underline-offset-2 hover:underline"
                            onClick={() => setItemsDialogOrder(item)}
                          >
                            {item.drink?.name || `${item.items.length} items`}
                          </button>
                        ) : (
                          item.drink?.name || "-"
                        )}
                      </TableCell>
                      <TableCell>{formatSomUZS(item.price)} сум</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatOrderSource(item.source)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "completed"
                              ? "default"
                              : item.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {formatStatus(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.time ? new Date(item.time).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell>
                        {item.feedback ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm">
                              {"★".repeat(item.feedback.rating)}
                              {"☆".repeat(5 - item.feedback.rating)}
                            </span>
                            {item.feedback.comment && (
                              <span className="text-xs text-muted-foreground">{item.feedback.comment}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.fiscal_link?.trim() ? (
                          <Button asChild variant="outline" size="icon-sm" title="Open fiscal receipt">
                            <a
                              href={item.fiscal_link.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Open fiscal receipt"
                            >
                              <ExternalLink className="size-4" />
                            </a>
                          </Button>
                        ) : null}
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
            <DialogTitle>Order #{itemsDialogOrder?.id} items</DialogTitle>
            <DialogDescription>Line items for this order.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {itemsDialogOrder?.items?.map((line) => (
              <div key={line.id} className="flex items-center justify-between text-sm">
                <span>
                  {line.name} × {line.quantity}
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {formatSomUZS(line.price * line.quantity)} сум
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
