"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Store, Coffee, ShoppingCart, Users, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const stats = [
  { name: "Total Partners", value: "12", icon: Building2, change: "+2" },
  { name: "Total Shops", value: "48", icon: Store, change: "+5" },
  { name: "Total Drinks", value: "156", icon: Coffee, change: "+12" },
  { name: "Active Orders", value: "324", icon: ShoppingCart, change: "+18" },
  { name: "Total Users", value: "2,847", icon: Users, change: "+156" },
  { name: "Revenue", value: "$45,231", icon: TrendingUp, change: "+8.2%" },
];

const revenueData = [
  { name: "Dec 20", value: 6500 },
  { name: "Dec 21", value: 7200 },
  { name: "Dec 22", value: 13000 },
  { name: "Dec 23", value: 19500 },
  { name: "Dec 24", value: 14000 },
  { name: "Dec 25", value: 22000 },
  { name: "Dec 26", value: 26000 },
];

const platformData = [
  { name: "Mobile App", value: 45, color: "#8b5cf6" },
  { name: "Desktop Web", value: 30, color: "#3b82f6" },
  { name: "Mobile Web", value: 15, color: "#f97316" },
  { name: "CTV/OTT", value: 10, color: "#22c55e" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Welcome to Hoopla Dashboard</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Select a module from the sidebar to get started.
      </p>
    </div>
  );
}
