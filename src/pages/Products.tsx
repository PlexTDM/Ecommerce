import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addCart } from "../redux/action";
import { SideSearchBar, Pagination, Loading, StarVotes } from "../components";
import { animate, motion } from "motion/react";
import { imageAt, imageSrcSet, type ImageVariant } from "../lib/images";
import { ProductsContext } from "../context/ProductsContext";
import type { Product as ProductType } from "../types";

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
  const [searchParams] = useSearchParams();
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
    const q = searchParams.get("q");
    if (q) {
      void searchProducts(q);
    } else {
      void loadProducts(currentPage);
    }
  }, [page]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      void searchProducts(q);
    }
  }, [searchParams]);

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

    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{
          boxShadow: "rgba(0, 0, 0, 0.3) 0px 0px 15px 0px",
        }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{
          opacity: { duration: 0.5, ease: "easeIn" },
          y: { duration: 0.4, ease: "easeIn" },
          boxShadow: { duration: 0.2 },
        }}
        className="border border-gray-200 p-2 relative rounded-md text-sm xl:text-base"
      >
        <Link
          to={`/product/${product._id}`}
          state={{ productData: product }}
          className="relative cursor-pointer min-h-64 w-full overflow-hidden"
        >
          <img
            src="https://dzt1km7tv28ex.cloudfront.net/static/shop/product_no_image.png"
            className="absolute top-0 left-0 w-full h-full object-cover blur-md"
            alt=""
            aria-hidden="true"
            width={400}
            height={400}
            loading="lazy"
            decoding="async"
          />
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
            className="w-full h-auto min-h-43"
          />

          {product.isNewProduct && (
            <div className="absolute -rotate-45 top-1 left-1 bg-accent rounded-full w-10 h-10 flex items-center justify-center text-white">
              <p className="mb-1 uppercase text-sm">New</p>
            </div>
          )}
        </Link>

        <div className="flex flex-col grow p-2">
          <Link
            to={`/product/${product._id}`}
            state={{ productData: product }}
            className="hover:text-gray-500 max-w-full line-clamp-2 cursor-pointer duration-100"
          >
            {product.title}
          </Link>

          <StarVotes product={product} />

          {product.discount ? (
            <div>
              <p className="line-through text-gray-500 text-sm">${product.price}</p>
              <p className="flex items-center gap-2 text-red-600">
                ${Math.round(product.price * (1 - product.discount / 100) * 100) / 100}
                <span className="text-xs">({product.discount}% OFF)</span>
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-red-600">${product.price}</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          aria-label="Add to cart"
          title="Add to cart"
          className="mt-2 bg-gray-300/70 shadow-2xl absolute bottom-2 right-2 flex opacity-0 duration-100 group-hover:opacity-100 transition-all text-white p-2 items-center justify-center rounded hover:bg-gray-300 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-black"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </button>
      </motion.div>
    );
  };

  return (
    <>
      <div className="w-full px-6 md:8 lg:px-12 mx-auto mt-10 flex gap-4">
        <div className="w-full">
          <div className="w-full grid max-[864px]:grid-cols-2 grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 justify-center">
            {productsLoading
              ? Array(20)
                  .fill(null)
                  .map((_, index) => <Loading key={index} />)
              : products?.map((p) => <ShowProduct key={p.id} product={p} />)}
            {notFound && <h1>Not Found</h1>}
          </div>
          {totalPages > 1 && <Pagination pages={totalPages} page={currentPage} />}
        </div>
        <div>
          <SideSearchBar
            onFilterChange={handleFilterChange}
            onSubmit={handleCustomPrice}
            productsLength={totalProducts}
          />
        </div>
      </div>
    </>
  );
};

export default Product;
