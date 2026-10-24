import { Link } from "react-router-dom";
import type { Product } from "../types";
import { imageAt, imageSrcSet, type ImageVariant } from "../lib/images";
import StarVotes from "./StarVotes";

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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg">
      <Link to={`/product/${_id}`} state={{ productData: product }} className="block">
        <div className="relative">
          <img
            src={imageAt(image, imageSize ?? "256.256")}
            srcSet={imageSrcSet(image, CARD_IMAGE_SOURCES) || undefined}
            sizes="(min-width: 1024px) 20vw, 50vw"
            alt={title}
            width={400}
            height={256}
            className="w-full h-64 object-cover"
            loading="lazy"
            decoding="async"
          />
          {product.isNewProduct && (
            <div className="absolute -rotate-45 top-1 left-1 bg-accent rounded-full w-10 h-10 flex items-center justify-center text-white">
              <p className="mb-1 uppercase text-sm">New</p>
            </div>
          )}
        </div>

        <div className="p-4 pb-0">
          <h3 className="font-semibold text-text mb-1 truncate">{title}</h3>
          <StarVotes product={product} />

          <div className="flex justify-between gap-2 items-center">
            <div className="xl:flex xl:gap-3">
              {discount ? (
                <p className="line-through text-gray-500 text-sm">${price}</p>
              ) : (
                <p className="text-red-600">${price}</p>
              )}
              {discount && (
                <p className="flex items-center gap-2 text-red-600">
                  ${Math.round(price * (1 - discount / 100) * 100) / 100}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <Link
          to={`/product/${_id}`}
          state={{ productData: product }}
          className="inline-flex w-full items-center justify-center bg-primary px-3 py-1.5 text-sm text-white rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
