import type { OrderStatus } from "@/types";
import { ORDER_STATUS_STYLES } from "./order-status";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${ORDER_STATUS_STYLES[status]}`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
    {status}
  </span>
);

export default OrderStatusBadge;
