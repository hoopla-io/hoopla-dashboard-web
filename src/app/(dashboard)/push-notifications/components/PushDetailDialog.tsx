import { Link } from "react-router-dom";
import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatPushKind,
  formatPushReference,
  formatPushStatus,
  pushStatusTone,
} from "@/lib/push-notification";
import type { PushNotification } from "@/lib/api/schemas/push-notifications";

type PushDetailDialogProps = {
  notification: PushNotification | null;
  onClose: () => void;
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="text-right text-foreground">{children}</div>
    </div>
  );
}

export function PushDetailDialog({ notification, onClose }: PushDetailDialogProps) {
  const data = Object.entries(notification?.data ?? {});

  return (
    <Dialog
      open={!!notification}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {notification ? (
          <>
            <DialogHeader>
              <DialogTitle>Push-уведомление #{notification.id}</DialogTitle>
              <DialogDescription>Что было отправлено на устройства клиента.</DialogDescription>
            </DialogHeader>

            <div className="flex gap-3 rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bell className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{notification.title}</p>
                <p className="text-sm text-muted-foreground">{notification.body}</p>
              </div>
            </div>

            <div className="divide-y divide-border">
              <DetailRow label="Статус">
                <StatusBadge
                  label={formatPushStatus(notification.status)}
                  tone={pushStatusTone(notification.status)}
                />
              </DetailRow>
              <DetailRow label="Вид">
                <Badge variant="outline">{formatPushKind(notification.kind)}</Badge>
              </DetailRow>
              <DetailRow label="Объект">
                <span className="font-mono tabular-nums">
                  {formatPushReference(notification.kind, notification.reference_id)}
                </span>
              </DetailRow>
              <DetailRow label="Попытка">
                <span className="font-mono tabular-nums">{notification.attempt}</span>
              </DetailRow>
              <DetailRow label="Пользователь">
                {notification.user ? (
                  <div className="flex flex-col items-end">
                    <span>{notification.user.name || "—"}</span>
                    <Link
                      to={`/orders?search=${encodeURIComponent(notification.user.phone_number)}`}
                      className="font-mono text-xs tabular-nums text-muted-foreground underline-offset-2 hover:underline"
                    >
                      {notification.user.phone_number}
                    </Link>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Удалённый пользователь #{notification.user_id}</span>
                )}
              </DetailRow>
              <DetailRow label="Создан">{new Date(notification.created_at).toLocaleString("ru-RU")}</DetailRow>
              <DetailRow label="Обновлён">{new Date(notification.updated_at).toLocaleString("ru-RU")}</DetailRow>
            </div>

            {data.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Данные payload</p>
                <div className="rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs">
                  {data.map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="break-all text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {notification.error ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Ошибка</p>
                <p className="break-words rounded-lg border border-destructive/30 bg-destructive/5 p-3 font-mono text-xs text-destructive">
                  {notification.error}
                </p>
              </div>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
