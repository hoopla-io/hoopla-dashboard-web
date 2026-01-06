"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search, Filter, ChevronLeft, ChevronRight, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { ordersApi } from "@/lib/api";
import type { Order, ChangeOrderStatusRequest } from "@/lib/api";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-500",
  processing: "bg-blue-500/20 text-blue-500",
  completed: "bg-green-500/20 text-green-500",
  cancelled: "bg-red-500/20 text-red-500",
};

const statusOptions = ["pending", "processing", "completed", "cancelled"];
const ITEMS_PER_PAGE = 10;

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [phoneFilter, setPhoneFilter] = useState("");
  const [drinkFilter, setDrinkFilter] = useState("");
  const [shopFilter, setShopFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: ordersData = { data: [] }, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersApi.getAll(),
  });

  const statusMutation = useMutation({
    mutationFn: (data: ChangeOrderStatusRequest) => ordersApi.changeStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order status updated!");
    },
    onError: () => toast.error("Failed to update order status"),
  });

  const filteredOrders = (ordersData.data || []).filter((order) => {
    const matchesPhone = !phoneFilter || (order.user && order.user.toLowerCase().includes(phoneFilter.toLowerCase())); // Assuming user field contains phone or name. Task says "Phone Number". Ideally order.user is name/phone.
    const matchesDrink = !drinkFilter || (order.drink && order.drink.toLowerCase().includes(drinkFilter.toLowerCase()));
    const matchesShop = !shopFilter || (order.shop && order.shop.toLowerCase().includes(shopFilter.toLowerCase()));
    const matchesDate = !dateFilter || (order.time && order.time.includes(dateFilter));
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesPhone && matchesDrink && matchesShop && matchesDate && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleStatusChange = (orderId: number, newStatus: string) => {
    statusMutation.mutate({ id: orderId, status: newStatus });
  };

  const formatPrice = (price?: number) => {
    return price ? new Intl.NumberFormat("uz-UZ").format(price) : "0";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage and track all orders</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Input
          placeholder="Filter by Phone/User..."
          value={phoneFilter}
          onChange={(e) => { setPhoneFilter(e.target.value); setCurrentPage(1); }}
        />
        <Input
          placeholder="Filter by Drink..."
          value={drinkFilter}
          onChange={(e) => { setDrinkFilter(e.target.value); setCurrentPage(1); }}
        />
        <Input
          placeholder="Filter by Shop..."
          value={shopFilter}
          onChange={(e) => { setShopFilter(e.target.value); setCurrentPage(1); }}
        />
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
        />
        <Select value={statusFilter} onValueChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Drink</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Last Update</TableHead>
              <TableHead>Fiscal Check</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{order.user || "-"}</TableCell>
                  <TableCell>{order.drink || "-"}</TableCell>
                  <TableCell>{formatPrice(order.price)} UZS</TableCell>
                  <TableCell>{order.shop || "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(order.time)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(order.last_update)}
                  </TableCell>
                  <TableCell>
                    {order.fiscal_link ? (
                      <a
                        href={order.fiscal_link}
                        target="_blank" // Open in new tab
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 w-8"
                      >
                         <QrCode className="h-4 w-4" />
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status] || "bg-muted"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
