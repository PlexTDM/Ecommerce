import { Hono, type Context } from "hono";
import mongoose, { type QueryFilter } from "mongoose";
import { parsePositiveInt } from "../lib/pagination.ts";
import { escapeRegExp } from "../lib/regex.ts";
import { cacheGet, cacheSet } from "../services/cache.ts";
import Product, { type Product as ProductType } from "../models/product.ts";
import type { AppEnv } from "../types.ts";

const app = new Hono<AppEnv>();

app.get("/random", async (c) => {
  const limit = parsePositiveInt(c.req.query("limit"), 10, 50);
  const tag = c.req.query("tag") ?? "";

  if (limit === null) {
    return c.json({ error: "Invalid limit" }, 400);
  }

  try {
    const randomProducts = await Product.aggregate<ProductType>([
      { $match: { tags: { $regex: escapeRegExp(tag), $options: "i" } } },
      { $sample: { size: limit } },
    ]);

    if (randomProducts.length === 0) {
      return c.json({ error: "No products found" }, 404);
    }

    return c.json(randomProducts, 200);
  } catch (error) {
    console.error("Error fetching filtered random products:", error);
    return c.json({ error: "Failed to fetch filtered random products" }, 500);
  }
});

app.get("/product/:id", async (c) => {
  const { id } = c.req.param();

  if (!mongoose.isValidObjectId(id)) {
    return c.json({ error: "Product not found" }, 404);
  }

  const cacheKey = `product:${id}`;

  try {
    const useCache = Bun.env.NODE_ENV !== "test";
    const cachedProduct = useCache ? await cacheGet(cacheKey) : null;

    if (cachedProduct) {
      const parsed: unknown = JSON.parse(cachedProduct);
      return c.json(parsed as ProductType, 200);
    }

    const product = await Product.findById(id);

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    if (useCache) {
      await cacheSet(cacheKey, JSON.stringify(product), 300);
    }

    return c.json(product, 200);
  } catch (error) {
    console.error("Error fetching product:", error);
    return c.json({ error: "Failed to fetch product" }, 500);
  }
});

async function listProducts(c: Context<AppEnv>): Promise<Response> {
  const page = parsePositiveInt(c.req.param("page") ?? c.req.query("page"), 1, 1_000_000);
  const limit = parsePositiveInt(c.req.query("limit"), 40, 100);
  const sort = c.req.query("sort");
  const price = c.req.query("price");
  const discount = c.req.query("discount");
  const inStock = c.req.query("inStock");
  const isNewProduct = c.req.query("isNewProduct");
  const q = c.req.query("q");
  const tags = c.req.query("tags");

  if (page === null || limit === null) {
    return c.json({ error: "Invalid page or limit" }, 400);
  }

  const filter: QueryFilter<ProductType> = {};

  if (discount) filter.discount = { $ne: null };
  if (inStock) filter.inStock = true;
  if (isNewProduct) filter.isNewProduct = true;

  if (tags) {
    const tagPattern = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .map((tag) => escapeRegExp(tag))
      .join("|");

    if (tagPattern) {
      filter.tags = { $in: [new RegExp(tagPattern, "i")] };
    }
  }

  if (price) {
    const [minRaw, maxRaw] = price.split(",");
    const min = minRaw && minRaw !== "" ? Number(minRaw) : undefined;
    const max = maxRaw && maxRaw !== "" ? Number(maxRaw) : undefined;
    const priceFilter: { $gte?: number; $lte?: number } = {};

    if (min !== undefined && Number.isFinite(min)) priceFilter.$gte = min;
    if (max !== undefined && Number.isFinite(max)) priceFilter.$lte = max;

    if (Object.keys(priceFilter).length > 0) {
      filter.price = priceFilter;
    }
  }

  if (q) {
    const search = escapeRegExp(q);
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { "description.body1": { $regex: search, $options: "i" } },
      { "description.body2": { $regex: search, $options: "i" } },
    ];
  }

  try {
    const useCache = Bun.env.NODE_ENV !== "test";
    const queryParams = c.req.query();
    const cacheKey = `products:page:${page}:${JSON.stringify(queryParams)}`;
    const cachedProducts = useCache ? await cacheGet(cacheKey) : null;

    if (cachedProducts) {
      const parsed: unknown = JSON.parse(cachedProducts);
      return c.json(parsed as Record<string, unknown>, 200);
    }

    const sortSpec: Record<string, 1 | -1> =
      sort === "asc" || sort === "desc" ? { price: sort === "asc" ? 1 : -1 } : {};

    const products = await Product.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(sortSpec);

    const totalProducts = {
      all: await Product.countDocuments(filter),
      discount: await Product.countDocuments({
        ...filter,
        discount: { $ne: null },
      }),
      inStock: await Product.countDocuments({ ...filter, inStock: true }),
      isNewProduct: await Product.countDocuments({
        ...filter,
        isNewProduct: true,
      }),
      lessThan: {
        10: await Product.countDocuments({
          ...filter,
          price: { $lte: 10 },
        }),
        20: await Product.countDocuments({
          ...filter,
          price: { $lte: 20 },
        }),
        50: await Product.countDocuments({
          ...filter,
          price: { $lte: 50 },
        }),
        100: await Product.countDocuments({
          ...filter,
          price: { $lte: 100 },
        }),
      },
    };

    const totalPages = Math.ceil(totalProducts.all / limit);

    const response = {
      page,
      limit,
      totalPages,
      totalProducts,
      products,
    };

    if (useCache) {
      await cacheSet(cacheKey, JSON.stringify(response), 60);
    }

    return c.json(response, 200);
  } catch (error) {
    console.error("Error in product list", error);
    return c.json({ error: "Failed to fetch products" }, 500);
  }
}

app.get("/search", listProducts);
app.get("/:page", listProducts);

export default app;
