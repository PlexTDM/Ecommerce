import { Star } from "lucide-react";
import { calculateAverageRating, totalVotes } from "@/helper/functions";
import type { Product } from "@/types";

const StarVotes = ({ product }: { product: Product }) => {
  const { ratings } = product;
  return (
    <div className="flex items-center mb-2">
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < Math.floor(calculateAverageRating(ratings)) ? "text-yellow-400" : "text-gray-300"}`}
            fill="currentColor"
            strokeWidth={0}
          />
        ))}
      </div>
      <span className="text-gray-500 text-xs ml-1">({totalVotes(ratings)})</span>
    </div>
  );
};

export default StarVotes;
