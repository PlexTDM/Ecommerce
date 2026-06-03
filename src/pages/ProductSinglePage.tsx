import { useState, useEffect, useRef, useContext } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { getFullImage } from "../helper/functions";
import { EasyZoomOnHover } from "easy-magnify";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "../custom-swiper.css";
import { useDispatch } from "react-redux";
import { addCart } from "../redux/action";
import { animate } from "motion/react";
import { Loading, StarVotes } from "../components";
import { ProductsContext } from "../context/ProductsContext";
import type { Product } from "../types";

const ProductSinglePage = () => {
  const location = useLocation();
  const { productData } = (location?.state as { productData?: Product }) || {};

  const cartRef = useRef<HTMLDivElement>(null);
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState<string | null>(null);

  const {
    productDetail,
    detailLoading,
    relatedProducts,
    relatedLoading,
    loadProductById,
    loadRelatedProducts,
  } = useContext(ProductsContext);

  const [isFlying, setIsFlying] = useState(false);
  const imgRef = useRef<HTMLButtonElement>(null);

  const mediumImg = "500.600";
  const largeImg = "1668.2500";

  const addProduct = (product: Product) => {
    dispatch(addCart(product));
  };

  useEffect(() => {
    setMainImage(null);

    if (id) {
      if (productData) {
        loadProductById(id, productData);
        if (productData.tags?.[0]) {
          loadRelatedProducts(productData.tags[0]);
        }
      } else {
        loadProductById(id);
      }
    }
  }, [id]);

  useEffect(() => {
    if (!productDetail) return;
    setMainImage(productDetail.image);

    if (
      !productData &&
      productDetail.tags?.[0] &&
      relatedProducts.length === 0 &&
      !relatedLoading
    ) {
      loadRelatedProducts(productDetail.tags[0]);
    }
  }, [productDetail]);

  useEffect(() => {
    if (!productDetail) return;
    productDetail.moreImages?.forEach((src) => {
      const img = new Image();
      const imgFull = new Image();
      img.src = getFullImage(
        "https://resize.cdn.otakumode.com/ex/50.50/shop/product/" + src,
        mediumImg,
      );
      imgFull.src = getFullImage(
        "https://resize.cdn.otakumode.com/ex/50.50/shop/product/" + src,
        largeImg,
      );
    });
  }, [productDetail]);

  const handleAddToCart = (e: React.MouseEvent) => {
    if (isFlying || !productDetail) return;

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
    floatingButton.src = productDetail.image;
    floatingButton.style.left = `${
      button.left + button.width / 2 - 24 + scrollX
    }px`;
    floatingButton.style.top = `${
      button.top + button.height / 2 - 24 + scrollY
    }px`;

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
          addProduct({ ...productDetail, qty: quantity } as Product & {
            qty: number;
          });
        },
      },
    );
  };

  if (detailLoading) {
    return (
      <div className="container-custom py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!productDetail) {
    return (
      <div className="container-custom py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="mb-8">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/products" className="btn btn-primary">
          Back to Products
        </Link>
      </div>
    );
  }

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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </li>
          <li className="flex items-center">
            <Link
              to="/products"
              className="text-gray-500 hover:text-primary noEffect"
            >
              Products
            </Link>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mx-2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </li>
          <li className="text-gray-700 font-medium truncate">
            {productDetail.title}
          </li>
        </ol>
      </nav>

      {/* Product Details */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="md:flex">
          {/* Images */}
          <div className="p-6 pr-0 flex gap-3 relative z-50 h-150">
            <Swiper
              slidesPerView={6}
              mousewheel={true}
              direction="vertical"
              modules={[Navigation]}
              navigation={true}
              slidesPerGroup={5}
              speed={700}
              className="h-full min-w-16"
            >
              {productDetail.moreImages?.map((img, i) => {
                const src =
                  "https://resize.cdn.otakumode.com/ex/50.50/shop/product/" +
                  img;
                return (
                  <SwiperSlide key={i} className="w-16 h-16 select-none">
                    <img
                      src={src}
                      alt={`Thumbnail ${i + 1}`}
                      loading="lazy"
                      className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 ${
                        mainImage === src
                          ? "border-blue-500"
                          : "border-transparent"
                      }`}
                      onClick={() => setMainImage(src)}
                    />
                  </SwiperSlide>
                );
              })}
              <SwiperSlide className="w-16 h-0! select-none" />
            </Swiper>
            <div className="mb-4 relative z-40 h-150 min-w-125">
              {mainImage && !detailLoading && (
                <EasyZoomOnHover
                  mainImage={{
                    alt: productDetail.title,
                    src: getFullImage(mainImage, mediumImg),
                  }}
                  zoomImage={{
                    src: getFullImage(mainImage, largeImg),
                  }}
                  zoomLensScale={2}
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
                {productDetail.title}
              </h1>
              <StarVotes product={productDetail} />

              <p className="text-3xl font-bold text-primary mb-6">
                ${productDetail.price}
              </p>

              <p
                className="text-gray-600 mb-6"
                dangerouslySetInnerHTML={{
                  __html: productDetail.description.body1,
                }}
              />

              {/* Quantity */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </h3>
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
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
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
                    productDetail.inStock > 0
                      ? "text-green-600"
                      : "text-red-600"
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
                      d={
                        productDetail.inStock > 0
                          ? "M5 13l4 4L19 7"
                          : "M6 18L18 6M6 6l12 12"
                      }
                    />
                  </svg>
                  {productDetail.inStock
                    ? "Available For Purchase"
                    : "Out of Stock"}
                </span>
              </div>

              {/* Add to Cart Button */}
              <div className="flex space-x-4">
                <button
                  className="bg-blue-600 rounded-lg font-bold text-lg text-white grow cursor-pointer active:brightness-75 duration-200"
                  disabled={!productDetail.inStock}
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
        {productDetail.description.body2 && (
          <div className="border-t border-gray-200 px-12 md:p-4 md:px-6 mt-10">
            <h2 className="text-xl font-bold mb-4">Description</h2>
            <div>
              <p
                className="text-gray-700 mb-6"
                dangerouslySetInnerHTML={{
                  __html: productDetail.description.body2,
                }}
              />
              {productDetail.description.warning && (
                <p
                  className="text-gray-600 mb-6 text-sm"
                  dangerouslySetInnerHTML={{
                    __html: productDetail.description.warning,
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Related Products */}
      <div className="mt-12 px-6">
        <h2 className="text-2xl font-bold mb-6 max-md:text-center">
          Related Products
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 max-lg:px-4">
          {relatedProducts?.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg"
            >
              <Link to={`/product/${product._id}`}>
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-text mb-1 truncate">
                    {product.title}
                  </h3>
                  <StarVotes product={product} />
                  <span className="text-primary font-bold">
                    ${product.price.toFixed(2)}
                  </span>
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
