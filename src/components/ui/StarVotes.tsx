import { Star } from "lucide-react";
import { ratingStats } from "@/helper/functions";
import type { Product } from "@/types";

const StarVotes = ({ product }: { product: Product }) => {
  const { average, votes } = ratingStats(product.ratings);

  return (
    <div className="flex items-center mb-2">
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < Math.floor(average) ? "text-yellow-400" : "text-gray-300"}`}
            fill="currentColor"
            strokeWidth={0}
          />
        ))}
      </div>
      <span className="text-gray-500 text-xs ml-1">({votes})</span>
    </div>
  );
};

export default StarVotes;
