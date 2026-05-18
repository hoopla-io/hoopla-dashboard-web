import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatUZS } from "@/lib/money";
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["shop-orders", shopId, page, statusFilter, searchTerm],
    queryFn: () => ordersApi.getByShop(shopId, {
      page,
      limit: ITEMS_PER_PAGE,
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: searchTerm || undefined,
    }),
    enabled: !!shopId,
  });

  const orders = ordersData?.data || [];
  const meta = ordersData?.meta;
  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.totalItems || 0;

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

  const formatPrice = (priceTiyin?: number) => formatUZS(priceTiyin);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  return (
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

        <div className="rounded-md border">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No orders found
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
                    <TableCell>{order.drink?.name || "-"}</TableCell>
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(page * ITEMS_PER_PAGE, totalItems)} of {totalItems} orders
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
