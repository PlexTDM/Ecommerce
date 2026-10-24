import type { ProductRating } from "@/types";

export { getFullImage } from "@/lib/images";

/**
 * Computes the weighted average star rating from the server's rating buckets
 * (`{ stars, count }[]`).
 */
export const calculateAverageRating = (ratings: ProductRating[] | undefined): number => {
  if (!ratings || ratings.length === 0) {
    return 0;
  }

  let totalStars = 0;
  let totalVotes = 0;

  for (const rating of ratings) {
    const stars = Number(rating.stars);
    const count = Number(rating.count);

    if (!Number.isFinite(stars) || !Number.isFinite(count) || count <= 0) {
      continue;
    }

    totalStars += stars * count;
    totalVotes += count;
  }

  if (totalVotes === 0) {
    return 0;
  }

  return totalStars / totalVotes;
};

export const totalVotes = (ratings: ProductRating[] | undefined): number => {
  if (!ratings || ratings.length === 0) {
    return 0;
  }

  return ratings.reduce((total, rating) => {
    const count = Number(rating.count);
    return Number.isFinite(count) && count > 0 ? total + count : total;
  }, 0);
};

export const parseUrlParts = (url: string | undefined, size?: string): string => {
  if (!url) return "";
  if (size) {
    return url.replace(/\/ex\/\d+\.\d+\//, `/ex/${size}/`);
  }
  return url.replace(/\/ex\/\d+\.\d+\//, "/ex/256.256/");
};
