"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Store, ShoppingCart, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { partnersApi, shopsApi, ordersApi, usersApi } from "@/lib/api";

export default function DashboardPage() {
  const { data: partners = [] } = useQuery({
    queryKey: ["partners"],
    queryFn: partnersApi.getAll,
  });

  const { data: shops = [] } = useQuery({
    queryKey: ["shops"],
    queryFn: shopsApi.getAll,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersApi.getAll(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getAll,
  });

  const stats = [
    {
      name: "Total Users",
      value: users.length.toString(),
      icon: Users,
      description: "Registered users",
    },
    {
      name: "Total Partners",
      value: partners.length.toString(),
      icon: Building2,
      description: "Connected partners",
    },
    {
      name: "Total Shops",
      value: shops.length.toString(),
      icon: Store,
      description: "Connected shops",
    },
    {
      name: "Total Orders",
      value: orders.length.toString(),
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
