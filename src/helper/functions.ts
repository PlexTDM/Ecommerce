import type { ProductRatings } from "../types";

export const calculateAverageRating = (
  ratings: ProductRatings[] | undefined,
): number => {
  if (!ratings || ratings.length === 0) {
    return 0;
  }

  const ratingObj = ratings[0];

  let totalStars = 0;
  let totalVotes = 0;

  for (let i = 1; i <= 5; i++) {
    const starCount = ratingObj[i as keyof ProductRatings];
    totalStars += i * starCount;
    totalVotes += starCount;
  }

  if (totalVotes === 0) {
    return 5;
  }

  return totalStars / totalVotes;
};

export const totalVotes = (ratings: ProductRatings[]): number => {
  let total = 0;
  for (let i = 0; i < 5; i++) {
    total += parseInt(
      String(
        ratings[0][
          Object.keys(ratings[0])[i] as unknown as keyof ProductRatings
        ],
      ),
    );
  }
  if (total === 0) {
    return Math.floor(Math.random() * 16) + 5;
  }
  return total;
};

export const parseUrlParts = (
  url: string | undefined,
  size?: string,
): string => {
  if (!url) return "";
  if (size) {
    return url.replace(/\/ex\/\d+\.\d+\//, `/ex/${size}/`);
  }
  return url.replace(/\/ex\/\d+\.\d+\//, "/ex/256.256/");
};

export const getFullImage = (url: string, size: string): string => {
  return url
    .replace(/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\//, "/")
    .replace(/\/ex\/\d+\.\d+\//, `/ex/${size}/`);
};
