import { useState, type ComponentType, type SVGProps } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion } from "motion/react";
import AdminOverview from "../components/admin/AdminOverview";
import AdminProducts from "../components/admin/AdminProducts";
import AdminOrders from "../components/admin/AdminOrders";
import { BoxIcon, ChartIcon, ReceiptIcon, ShieldIcon } from "../components/admin/icons";
import type { AdminTabId } from "../types/admin";

interface AdminTab {
  id: AdminTabId;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const TABS: AdminTab[] = [
  { id: "overview", label: "Overview", Icon: ChartIcon },
  { id: "products", label: "Products", Icon: BoxIcon },
  { id: "orders", label: "Orders", Icon: ReceiptIcon },
];

const AdminPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTabId>("overview");

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center shadow-2xl shadow-black/40"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/25 bg-indigo-500/10 text-indigo-300">
            <ShieldIcon className="h-7 w-7" />
          </span>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">
            Admin access required
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            {user
              ? `You are signed in as ${user.email}, but this account does not have admin access.`
              : "Sign in with an administrator account to open the dashboard."}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition-colors hover:bg-indigo-400"
            >
              Sign in
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
            >
              Back to store
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const displayName = user.username?.trim() || "Administrator";
  const initial = (user.username?.trim() || user.email).charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 scheme-dark selection:bg-indigo-500/30">
      <div className="relative overflow-hidden">
        <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200">
                  <ShieldIcon className="h-3.5 w-3.5" />
                  Admin console
                </span>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Store dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
                  Manage products, inventory, orders, and store performance from one place.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 lg:self-auto">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold uppercase text-indigo-200">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{displayName}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
            </div>
          </header>

          <nav
            aria-label="Admin sections"
            role="tablist"
            className="mt-6 flex w-full gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 p-1.5 backdrop-blur sm:w-fit"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.Icon;

              return (
                <button
                  key={tab.id}
                  id={`admin-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`admin-panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative shrink-0 cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                >
                  {isActive && (
                    <motion.span
                      layoutId="admin-active-tab"
                      className="absolute inset-0 rounded-xl bg-indigo-500 shadow-lg shadow-indigo-950/40"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span
                    className={`relative z-10 flex items-center gap-2 ${
                      isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <TabIcon className="h-4 w-4" />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div
            id="admin-panel-overview"
            role="tabpanel"
            aria-labelledby="admin-tab-overview"
            hidden={activeTab !== "overview"}
            className="mt-6"
          >
            <AdminOverview active={activeTab === "overview"} />
          </div>
          <div
            id="admin-panel-products"
            role="tabpanel"
            aria-labelledby="admin-tab-products"
            hidden={activeTab !== "products"}
            className="mt-6"
          >
            <AdminProducts active={activeTab === "products"} />
          </div>
          <div
            id="admin-panel-orders"
            role="tabpanel"
            aria-labelledby="admin-tab-orders"
            hidden={activeTab !== "orders"}
            className="mt-6"
          >
            <AdminOrders active={activeTab === "orders"} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
