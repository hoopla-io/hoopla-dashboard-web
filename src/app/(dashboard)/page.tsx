"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Store, ShoppingCart, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { partnersApi, shopsApi, ordersApi, usersApi } from "@/lib/api";

export default function DashboardPage() {
  const { data: partners = { data: [], meta: { totalItems: 0 } } } = useQuery({
    queryKey: ["partners"],
    queryFn: () => partnersApi.getAll(),
  });

  const { data: shops = { data: [], meta: { totalItems: 0 } } } = useQuery({
    queryKey: ["shops"],
    queryFn: () => shopsApi.getAll(),
  });

  const { data: orders = { data: [], meta: { totalItems: 0 } } } = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersApi.getAll(),
  });

  const { data: users = { data: [], meta: { totalItems: 0 } } } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.getAll(),
  });

  const stats = [
    {
      name: "Total Users",
      value: (users.meta?.totalItems || 0).toString(),
      icon: Users,
      description: "Registered users",
    },
    {
      name: "Total Partners",
      value: (partners.meta?.totalItems || 0).toString(),
      icon: Building2,
      description: "Connected partners",
    },
    {
      name: "Total Shops",
      value: (shops.meta?.totalItems || 0).toString(),
      icon: Store,
      description: "Connected shops",
    },
    {
      name: "Total Orders",
      value: (orders.meta?.totalItems || 0).toString(),
      icon: ShoppingCart,
      description: "Orders processed",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your platform's performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
