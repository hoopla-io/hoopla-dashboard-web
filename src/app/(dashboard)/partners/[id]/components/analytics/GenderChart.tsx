import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { LabeledCount } from "@/lib/api/schemas/analytics";

const COLORS: Record<string, string> = {
  male: "#3b82f6",
  female: "#ec4899",
  unknown: "#94a3b8",
};

const LABELS: Record<string, string> = {
  male: "Мужчины",
  female: "Женщины",
  unknown: "Не указано",
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
        Нет данных за этот период
      </div>
    );
  }

  const chartData = data.map((item) => ({ ...item, name: LABELS[item.label] ?? item.label }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={chartData} dataKey="users" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
          {chartData.map((entry, index) => (
            <Cell key={entry.label} fill={COLORS[entry.label] ?? FALLBACK[index % FALLBACK.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
