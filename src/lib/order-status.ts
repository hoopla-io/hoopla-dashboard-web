import type { StatusTone } from "@/components/ui/status-badge";

export const orderStatusTone: Record<string, StatusTone> = {
  pending_payment: "pending",
  pending: "warning",
  processing: "processing",
  preparing: "processing",
  completed: "success",
  cancelled: "danger",
  error: "danger",
};

export const formatOrderStatus = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
