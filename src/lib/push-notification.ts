import type { StatusTone } from "@/components/ui/status-badge";

export const PUSH_KINDS = [
  "order_preparing",
  "order_completed",
  "order_cancelled",
  "order_rating",
  "daily_habit",
  "lapse",
] as const;

export const PUSH_STATUSES = ["sent", "skipped_no_token", "failed", "pending"] as const;

const kindLabels: Record<string, string> = {
  order_preparing: "Заказ готовится",
  order_completed: "Заказ готов",
  order_cancelled: "Заказ отменён",
  order_rating: "Напоминание об оценке",
  daily_habit: "Ежедневная привычка",
  lapse: "Напоминание о возвращении",
};

const statusLabels: Record<string, string> = {
  sent: "Отправлено",
  skipped_no_token: "Нет токена устройства",
  failed: "Ошибка",
  pending: "В ожидании",
};

const statusTones: Record<string, StatusTone> = {
  sent: "success",
  skipped_no_token: "neutral",
  failed: "danger",
  pending: "pending",
};

const humanize = (value: string) =>
  value.replace(/[_-]+/g, " ").replace(/^\w/, (character) => character.toUpperCase());

export function formatPushKind(kind: string): string {
  return kindLabels[kind] ?? humanize(kind);
}

export function formatPushStatus(status: string): string {
  return statusLabels[status] ?? humanize(status);
}

export function pushStatusTone(status: string): StatusTone {
  return statusTones[status] ?? "neutral";
}

export function formatPushReference(kind: string, referenceId: number): string {
  if (kind === "daily_habit") {
    const value = String(referenceId);
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  return `Заказ #${referenceId}`;
}
