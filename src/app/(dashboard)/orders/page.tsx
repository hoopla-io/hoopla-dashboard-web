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

import { useQueryState, parseAsInteger, parseAsString } from "nuqs";

const statusOptions = ["pending", "processing", "completed", "cancelled"];
const ITEMS_PER_PAGE = 10;

import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";

function OrdersContent() {
  const queryClient = useQueryClient();
  
  // URL State Management
  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [phoneFilter, setPhoneFilter] = useQueryState("search", parseAsString.withDefault(""));
  const [drinkFilter, setDrinkFilter] = useQueryState("drink", parseAsString.withDefault(""));
  const [shopFilter, setShopFilter] = useQueryState("shop", parseAsString.withDefault(""));
  const [dateFilter, setDateFilter] = useQueryState("date", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState("status", parseAsString.withDefault("all"));

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders", currentPage, statusFilter, drinkFilter, dateFilter, phoneFilter, shopFilter],
    queryFn: () => ordersApi.getAll({ 
      page: currentPage, 
      limit: ITEMS_PER_PAGE,
      status: statusFilter !== "all" ? statusFilter : undefined,
      drink: drinkFilter || undefined,
      time: dateFilter || undefined,
      shop: shopFilter || undefined,
      search: phoneFilter || undefined
    }),
  });

  const orders = ordersData?.data || [];
  const meta = ordersData?.meta;
  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.totalItems || 0;

  const statusMutation = useMutation({
    mutationFn: (data: ChangeOrderStatusRequest) => ordersApi.changeStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order status updated!");
    },
    onError: () => toast.error("Failed to update order status"),
  });

  const filteredOrders = orders;

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

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Input
            placeholder="Filter by Phone/User..."
            value={phoneFilter}
            onChange={(e) => { setPhoneFilter(e.target.value || null); setCurrentPage(1); }}
          />
          <Input
            placeholder="Filter by Drink..."
            value={drinkFilter}
            onChange={(e) => { setDrinkFilter(e.target.value || null); setCurrentPage(1); }}
          />
          <Input
            placeholder="Filter by Shop..."
            value={shopFilter}
            onChange={(e) => { setShopFilter(e.target.value || null); setCurrentPage(1); }}
          />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value || null); setCurrentPage(1); }}
          />
          <Select value={statusFilter} onValueChange={(val) => {
              setStatusFilter(val === "all" ? null : val); // Use null for default checks if needed or just handle string
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
          <Button 
            variant="outline" 
            onClick={() => {
              setPhoneFilter(null);
              setDrinkFilter(null);
              setShopFilter(null);
              setDateFilter(null);
              setStatusFilter(null);
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </Button>
        </div>
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
                <TableCell colSpan={10} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order: Order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.user?.name || "-"}</span>
                      <span className="text-xs text-muted-foreground">{order.user?.phone_number}</span>
                    </div>
                  </TableCell>
                  <TableCell>{order.drink?.name || "-"}</TableCell>
                  <TableCell>{formatPrice(order.price)} UZS</TableCell>
                  <TableCell>{order.shop?.name || "-"}</TableCell>
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
                        target="_blank" 
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
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} orders
        </div>
        <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ErrorBoundary pageName="Orders">
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading orders...</div>}>
        <OrdersContent />
      </Suspense>
    </ErrorBoundary>
  );
}

