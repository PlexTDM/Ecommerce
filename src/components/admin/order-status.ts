import type { OrderStatus } from "../../types";

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "CREATED",
  "CAPTURING",
  "PENDING",
  "COMPLETED",
  "FAILED",
];

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  CREATED: "border-indigo-400/30 bg-indigo-500/10 text-indigo-200",
  CAPTURING: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  PENDING: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  COMPLETED: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  FAILED: "border-rose-400/30 bg-rose-500/10 text-rose-200",
};

export const isOrderStatus = (value: string): value is OrderStatus =>
  ORDER_STATUSES.some((status) => status === value);
