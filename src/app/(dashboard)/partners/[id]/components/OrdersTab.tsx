import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ordersApi } from "@/lib/api/domains/orders";

interface OrdersTabProps {
  partnerId: number;
}

export function OrdersTab({ partnerId }: OrdersTabProps) {
  const [ordersFilter, setOrdersFilter] = useState("");

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["partner_orders", partnerId],
    queryFn: () => ordersApi.getByPartner(partnerId),
    enabled: !!partnerId,
  });
  const orders = ordersData || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="max-w-sm w-full relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter orders..."
            value={ordersFilter}
            onChange={(e) => setOrdersFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingOrders ? (
                <TableRow><TableCell colSpan={6} className="text-center py-4">Loading orders...</TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground">No orders found</TableCell></TableRow>
              ) : (
                orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.user?.name || order.user?.phone_number || "-"}</TableCell>
                    <TableCell>{order.shop?.name || "-"}</TableCell>
                    <TableCell>{order.price?.toLocaleString()} сум</TableCell>
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
