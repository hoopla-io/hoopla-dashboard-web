import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function Delta({ current, previous, inverse = false, points = false }: {
  current: number;
  previous: number;
  inverse?: boolean;
  points?: boolean;
}) {
  if (!points && previous === 0) {
    return <span className="text-xs text-muted-foreground">no prior data</span>;
  }
  const diff = points ? current - previous : ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 0.05) {
    return <span className="text-xs text-muted-foreground">no change</span>;
  }
  const up = diff > 0;
  const good = inverse ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      )}
    >
      <Icon className="size-3.5" />
      {Math.abs(diff).toFixed(1)}
      {points ? " pp" : "%"}
    </span>
  );
}
