import { useEffect, useRef, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChevronRight,
  Home,
  LayoutGrid,
  LogOut,
  Mail,
  Package,
  ShieldCheck,
  ShoppingCart,
  User,
  type LucideIcon,
} from "lucide-react";
import Search from "./Search";
import type { PublicUser } from "@/types";

interface NavigationItem {
  label: string;
  to: string;
  Icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}

const isProductsPath = (pathname: string): boolean =>
  pathname === "/products" || pathname.startsWith("/products/") || pathname.startsWith("/product/");

const NAV_ITEMS: readonly NavigationItem[] = [
  {
    label: "Home",
    to: "/",
    Icon: Home,
    isActive: (pathname) => pathname === "/",
  },
  {
    label: "Products",
    to: "/products",
    Icon: Package,
    isActive: isProductsPath,
  },
  {
    label: "Categories",
    to: "/categories",
    Icon: LayoutGrid,
    isActive: (pathname) => pathname.startsWith("/categories"),
  },
  {
    label: "Contact",
    to: "/contact",
    Icon: Mail,
    isActive: (pathname) => pathname.startsWith("/contact"),
  },
];

interface MobileNavProps {
  open: boolean;
  pathname: string;
  cartCount: number;
  user: PublicUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  displayName: string;
  avatarInitial: string;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => Promise<void>;
}

const MobileNav = ({
  open,
  pathname,
  cartCount,
  user,
  isAuthenticated,
  isAdmin,
  displayName,
  avatarInitial,
  onToggle,
  onClose,
  onLogout,
}: MobileNavProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    sheetRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && sheetRef.current?.contains(event.target)) return;
      onClose();
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const handleDesktop = () => {
      if (desktopQuery.matches) onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    desktopQuery.addEventListener("change", handleDesktop);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      desktopQuery.removeEventListener("change", handleDesktop);
    };
  }, [onClose, open]);

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !sheetRef.current) return;

    const focusable = Array.from(
      sheetRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
    ).filter((element) => element.offsetParent !== null);

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!first || !last) return;

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  };

  const cartLabel = `${cartCount} ${cartCount === 1 ? "item" : "items"}`;

  return (
    <>
      <div className="flex items-center gap-0.5 lg:hidden">
        <Search />

        <Link
          to="/cart"
          aria-label={`Cart (${cartLabel})`}
          className="noEffect relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-indigo-600"
        >
          <ShoppingCart className="h-6 w-6" />
          {cartCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-orange-400 px-1 text-[10px] font-bold leading-none text-white">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-600"
        >
          <span
            aria-hidden="true"
            className="flex h-5 w-5 flex-col items-center justify-center gap-1.5"
          >
            <span
              className={`h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ${
                open ? "translate-y-1 rotate-45" : ""
              }`}
            />
            <span
              className={`h-0.5 w-5 rounded-full bg-current transition-transform duration-300 ${
                open ? "-translate-y-1 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="mobile-navigation"
              className="fixed inset-0 z-70 flex h-dvh w-full items-end justify-center lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <button
                type="button"
                aria-hidden="true"
                tabIndex={-1}
                onClick={onClose}
                className="absolute inset-0 h-full w-full cursor-default bg-slate-950/45 backdrop-blur-[2px]"
              />

              <motion.div
                ref={sheetRef}
                id="mobile-navigation"
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation"
                tabIndex={-1}
                onKeyDown={trapFocus}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 360, damping: 36 }
                }
                className="relative max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-t-[28px] bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-24px_60px_-20px_rgba(15,23,42,0.45)] outline-none"
              >
                <div className="sticky top-0 z-10 bg-white/95 px-4 pt-3">
                  <div aria-hidden="true" className="mx-auto h-1.5 w-12 rounded-full bg-gray-200" />
                </div>

                <div className="px-4 mt-3">
                  <nav aria-label="Mobile" className="grid grid-cols-2 gap-2">
                    {NAV_ITEMS.map(({ label, to, Icon, isActive }) => {
                      const active = isActive(pathname);

                      return (
                        <Link
                          key={to}
                          to={to}
                          onClick={onClose}
                          aria-current={active ? "page" : undefined}
                          className={`noEffect flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
                            active
                              ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                              : "border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200 hover:bg-white"
                          }`}
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                              active
                                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                                : "bg-white text-gray-500 shadow-sm"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="text-sm font-semibold">{label}</span>
                        </Link>
                      );
                    })}
                  </nav>

                  <Link
                    to="/cart"
                    onClick={onClose}
                    className="noEffect mt-3 flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 transition-colors hover:border-gray-200 hover:bg-white"
                  >
                    <span className="flex items-center gap-3 text-sm font-semibold text-gray-800">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-600 shadow-sm">
                        <ShoppingCart className="h-5 w-5" />
                      </span>
                      Cart
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        cartCount > 0 ? "bg-orange-400 text-white" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {cartLabel}
                    </span>
                  </Link>

                  {isAuthenticated && user ? (
                    <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                          {avatarInitial}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {displayName}
                          </p>
                          <p className="truncate text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 border-t border-gray-100 pt-2">
                        <Link
                          to="/account"
                          onClick={onClose}
                          className="noEffect flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <User className="h-4.5 w-4.5 text-gray-400" />
                          Account
                          <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
                        </Link>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={onClose}
                            className="noEffect flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <ShieldCheck className="h-4.5 w-4.5 text-gray-400" />
                            Admin dashboard
                            <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            void onLogout();
                          }}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          <LogOut className="h-4.5 w-4.5" />
                          Logout
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl bg-slate-900 p-4 text-white">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                          <User className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">Welcome to AniMerch</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                            Sign in to track orders and save your addresses.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Link
                          to="/login"
                          onClick={onClose}
                          className="noEffect rounded-xl bg-white px-3 py-2.5 text-center text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
                        >
                          Sign in
                        </Link>
                        <Link
                          to="/register"
                          onClick={onClose}
                          className="noEffect rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10"
                        >
                          Create account
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
};

export default MobileNav;
