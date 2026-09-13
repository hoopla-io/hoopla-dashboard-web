import { cn } from "@/lib/utils";
import { formatPushKind } from "@/lib/push-notification";
import type { PushNotificationStats } from "@/lib/api/schemas/push-notifications";

const percent = (value: number, total: number) =>
  total > 0 ? `${Math.round((value / total) * 100)}%` : "—";

type PushStatsProps = {
  stats?: PushNotificationStats;
  isLoading: boolean;
  kind: string;
  status: string;
  onKindChange: (kind: string) => void;
  onStatusChange: (status: string) => void;
};

export function PushStats({
  stats,
  isLoading,
  kind,
  status,
  onKindChange,
  onStatusChange,
}: PushStatsProps) {
  const total = stats?.total ?? 0;

  const cells = [
    { status: "all", label: "Total", value: total, hint: "Matching filters" },
    { status: "sent", label: "Sent", value: stats?.sent ?? 0, hint: `${percent(stats?.sent ?? 0, total)} delivered` },
    {
      status: "skipped_no_token",
      label: "No device token",
      value: stats?.skipped_no_token ?? 0,
      hint: `${percent(stats?.skipped_no_token ?? 0, total)} of pushes`,
    },
    { status: "failed", label: "Failed", value: stats?.failed ?? 0, hint: `${percent(stats?.failed ?? 0, total)} of pushes` },
    { status: "pending", label: "Pending", value: stats?.pending ?? 0, hint: "Claimed, not finished" },
  ];

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-5">
        {cells.map((cell) => {
          const active = status === cell.status;
          return (
            <button
              key={cell.status}
              type="button"
              onClick={() => onStatusChange(active ? "all" : cell.status)}
              className={cn(
                "flex flex-col items-start gap-1 bg-card px-4 py-3 text-left transition-colors hover:bg-muted/40",
                active && cell.status !== "all" && "bg-muted"
              )}
            >
              <span className="text-xs text-muted-foreground">{cell.label}</span>
              <span className="font-mono text-2xl tabular-nums text-foreground">
                {isLoading ? "—" : cell.value.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">{cell.hint}</span>
            </button>
          );
        })}
      </div>

      {stats && stats.kinds.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {stats.kinds.map((item) => {
            const active = kind === item.kind;
            return (
              <button
                key={item.kind}
                type="button"
                onClick={() => onKindChange(active ? "all" : item.kind)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
                  active
                    ? "border-primary bg-muted text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <span>{formatPushKind(item.kind)}</span>
                <span className="font-mono tabular-nums text-foreground">{item.total.toLocaleString()}</span>
                <span>· {percent(item.sent, item.total)} sent</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
