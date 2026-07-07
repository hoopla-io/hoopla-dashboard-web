import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { LabeledCount } from "@/lib/api/schemas/analytics";

const COLORS: Record<string, string> = {
  male: "#3b82f6",
  female: "#ec4899",
  unknown: "#94a3b8",
};

const FALLBACK = ["#6366f1", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6"];

interface GenderChartProps {
  data: LabeledCount[];
}

export function GenderChart({ data }: GenderChartProps) {
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
            <Cell key={entry.label} fill={COLORS[entry.label] ?? FALLBACK[index % FALLBACK.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
