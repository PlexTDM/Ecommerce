import type { ProductRating } from "@/types";

export { getFullImage } from "@/lib/images";

/** Star levels used by the legacy scraped rating buckets. */
const STAR_LEVELS = ["1", "2", "3", "4", "5"] as const;

export interface RatingStats {
  average: number;
  votes: number;
}

/**
 * Weighted rating average and vote count for a product. Handles both stored
 * shapes: `{ stars, count }` entries and legacy `{ "1": n, ... "5": n }` buckets.
 */
export const ratingStats = (ratings: ProductRating[] | undefined): RatingStats => {
  if (!ratings || ratings.length === 0) {
    return { average: 0, votes: 0 };
  }

  let weightedStars = 0;
  let votes = 0;

  const add = (stars: number, count: number) => {
    if (!Number.isFinite(stars) || !Number.isFinite(count) || count <= 0) return;
    weightedStars += stars * count;
    votes += count;
  };

  for (const rating of ratings) {
    if (!rating || typeof rating !== "object") continue;

    const legacyStars = Number(rating.stars);
    const legacyCount = Number(rating.count);

    if (Number.isFinite(legacyStars) && legacyStars > 0 && Number.isFinite(legacyCount)) {
      add(legacyStars, legacyCount);
      continue;
    }

    for (const level of STAR_LEVELS) {
      add(Number(level), Number(rating[level]));
    }
  }

  return { average: votes > 0 ? weightedStars / votes : 0, votes };
};

export const calculateAverageRating = (ratings: ProductRating[] | undefined): number =>
  ratingStats(ratings).average;

export const totalVotes = (ratings: ProductRating[] | undefined): number =>
  ratingStats(ratings).votes;

export const parseUrlParts = (url: string | undefined, size?: string): string => {
  if (!url) return "";
  if (size) {
    return url.replace(/\/ex\/\d+\.\d+\//, `/ex/${size}/`);
  }
  return url.replace(/\/ex\/\d+\.\d+\//, "/ex/256.256/");
};
