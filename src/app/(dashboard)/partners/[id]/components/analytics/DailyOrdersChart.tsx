import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPoint } from "@/lib/api/schemas/analytics";

interface DailyOrdersChartProps {
  data: DailyPoint[];
}

export function DailyOrdersChart({ data }: DailyOrdersChartProps) {
  const total = data.reduce((sum, item) => sum + item.orders, 0);
  if (total === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        No orders in this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="day" fontSize={11} minTickGap={24} />
        <YAxis allowDecimals={false} fontSize={12} width={32} />
        <Tooltip />
        <Area type="monotone" dataKey="orders" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
