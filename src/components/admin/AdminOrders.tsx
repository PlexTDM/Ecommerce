import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchAdminOrders, getAdminApiErrorMessage, updateAdminOrderStatus } from "@/api/admin";
import type { AdminOrder, AdminOrdersResponse } from "@/types/admin";
import type { OrderStatus } from "@/types";
import AdminPagination from "./AdminPagination";
import OrderStatusBadge from "./OrderStatusBadge";
import Spinner from "./Spinner";
import { ORDER_STATUSES, isOrderStatus } from "./order-status";
import { AlertIcon, CloseIcon, RefreshIcon, ReceiptIcon, UserIcon } from "./icons";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "./format";
import { AdminTableSkeleton } from "@/components/ui/skeletons";

const PAGE_SIZE = 20;

type StatusFilter = "ALL" | OrderStatus;

const getCustomerLabel = (order: AdminOrder): string => {
  const candidates = [order.customer, order.user];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (typeof candidate === "string") {
      const value = candidate.trim();
      if (value) return value;
      continue;
    }

    if (typeof candidate.email === "string" && candidate.email.trim()) {
      return candidate.email;
    }
    if (typeof candidate.username === "string" && candidate.username.trim()) {
      return candidate.username;
    }
    if (typeof candidate.name === "string" && candidate.name.trim()) {
      return candidate.name;
    }
  }

  if (typeof order.email === "string" && order.email.trim()) {
    return order.email;
  }

  const shippingName = order.shipping?.name?.trim();
  if (shippingName) return shippingName;

  const userId = order.userId?.trim();
  if (userId) return `User ${userId.slice(-6).toUpperCase()}`;

  return "—";
};

interface StatusSelectProps {
  value: OrderStatus;
  updating: boolean;
  disabled: boolean;
  onChange: (status: OrderStatus) => void;
}

const StatusSelect = ({ value, updating, disabled, onChange }: StatusSelectProps) => (
  <div className="inline-flex items-center gap-2">
    {updating && <Spinner className="h-3.5 w-3.5 text-indigo-300" />}
    <select
      value={value}
      disabled={disabled}
      aria-label={`Update order status, current status ${value}`}
      onChange={(event) => {
        const nextStatus = event.target.value;
        if (isOrderStatus(nextStatus)) onChange(nextStatus);
      }}
      className="cursor-pointer rounded-lg border border-white/10 bg-slate-950/70 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 disabled:cursor-wait disabled:opacity-50"
    >
      {ORDER_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  </div>
);

interface AdminOrdersProps {
  active: boolean;
}

const AdminOrders = ({ active }: AdminOrdersProps) => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [data, setData] = useState<AdminOrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    if (!active) return;

    const controller = new AbortController();
    let isCurrent = true;

    setLoading(true);
    setError("");

    fetchAdminOrders(
      {
        page,
        limit: PAGE_SIZE,
        ...(statusFilter === "ALL" ? {} : { status: statusFilter }),
      },
      controller.signal,
    )
      .then((response) => {
        if (isCurrent) setData(response);
      })
      .catch((err: unknown) => {
        if (isCurrent) {
          setError(getAdminApiErrorMessage(err, "Could not load orders."));
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [active, page, statusFilter, reloadKey]);

  const handleFilterChange = (value: string) => {
    if (value !== "ALL" && !isOrderStatus(value)) return;

    setStatusFilter(value);
    setPage(1);
    setUpdateError("");
  };

  const handleStatusChange = async (order: AdminOrder, status: OrderStatus) => {
    if (status === order.status || updatingId) return;

    setUpdatingId(order._id);
    setUpdateError("");

    try {
      const updated = await updateAdminOrderStatus(order._id, status);

      setData((current) =>
        current
          ? {
              ...current,
              orders: current.orders.map((entry) =>
                entry._id === order._id ? { ...entry, ...updated, _id: entry._id } : entry,
              ),
            }
          : current,
      );

      toast.success(`Order #${order._id.slice(-8).toUpperCase()} updated to ${status}`);
    } catch (err: unknown) {
      const message = getAdminApiErrorMessage(err, "Could not update this order.");
      setUpdateError(message);
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const orders = data?.orders ?? [];
  const totalOrders = data?.totalOrders ?? 0;
  const totalPages = Math.max(data?.totalPages ?? 1, 1);
  const rangeStart = totalOrders === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalOrders);
  const summary =
    totalOrders === 0
      ? "No orders"
      : `Showing ${formatNumber(rangeStart)}–${formatNumber(rangeEnd)} of ${formatNumber(
          totalOrders,
        )} orders`;

  return (
    <section
      aria-labelledby="admin-orders-heading"
      aria-busy={loading}
      className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-2xl shadow-slate-950/40"
    >
      <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="admin-orders-heading"
            className="text-lg font-semibold tracking-tight text-slate-100"
          >
            Orders
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Review payments and move orders through fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="admin-order-status-filter"
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
          >
            Status
          </label>
          <select
            id="admin-order-status-filter"
            value={statusFilter}
            onChange={(event) => handleFilterChange(event.target.value)}
            className="cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-200 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
          >
            <option value="ALL">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {loading && data && <Spinner className="h-4 w-4 text-indigo-300" />}
        </div>
      </div>

      {updateError && (
        <div
          role="alert"
          className="mx-5 mt-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200"
        >
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{updateError}</span>
          <button
            type="button"
            onClick={() => setUpdateError("")}
            aria-label="Dismiss error"
            className="rounded-md p-0.5 text-rose-300 transition-colors hover:bg-rose-500/20 hover:text-rose-100"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && data && (
        <div
          role="alert"
          className="mx-5 mt-4 flex flex-col gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error} Showing the most recent results.</span>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-100 transition-colors hover:bg-rose-500/30"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {loading && !data ? (
        <AdminTableSkeleton />
      ) : !data ? (
        <div
          role="alert"
          className="m-5 flex flex-col gap-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
              <AlertIcon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold text-rose-100">Could not load orders</h3>
              <p className="mt-1 text-sm text-rose-200/70">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-400"
          >
            <RefreshIcon className="h-4 w-4" />
            Try again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400">
            <ReceiptIcon className="h-6 w-6" />
          </span>
          <h3 className="mt-4 text-base font-semibold text-slate-200">No orders found</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {statusFilter === "ALL"
              ? "Orders will appear here as customers complete checkout."
              : `There are no ${statusFilter} orders right now. Try another status filter.`}
          </p>
        </div>
      ) : (
        <>
          <div
            className={`hidden overflow-x-auto transition-opacity md:block ${
              loading ? "opacity-60" : ""
            }`}
          >
            <table className="w-full min-w-225 text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-950/40 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Order
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">
                    Total
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right font-semibold">
                    Update
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => {
                  const isUpdating = updatingId === order._id;

                  return (
                    <tr
                      key={order._id}
                      className={`transition-colors ${
                        isUpdating ? "bg-indigo-500/5" : "hover:bg-white/3"
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <p
                          className="font-mono text-xs font-semibold tracking-wide text-slate-200"
                          title={order._id}
                        >
                          #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {order.items.length} {order.items.length === 1 ? "item" : "items"}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className="text-slate-300"
                          title={formatDateTime(order.createdAt) || undefined}
                        >
                          {formatDate(order.createdAt)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-2 text-slate-400">
                          <UserIcon className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                          <span className="max-w-48 truncate">{getCustomerLabel(order)}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-100">
                          {formatCurrency(order.amount.value)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <OrderStatusBadge status={order.status} />
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex justify-end">
                          <StatusSelect
                            value={order.status}
                            updating={isUpdating}
                            disabled={updatingId !== null}
                            onChange={(status) => {
                              void handleStatusChange(order, status);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul
            className={`divide-y divide-white/10 md:hidden ${
              loading ? "opacity-60 transition-opacity" : ""
            }`}
          >
            {orders.map((order) => {
              const isUpdating = updatingId === order._id;

              return (
                <li key={order._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="font-mono text-xs font-semibold tracking-wide text-slate-200"
                        title={order._id}
                      >
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-300">
                        <UserIcon className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                        {getCustomerLabel(order)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-slate-100">
                        {formatCurrency(order.amount.value)}
                      </p>
                      <div className="mt-2">
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/5 pt-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Update status
                    </span>
                    <StatusSelect
                      value={order.status}
                      updating={isUpdating}
                      disabled={updatingId !== null}
                      onChange={(status) => {
                        void handleStatusChange(order, status);
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <AdminPagination
            page={page}
            totalPages={totalPages}
            summary={summary}
            disabled={loading}
            onPageChange={(nextPage) => setPage(Math.min(Math.max(nextPage, 1), totalPages))}
          />
        </>
      )}
    </section>
  );
};

export default AdminOrders;
