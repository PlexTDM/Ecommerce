import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { motion } from "motion/react";
import { fetchAdminStats, getAdminApiErrorMessage } from "../../api/admin";
import type { AdminStats } from "../../types/admin";
import Spinner from "./Spinner";
import { AlertIcon, BoxIcon, ClockIcon, CurrencyIcon, ReceiptIcon, RefreshIcon } from "./icons";
import { formatCurrency, formatNumber } from "./format";

interface StatCard {
  label: string;
  value: string;
  hint: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconClass: string;
  glowClass: string;
}

const OverviewSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" aria-hidden="true">
    {Array.from({ length: 5 }, (_, index) => (
      <div
        key={index}
        className="animate-pulse rounded-2xl border border-white/5 bg-slate-900/60 p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-full space-y-3">
            <div className="h-3 w-24 rounded-full bg-white/5" />
            <div className="h-8 w-20 rounded-lg bg-white/10" />
          </div>
          <div className="h-10 w-10 rounded-xl bg-white/5" />
        </div>
        <div className="mt-4 h-3 w-28 rounded-full bg-white/5" />
      </div>
    ))}
  </div>
);

const AdminOverview = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError("");

    fetchAdminStats(controller.signal)
      .then((value) => {
        if (active) setStats(value);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(getAdminApiErrorMessage(err, "Could not load dashboard metrics."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey]);

  const handleRetry = () => {
    setReloadKey((key) => key + 1);
  };

  const cards: StatCard[] = stats
    ? [
        {
          label: "Products",
          value: formatNumber(stats.products),
          hint: "Items in the catalog",
          Icon: BoxIcon,
          iconClass: "bg-indigo-500/15 text-indigo-300",
          glowClass: "bg-indigo-500/15",
        },
        {
          label: "Orders",
          value: formatNumber(stats.orders),
          hint: "Orders all time",
          Icon: ReceiptIcon,
          iconClass: "bg-sky-500/15 text-sky-300",
          glowClass: "bg-sky-500/15",
        },
        {
          label: "Revenue",
          value: formatCurrency(stats.revenue),
          hint: "Total order value",
          Icon: CurrencyIcon,
          iconClass: "bg-emerald-500/15 text-emerald-300",
          glowClass: "bg-emerald-500/15",
        },
        {
          label: "Pending orders",
          value: formatNumber(stats.pendingOrders),
          hint: "Awaiting a status update",
          Icon: ClockIcon,
          iconClass: "bg-amber-500/15 text-amber-300",
          glowClass: "bg-amber-500/15",
        },
        {
          label: "Low stock",
          value: formatNumber(stats.lowStock),
          hint: "Products that need attention",
          Icon: AlertIcon,
          iconClass: "bg-rose-500/15 text-rose-300",
          glowClass: "bg-rose-500/15",
        },
      ]
    : [];

  return (
    <section aria-labelledby="admin-overview-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="admin-overview-heading"
            className="text-lg font-semibold tracking-tight text-slate-100"
          >
            Store overview
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            A snapshot of catalog health, payments, and fulfillment.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRetry}
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Spinner className="h-3.5 w-3.5" /> : <RefreshIcon className="h-4 w-4" />}
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="mt-5">
        {loading && !stats ? (
          <OverviewSkeleton />
        ) : error && !stats ? (
          <div
            role="alert"
            className="flex flex-col gap-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
                <AlertIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-rose-100">Could not load metrics</h3>
                <p className="mt-1 text-sm text-rose-200/70">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-400"
            >
              <RefreshIcon className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div
                role="alert"
                className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>{error} Showing the most recent data.</span>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="w-fit rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-500/30"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {cards.map((card, index) => (
                <motion.article
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04, ease: "easeOut" }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-slate-900 to-slate-900/40 p-5 shadow-lg shadow-slate-950/30"
                >
                  <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full ${card.glowClass} blur-2xl transition-transform duration-500 group-hover:scale-125`}
                  />

                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {card.label}
                      </p>
                      <p
                        title={card.value}
                        className="mt-3 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl"
                      >
                        {card.value}
                      </p>
                    </div>
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}
                    >
                      <card.Icon className="h-5 w-5" />
                    </span>
                  </div>

                  <p className="relative mt-3 text-xs text-slate-500">{card.hint}</p>
                </motion.article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default AdminOverview;
