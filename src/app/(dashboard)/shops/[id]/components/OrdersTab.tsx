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
import type { Order, ChangeOrderStatusRequest } from "@/lib/api/schemas/orders";

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

const statusOptions = ["pending_payment", "pending", "processing", "completed", "cancelled"];
const ITEMS_PER_PAGE = 10;

export function OrdersTab({ shopId }: OrdersTabProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(ITEMS_PER_PAGE);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsDialogOrder, setItemsDialogOrder] = useState<Order | null>(null);

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

  const statusMutation = useMutation({
    mutationFn: (data: ChangeOrderStatusRequest) => ordersApi.changeStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-orders", shopId] });
      toast.success("Order status updated!");
    },
    onError: () => toast.error("Failed to update order status"),
  });

  const handleStatusChange = (orderId: number, newStatus: string) => {
    statusMutation.mutate({ id: orderId, status: newStatus });
  };

  const fiscalizeMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.fiscalize(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-orders", shopId] });
      toast.success("Fiscalization requested");
    },
    onError: () => toast.error("Failed to fiscalize order"),
  });

  const formatPrice = (price?: number) => formatSomUZS(price);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Shop Orders</CardTitle>
          <CardDescription>View and manage orders for this shop</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search phone/user..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="md:max-w-sm"
            />
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Drink</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead className="text-center">Fiscal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <EmptyState
                        title="No orders found"
                        description={
                          searchTerm || statusFilter !== "all"
                            ? "Try adjusting or clearing your filters."
                            : "Orders placed at this shop will appear here."
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order: Order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
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
                            {order.drink?.name || `${order.items.length} items`}
                          </button>
                        ) : (
                          order.drink?.name || "-"
                        )}
                      </TableCell>
                      <TableCell>{formatPrice(order.price)} UZS</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(order.time)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] || "bg-muted"}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusChange(order.id, value)}
                          >
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {order.status === "completed" && (order.fiscal_link?.trim() ? (
                          <Button asChild variant="outline" size="icon-sm" title="Open fiscal receipt">
                            <a
                              href={order.fiscal_link.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Open fiscal receipt"
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
                            title="Fiscalize order"
                            aria-label="Fiscalize order"
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
                  {formatPrice(item.price * item.quantity)} UZS
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
