import { Link } from "react-router-dom";
import type { Product } from "@/types";
import { imageAt, imageSrcSet, type ImageVariant } from "@/lib/images";
import StarVotes from "@/components/StarVotes";

export interface ProductCardProps {
  product: Product;
  imageSize?: string;
}

const CARD_IMAGE_SOURCES: readonly ImageVariant[] = [
  { width: 256, size: "256.256" },
  { width: 400, size: "400.400" },
  { width: 600, size: "600.600" },
];

const ProductCard = ({ product, imageSize }: ProductCardProps) => {
  const { _id, title, price, image, discount } = product;
  const effectivePrice = discount
    ? Math.round((price * (1 - discount / 100) + Number.EPSILON) * 100) / 100
    : price;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/product/${_id}`} state={{ productData: product }} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={imageAt(image, imageSize ?? "256.256")}
            srcSet={imageSrcSet(image, CARD_IMAGE_SOURCES) || undefined}
            sizes="(min-width: 1024px) 20vw, 50vw"
            alt={title}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {product.isNewProduct && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                New
              </span>
            )}
            {discount ? (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                -{discount}%
              </span>
            ) : null}
          </div>
        </div>

        <div className="p-3 sm:p-4">
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-text sm:text-base">
            {title}
          </h3>
          <div className="mt-1">
            <StarVotes product={product} />
          </div>

          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            {discount ? (
              <>
                <span className="text-base font-bold text-rose-600">${effectivePrice}</span>
                <span className="text-xs text-gray-400 line-through">${price}</span>
              </>
            ) : (
              <span className="text-base font-bold text-text">${price}</span>
            )}
          </div>
        </div>
      </Link>

      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <Link
          to={`/product/${_id}`}
          state={{ productData: product }}
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary/90 sm:text-sm"
        >
          View details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
