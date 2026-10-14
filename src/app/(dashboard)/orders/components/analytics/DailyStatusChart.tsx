import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatSomUZS } from "@/lib/money";
import type { OrdersDailyPoint } from "@/lib/api/schemas/analytics";

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
};

export function DailyStatusChart({ data }: { data: OrdersDailyPoint[] }) {
  const total = data.reduce((sum, d) => sum + d.completed + d.cancelled, 0);
  if (total === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        No orders in this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="day" fontSize={11} minTickGap={24} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
        <YAxis allowDecimals={false} fontSize={12} width={32} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          contentStyle={tooltipStyle}
          formatter={(value, name) => [Number(value).toLocaleString(), name]}
          labelFormatter={(day, payload) => {
            const revenue = payload?.[0]?.payload?.revenue ?? 0;
            return `${day} · ${formatSomUZS(revenue)} UZS`;
          }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="completed" name="Completed" stackId="s" fill="var(--chart-1)" stroke="var(--card)" strokeWidth={1} />
        <Bar dataKey="cancelled" name="Cancelled" stackId="s" fill="var(--chart-3)" stroke="var(--card)" strokeWidth={1} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
