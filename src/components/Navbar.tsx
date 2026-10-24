import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, type LinkProps } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "motion/react";
import { ChevronDown, ShoppingCart, User } from "lucide-react";
import Search from "./Search";
import MobileNav from "./MobileNav";
import { RootState } from "@/redux/store";
import { logout } from "@/api";
import { useAuth } from "@/hooks/useAuth";

const StyledLink = (props: LinkProps) => {
  return (
    <Link {...props} className="text-text hover:text-primary transition-colors">
      {props.children}
    </Link>
  );
};

const Navbar = () => {
  const state = useSelector((state: RootState) => state.handleCart);
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const displayName = user?.username?.trim() || user?.email || "";
  const avatarInitial = displayName.charAt(0).toUpperCase() || "?";

  const closeMenus = useCallback(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen((open) => !open);
    setIsUserMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close any open menu after navigating to another route.
  useEffect(() => {
    closeMenus();
  }, [closeMenus, location.pathname, location.search]);

  // Close the desktop account menu on outside click or Escape.
  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) return;
      if (navRef.current?.contains(target)) return;

      closeMenus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenus, isUserMenuOpen]);

  const handleLogout = async (): Promise<void> => {
    closeMenus();

    try {
      await logout();
    } finally {
      void navigate("/");
    }
  };

  const maxScroll = 200;
  const progress = Math.min(scrollY / maxScroll, 1);
  const bgOpacity = 0.85 - progress * 0.6;
  const navWidth = 100 - progress * 10;

  return (
    <motion.nav
      className="shadow-md py-3 sticky top-0 z-50 mx-auto"
      animate={{
        backgroundColor: `rgba(255, 255, 255, ${bgOpacity})`,
        width: `${navWidth}%`,
        borderRadius: progress > 0.05 ? "0 0 20px 20px" : "0 0 10px 10px",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div ref={navRef} className="max-w-7xl mx-auto flex flex-col px-4 w-full">
        <div className="flex items-center justify-between w-full">
          <Link to="/" className="text-2xl font-bold text-primary noEffect">
            AniMerch
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <StyledLink to="/">Home</StyledLink>
            <StyledLink to="/products">Products</StyledLink>
            <StyledLink to="/categories">Categories</StyledLink>
            <StyledLink to="/contact">Contact</StyledLink>
            <Search />
          </div>

          <div className="hidden lg:flex items-center space-x-4">
            <Link
              to="/cart"
              id="cart"
              className="p-2 text-gray-500 hover:text-primary relative group"
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute opacity-80 group-hover:opacity-100 duration-200 -top-1 -right-1 bg-orange-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {state.length}
              </span>
            </Link>

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  aria-label="Account menu"
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white/80 py-1 pl-1 pr-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                    {avatarInitial}
                  </span>
                  <span className="max-w-28 truncate font-medium">{displayName}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Account menu"
                    className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 text-sm shadow-xl"
                  >
                    <div className="border-b border-gray-100 px-4 pb-2">
                      <p className="truncate font-semibold text-gray-900">{displayName}</p>
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      to="/account"
                      role="menuitem"
                      className="noEffect block px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                      onClick={closeMenus}
                    >
                      Account
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        role="menuitem"
                        className="noEffect block px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                        onClick={closeMenus}
                      >
                        Admin dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        void handleLogout();
                      }}
                      className="block w-full px-4 py-2 text-left text-red-600 transition-colors hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/account" className="p-2 text-gray-500 hover:text-primary">
                  <User className="h-6 w-6" />
                </Link>
                <Link
                  to="/login"
                  className="noEffect px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="noEffect px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <MobileNav
            open={isMenuOpen}
            pathname={location.pathname}
            cartCount={state.length}
            user={user}
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            displayName={displayName}
            avatarInitial={avatarInitial}
            onToggle={toggleMenu}
            onClose={closeMenus}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
