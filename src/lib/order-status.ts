import type { StatusTone } from "@/components/ui/status-badge";

export const orderStatusTone: Record<string, StatusTone> = {
  pending_payment: "pending",
  paid: "warning",
  scheduled: "pending",
  pending: "warning",
  processing: "processing",
  preparing: "processing",
  completed: "success",
  cancelled: "danger",
  error: "danger",
};

const orderStatusLabels: Record<string, string> = {
  pending_payment: "Ожидает оплаты",
  paid: "Оплачен",
  scheduled: "Запланирован",
  pending: "Ожидает",
  processing: "В обработке",
  preparing: "Готовится",
  completed: "Завершён",
  cancelled: "Отменён",
  error: "Ошибка",
};

export const formatOrderStatus = (status: string) =>
  orderStatusLabels[status] ??
  status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "scheduled",
  "pending",
  "processing",
  "preparing",
  "completed",
  "cancelled",
  "error",
];

export const EDITABLE_ORDER_STATUSES = [
  "pending_payment",
  "pending",
  "processing",
  "completed",
  "cancelled",
];
