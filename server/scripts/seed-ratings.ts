/**
 * Seeds plausible star ratings into the `ratings` array of random catalog
 * products, using the same legacy bucket shape the catalog already stores:
 *
 *   ratings: [{ "1": 4, "2": 6, "3": 22, "4": 61, "5": 140 }]
 *
 * Products that already have a non-zero vote total are skipped, so the script
 * can be re-run safely. Ratings are derived from a deterministic PRNG, so the
 * same seed always produces the same values.
 *
 * Usage:
 *   bun server/scripts/seed-ratings.ts [count] [seed]
 *   bun server/scripts/seed-ratings.ts 2500 20241024
 */
import mongoose from "mongoose";
import { getEnv } from "../env.ts";

const DEFAULT_COUNT = 2500;
const DEFAULT_SEED = 20241024;
const BATCH_SIZE = 500;
const MIN_VOTES = 12;
const MAX_VOTES = 900;

interface StoredRating {
  [key: string]: number | string | undefined;
}

interface ProductDoc {
  _id: mongoose.Types.ObjectId;
  title?: string;
  ratings?: StoredRating[];
}

const parseInteger = (raw: string | undefined, fallback: number, min: number): number => {
  const value = Number(raw);

  if (!Number.isInteger(value) || value < min) return fallback;

  return value;
};

/** Small deterministic PRNG (mulberry32). */
const createRandom = (seed: number): (() => number) => {
  let state = seed;

  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hasVotes = (ratings: StoredRating[] | undefined): boolean =>
  (ratings ?? []).some((rating) =>
    Object.entries(rating).some(
      ([key, value]) =>
        key !== "_id" && (key === "count" || /^[1-5]$/.test(key)) && Number(value) > 0,
    ),
  );

/**
 * Builds a star histogram whose shape depends on a random "quality" target, so
 * some products end up excellent and others mediocre.
 */
const buildRatingBuckets = (random: () => number): Record<"1" | "2" | "3" | "4" | "5", number> => {
  const target = 3.5 + random() * 1.4; // 3.5 – 4.9 average
  const totalVotes = Math.round(MIN_VOTES + random() ** 2 * (MAX_VOTES - MIN_VOTES));

  const weights = [1, 2, 3, 4, 5].map(
    (stars) => Math.exp(-((stars - target) ** 2) / 0.55) + random() * 0.05,
  );
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);

  const counts = weights.map((weight) => Math.round((weight / weightSum) * totalVotes));
  const assigned = counts.reduce((sum, count) => sum + count, 0);

  // Absorb rounding drift into the largest bucket so the total stays exact.
  const largestIndex = counts.indexOf(Math.max(...counts));
  counts[largestIndex] = (counts[largestIndex] ?? 0) + (totalVotes - assigned);

  return {
    "1": counts[0] ?? 0,
    "2": counts[1] ?? 0,
    "3": counts[2] ?? 0,
    "4": counts[3] ?? 0,
    "5": counts[4] ?? 0,
  };
};

const env = getEnv();
await mongoose.connect(env.MONGO_URI);

const collection = mongoose.connection.collection("products");

const count = parseInteger(process.argv[2], DEFAULT_COUNT, 1);
const seed = parseInteger(process.argv[3], DEFAULT_SEED, 0);
const random = createRandom(seed);

const allProducts = (await collection
  .find({}, { projection: { title: 1, ratings: 1 } })
  .toArray()) as unknown as ProductDoc[];

const unrated = allProducts.filter((product) => !hasVotes(product.ratings));

console.log(
  `catalog: ${allProducts.length}, already rated: ${allProducts.length - unrated.length}, ` +
    `candidates: ${unrated.length}`,
);

// Fisher–Yates shuffle so the chosen products are not biased by insertion order.
for (let index = unrated.length - 1; index > 0; index -= 1) {
  const swapIndex = Math.floor(random() * (index + 1));
  const current = unrated[index];
  unrated[index] = unrated[swapIndex] as ProductDoc;
  unrated[swapIndex] = current as ProductDoc;
}

const selected = unrated.slice(0, Math.min(count, unrated.length));

let updated = 0;
let votes = 0;

for (let start = 0; start < selected.length; start += BATCH_SIZE) {
  const batch = selected.slice(start, start + BATCH_SIZE);

  const result = await collection.bulkWrite(
    batch.map((product) => {
      const buckets = buildRatingBuckets(random);
      votes += Object.values(buckets).reduce((sum, value) => sum + value, 0);

      return {
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { ratings: [buckets] } },
        },
      };
    }),
    { ordered: false },
  );

  updated += result.modifiedCount;
  console.log(`updated ${updated}/${selected.length}`);
}

const remaining = await collection.countDocuments({
  $or: [
    { "ratings.0.stars": { $gt: 0 } },
    { "ratings.0.1": { $gt: 0 } },
    { "ratings.0.2": { $gt: 0 } },
    { "ratings.0.3": { $gt: 0 } },
    { "ratings.0.4": { $gt: 0 } },
    { "ratings.0.5": { $gt: 0 } },
  ],
});

console.log(
  `done: ${updated} products rated, ${votes} votes seeded, ` +
    `${remaining} catalog products now carry ratings`,
);

await mongoose.disconnect();
