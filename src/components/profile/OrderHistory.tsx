import type { Order, OrderStatus } from "../../types";

interface OrderHistoryProps {
  orders: Order[];
}

const statusStyles: Record<OrderStatus, string> = {
  COMPLETED: "bg-green-100 text-green-800 ring-green-600/20",
  CREATED: "bg-amber-100 text-amber-800 ring-amber-600/20",
  CAPTURING: "bg-blue-100 text-blue-800 ring-blue-600/20",
  PENDING: "bg-amber-100 text-amber-800 ring-amber-600/20",
  FAILED: "bg-red-100 text-red-800 ring-red-600/20",
};

const formatDate = (value?: string): string => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatMoney = (value: number): string => {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return `$${rounded.toFixed(2)}`;
};

const OrderHistory = ({ orders }: OrderHistoryProps) => {
  if (orders.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">You have not placed any orders yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">Order History</h2>

      <div className="mt-6 space-y-6">
        {orders.map((order) => (
          <article
            key={order._id}
            className="overflow-hidden rounded-xl border border-gray-200 shadow-sm"
          >
            <header className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Order #{order._id.slice(-8)}
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <span
                className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                  statusStyles[order.status]
                }`}
              >
                {order.status}
              </span>
            </header>

            <div className="px-5 py-4">
              <ul className="divide-y divide-gray-50">
                {order.items.map((item, index) => (
                  <li
                    key={`${order._id}-${item.productId}-${index}`}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity} · {formatMoney(item.unitPrice)} each
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-gray-900">
                      {formatMoney(item.unitPrice * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="font-medium text-gray-600">Total</span>
                <span className="text-lg font-bold text-indigo-600">
                  {formatMoney(Number(order.amount.value))}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
