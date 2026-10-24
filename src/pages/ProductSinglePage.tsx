import { useState, useEffect, useRef, useContext } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { getFullImage } from "../helper/functions";
import { EasyZoomOnHover } from "easy-magnify";
import { Mousewheel } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "../custom-swiper.css";
import { useDispatch } from "react-redux";
import { addCart } from "../redux/action";
import { animate } from "motion/react";
import { Loading, StarVotes } from "../components";
import { ProductsContext } from "../context/ProductsContext";
import type { Product } from "../types";

const CDN_PREFIX = "https://resize.cdn.otakumode.com/ex/50.50/shop/product/";

const toGalleryImage = (image: string): string =>
  /^(https?:|data:|\/)/.test(image) ? image : CDN_PREFIX + image;

const ProductSinglePage = () => {
  const location = useLocation();
  const { productData } = (location?.state as { productData?: Product }) || {};

  const cartRef = useRef<HTMLDivElement>(null);
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<{
    productId: string;
    src: string;
  } | null>(null);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  const {
    productDetail,
    detailError,
    relatedProducts,
    relatedLoading,
    setRelatedProducts,
    loadProductById,
    loadRelatedProducts,
  } = useContext(ProductsContext);

  // Derive the product for this route synchronously. This prevents the
  // previous product from painting while a new detail request is in flight.
  const routeProduct = productData && productData._id === id ? productData : null;
  const activeProduct =
    routeProduct ?? (productDetail && productDetail._id === id ? productDetail : null);
  const galleryImages = activeProduct
    ? Array.from(
        new Set([activeProduct.image, ...(activeProduct.moreImages ?? [])].map(toGalleryImage)),
      )
    : [];
  const mainImage = activeProduct
    ? selectedImage && selectedImage.productId === activeProduct._id
      ? selectedImage.src
      : activeProduct.image
    : null;
  const selectedIndex = mainImage ? galleryImages.indexOf(toGalleryImage(mainImage)) : -1;
  const currentImageIndex = selectedIndex >= 0 ? selectedIndex : galleryImages.length > 0 ? 0 : -1;
  const hasPreviousImage = currentImageIndex > 0;
  const hasNextImage = currentImageIndex >= 0 && currentImageIndex < galleryImages.length - 1;

  const selectImage = (index: number) => {
    const src = galleryImages[index];

    if (!activeProduct || !src) return;

    setSelectedImage({ productId: activeProduct._id, src });
    thumbsSwiper?.slideTo(index);
  };

  const [isFlying, setIsFlying] = useState(false);
  const imgRef = useRef<HTMLButtonElement>(null);

  const mediumImg = "500.600";
  const largeImg = "1668.2500";

  const addProduct = (product: Product) => {
    dispatch(addCart(product));
  };

  useEffect(() => {
    if (!id) return;

    setSelectedImage(null);
    setQuantity(1);
    setThumbsSwiper(null);
    setRelatedProducts([]);

    const cachedProduct = productData && productData._id === id ? productData : undefined;
    void loadProductById(id, cachedProduct);
  }, [id, productData, loadProductById, setRelatedProducts]);

  useEffect(() => {
    const tag = activeProduct?.tags?.[0];
    if (!tag) return;

    void loadRelatedProducts(tag);
  }, [activeProduct?._id, loadRelatedProducts]);

  // Warm the zoom images so switching thumbnails feels instant.
  useEffect(() => {
    if (!activeProduct) return;

    const sources = [activeProduct.image, ...(activeProduct.moreImages ?? [])].map(toGalleryImage);

    sources.forEach((src) => {
      const img = new Image();
      const imgFull = new Image();
      img.src = getFullImage(src, mediumImg);
      imgFull.src = getFullImage(src, largeImg);
    });
  }, [activeProduct]);

  const handleAddToCart = (e: React.MouseEvent) => {
    if (isFlying || !activeProduct) return;

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
    floatingButton.src = activeProduct.image;
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
          addProduct({ ...activeProduct, qty: quantity } as Product & {
            qty: number;
          });
        },
      },
    );
  };

  if (!activeProduct) {
    if (!id || detailError) {
      return (
        <div className="container-custom py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <p className="mb-8">The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/products" className="btn btn-primary">
            Back to Products
          </Link>
        </div>
      );
    }

    return (
      <div className="container-custom py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  const description = activeProduct.description ?? {};

  return (
    <div className="container-sp py-4 mx-auto overflow-x-hidden">
      <div ref={cartRef} className="absolute -top-20 -right-40 opacity-0" />

      {/* Breadcrumbs */}
      <nav className="mb-4">
        <ol className="flex text-sm pl-4">
          <li className="flex items-center">
            <Link to="/" className="text-gray-500 hover:text-primary noEffect">
              Home
            </Link>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mx-2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li className="flex items-center">
            <Link to="/products" className="text-gray-500 hover:text-primary noEffect">
              Products
            </Link>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mx-2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li className="text-gray-700 font-medium truncate">{activeProduct.title}</li>
        </ol>
      </nav>

      {/* Product Details */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="md:flex">
          {/* Images */}
          <div className="p-6 pr-0 flex gap-3 relative z-50 h-150">
            <div className="flex h-full w-16 shrink-0 flex-col items-center gap-2">
              <button
                type="button"
                aria-label="Previous product image"
                onClick={() => selectImage(currentImageIndex - 1)}
                disabled={!hasPreviousImage}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 15l-6-6-6 6"
                  />
                </svg>
              </button>

              <Swiper
                key={activeProduct._id}
                direction="vertical"
                slidesPerView="auto"
                spaceBetween={8}
                mousewheel={true}
                modules={[Mousewheel]}
                observer={true}
                observeParents={true}
                resizeObserver={true}
                speed={500}
                className="min-h-0 w-full flex-1"
                onSwiper={setThumbsSwiper}
                onSlideChange={(swiper) => {
                  const src = galleryImages[swiper.activeIndex];

                  if (src && activeProduct) {
                    setSelectedImage({ productId: activeProduct._id, src });
                  }
                }}
              >
                {galleryImages.map((src, i) => {
                  return (
                    <SwiperSlide
                      key={`${activeProduct._id}-${i}`}
                      className="h-16! w-16 select-none"
                    >
                      <button
                        type="button"
                        aria-label={`View image ${i + 1}`}
                        aria-pressed={mainImage === src}
                        onClick={() => selectImage(i)}
                        className={`block h-16 w-16 overflow-hidden rounded-md border-2 ${
                          mainImage === src ? "border-blue-500" : "border-transparent"
                        }`}
                      >
                        <img
                          src={src}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    </SwiperSlide>
                  );
                })}
              </Swiper>

              <button
                type="button"
                aria-label="Next product image"
                onClick={() => selectImage(currentImageIndex + 1)}
                disabled={!hasNextImage}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 9l6 6 6-6"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4 relative z-40 h-150 min-w-125">
              {mainImage && (
                <EasyZoomOnHover
                  key={`${activeProduct._id}:${mainImage}`}
                  mainImage={{
                    alt: activeProduct.title,
                    src: getFullImage(mainImage, mediumImg),
                  }}
                  zoomImage={{
                    src: getFullImage(mainImage, largeImg),
                  }}
                  zoomFactor={2.5}
                  zoomContainerWidth={500}
                  zoomContainerHeight={600}
                  distance={1}
                />
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="md:w-1/2 p-6 md:p-8 relative z-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-text mb-2">
                {activeProduct.title}
              </h1>
              <StarVotes product={activeProduct} />

              <p className="text-3xl font-bold text-primary mb-6">${activeProduct.price}</p>

              <p
                className="text-gray-600 mb-6"
                dangerouslySetInnerHTML={{
                  __html: description.body1 ?? "",
                }}
              />

              {/* Quantity */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Quantity</h3>
                <div className="flex items-center">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-l-md flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 h-10 border-t border-b border-gray-300 text-center focus:outline-none appearance-none"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-gray-300 rounded-r-md flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                <span
                  className={`inline-flex items-center ${
                    activeProduct.inStock ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={activeProduct.inStock ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"}
                    />
                  </svg>
                  {activeProduct.inStock ? "Available For Purchase" : "Out of Stock"}
                </span>
              </div>

              {/* Add to Cart Button */}
              <div className="flex space-x-4">
                <button
                  className="bg-blue-600 rounded-lg font-bold text-lg text-white grow cursor-pointer active:brightness-75 duration-200"
                  disabled={!activeProduct.inStock}
                  onClick={handleAddToCart}
                  ref={imgRef}
                >
                  Add to Cart
                </button>

                <button className="w-12 h-12 rounded-md border cursor-pointer border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        {description.body2 && (
          <div className="border-t border-gray-200 px-12 md:p-4 md:px-6 mt-10">
            <h2 className="text-xl font-bold mb-4">Description</h2>
            <div>
              <p
                className="text-gray-700 mb-6"
                dangerouslySetInnerHTML={{
                  __html: description.body2 ?? "",
                }}
              />
              {description.warning && (
                <p
                  className="text-gray-600 mb-6 text-sm"
                  dangerouslySetInnerHTML={{
                    __html: description.warning ?? "",
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Related Products */}
      <div className="mt-12 px-6">
        <h2 className="text-2xl font-bold mb-6 max-md:text-center">Related Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 max-lg:px-4">
          {relatedProducts
            ?.filter((product) => product._id !== activeProduct._id)
            .map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg"
              >
                <Link to={`/product/${product._id}`} state={{ productData: product }}>
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.title}
                      loading="lazy"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-text mb-1 truncate">
                      {product.title}
                    </h3>
                    <StarVotes product={product} />
                    <span className="text-primary font-bold">${product.price.toFixed(2)}</span>
                  </div>
                </Link>
              </div>
            ))}
          {relatedLoading &&
            Array(6)
              .fill(null)
              .map((_, i) => <Loading key={i} />)}
        </div>
      </div>
    </div>
  );
};

export default ProductSinglePage;
