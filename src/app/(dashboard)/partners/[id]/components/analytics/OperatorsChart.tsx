import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { LabeledCount } from "@/lib/api/schemas/analytics";

const FALLBACK = ["#6366f1", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6", "#ec4899", "#94a3b8"];

interface OperatorsChartProps {
  data: LabeledCount[];
}

export function OperatorsChart({ data }: OperatorsChartProps) {
  const total = data.reduce((sum, item) => sum + item.users, 0);
  if (total === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        No data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="users" nameKey="label" cx="50%" cy="50%" outerRadius={90} label>
          {data.map((entry, index) => (
            <Cell key={entry.label} fill={FALLBACK[index % FALLBACK.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
