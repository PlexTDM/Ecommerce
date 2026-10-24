import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addCart } from "@/redux/action";
import { SideSearchBar, Pagination, StarVotes } from "@/components";
import { ProductCardSkeleton } from "@/components/ui/skeletons";
import { animate, motion } from "motion/react";
import { Search, ShoppingCart, X } from "lucide-react";
import { imageAt, imageSrcSet, type ImageVariant } from "@/lib/images";
import { ProductsContext } from "@/context/ProductsContext";
import type { Product as ProductType } from "@/types";

const GRID_IMAGE_SOURCES: readonly ImageVariant[] = [
  { width: 256, size: "256.256" },
  { width: 400, size: "400.400" },
  { width: 600, size: "600.600" },
];

const GRID_IMAGE_SIZES =
  "(min-width: 1280px) 18vw, (min-width: 1024px) 22vw, (min-width: 864px) 30vw, 45vw";

const Product = () => {
  const { page = "1" } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q")?.trim() ?? "";
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const {
    products,
    productsLoading,
    totalPages,
    totalProducts,
    notFound,
    loadProducts,
    searchProducts,
    filterProducts,
  } = useContext(ProductsContext);

  const addProduct = (product: ProductType) => {
    dispatch(addCart(product));
  };

  const currentPage = parseInt(page, 10);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery) {
      void searchProducts(searchQuery);
    } else {
      void loadProducts(currentPage);
    }
  }, [currentPage, loadProducts, searchProducts, searchQuery]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchInput.trim();
    void navigate(query ? `/products?q=${encodeURIComponent(query)}` : "/products", {
      replace: true,
    });

    // Navigating to the same URL does not retrigger the data effect.
    if (query && query === searchQuery && currentPage === 1) {
      void searchProducts(query);
    }
  };

  const clearSearch = () => {
    setSearchInput("");

    if (!searchQuery) return;

    void navigate("/products", { replace: true });
  };

  const handleFilterChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const merged = {
      ...Object.fromEntries(searchParams.entries()),
      ...filters,
      [name]: `0,${value}`,
    };
    const queryString = new URLSearchParams(merged).toString();
    void filterProducts(Object.fromEntries(new URLSearchParams(queryString)));
  };

  const handleCustomPrice = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const minPrice = (form.elements.namedItem("minPrice") as HTMLInputElement).value;
    const maxPrice = (form.elements.namedItem("maxPrice") as HTMLInputElement).value;
    if (minPrice || maxPrice) setFilters({ ...filters, price: `${minPrice},${maxPrice}` });
  };

  const ShowProduct = ({ product }: { product: ProductType }) => {
    const [isFlying, setIsFlying] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    const handleAddToCart = (e: React.MouseEvent) => {
      if (isFlying) return;

      setIsFlying(true);

      const button = (e.target as HTMLElement).getBoundingClientRect();
      const cart = document.getElementById("cart")?.getBoundingClientRect();

      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      if (!cart) return;

      const floatingButton = document.createElement("img");
      floatingButton.className =
        "fixed w-12 h-12 bg-blue-500 text-white flex items-center justify-center rounded-full shadow-lg";
      document.body.appendChild(floatingButton);
      floatingButton.src = product.image;
      floatingButton.style.left = `${button.left + button.width / 2 - 24 + scrollX}px`;
      floatingButton.style.top = `${button.top + button.height / 2 - 24 + scrollY}px`;

      animate(
        floatingButton,
        {
          left: cart.left + cart.width / 2 - 24 + scrollX,
          top: cart.top + cart.height / 2 - 24 + scrollY,
          scale: 0,
        },
        {
          duration: 0.6,
          ease: "easeInOut",
          onComplete: () => {
            floatingButton.remove();
            setIsFlying(false);
            addProduct({ ...product });
          },
        },
      );
    };

    const discount = Number(product.discount) || 0;
    const effectivePrice =
      discount > 0
        ? Math.round((product.price * (1 - discount / 100) + Number.EPSILON) * 100) / 100
        : product.price;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
      >
        <div className="relative overflow-hidden bg-gray-50">
          <Link
            to={`/product/${product._id}`}
            state={{ productData: product }}
            className="block aspect-square w-full overflow-hidden"
          >
            <img
              src={imageAt(product.image, "400.400")}
              srcSet={imageSrcSet(product.image, GRID_IMAGE_SOURCES) || undefined}
              sizes={GRID_IMAGE_SIZES}
              alt={product.title}
              width={400}
              height={400}
              ref={imgRef}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2">
            {product.isNewProduct ? (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                New
              </span>
            ) : (
              <span />
            )}
            {discount > 0 ? (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                -{discount}%
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            aria-label="Add to cart"
            title="Add to cart"
            className="absolute bottom-2 right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-gray-800 shadow-md backdrop-blur transition-all hover:bg-indigo-600 hover:text-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          >
            <ShoppingCart className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <Link
            to={`/product/${product._id}`}
            state={{ productData: product }}
            className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-text transition-colors hover:text-primary sm:text-base"
          >
            {product.title}
          </Link>

          <div className="mt-1">
            <StarVotes product={product} />
          </div>

          <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-2">
            {discount > 0 ? (
              <>
                <span className="text-sm font-bold text-rose-600 sm:text-base">
                  ${effectivePrice}
                </span>
                <span className="text-xs text-gray-400 line-through">${product.price}</span>
              </>
            ) : (
              <span className="text-sm font-bold text-text sm:text-base">${product.price}</span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-12 sm:pb-16">
      <div className="mx-auto w-full max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-10">
        <h1 className="sr-only">Products</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>Products</p>
          <form
            onSubmit={handleSearchSubmit}
            role="search"
            className="w-full sm:max-w-2xl sm:flex-1"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
                autoComplete="off"
                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-32 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 [&::-webkit-search-cancel-button]:hidden"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-24 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
              {productsLoading
                ? Array.from({ length: 10 }, (_, index) => <ProductCardSkeleton key={index} />)
                : products?.map((p) => <ShowProduct key={p.id} product={p} />)}

              {notFound && (
                <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
                    <Search className="h-6 w-6" />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold text-text">No products found</h2>
                  <p className="mt-1 max-w-sm text-sm text-gray-500">
                    {searchQuery
                      ? `We couldn't find anything for “${searchQuery}”.`
                      : "Try adjusting your filters or browse the full catalog."}
                  </p>
                  <Link
                    to="/products"
                    className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                  >
                    Browse all products
                  </Link>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination pages={totalPages} page={currentPage} />
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <SideSearchBar
              onFilterChange={handleFilterChange}
              onSubmit={handleCustomPrice}
              productsLength={totalProducts}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;
