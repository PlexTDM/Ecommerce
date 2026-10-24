import { Hono } from "hono";
import mongoose, { type QueryFilter } from "mongoose";
import { z } from "zod";
import { parsePositiveInt } from "../lib/pagination.ts";
import { escapeRegExp } from "../lib/regex.ts";
import { readRequestBody } from "../lib/request.ts";
import Order, { type Order as OrderType, type OrderStatus } from "../models/order.ts";
import Product, { type Product as ProductType } from "../models/product.ts";
import { invalidateProductCaches } from "../services/cache.ts";
import { roundCents } from "../services/pricing.ts";
import type { AppEnv } from "../types.ts";
import { authenticate, authorizeRole } from "./token.ts";

const app = new Hono<AppEnv>();

const ORDER_STATUSES = ["CREATED", "CAPTURING", "PENDING", "COMPLETED", "FAILED"] as const;

const productDescriptionSchema = z.object({
  body1: z.string().optional(),
  body2: z.string().optional(),
  warning: z.string().optional(),
});

const productCreateSchema = z.object({
  title: z.string().trim().min(1),
  price: z.number().nonnegative(),
  discount: z.number().min(0).max(100).nullable().optional(),
  image: z.string().min(1),
  moreImages: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  inStock: z.boolean(),
  isNewProduct: z.boolean(),
  description: productDescriptionSchema.optional(),
  id: z.string().min(1).optional(),
});

const productUpdateSchema = productCreateSchema.partial();

function normalizeDescription(
  input: z.infer<typeof productDescriptionSchema> | undefined,
): ProductType["description"] {
  if (input === undefined) return undefined;

  const description: NonNullable<ProductType["description"]> = {};

  if (input.body1 !== undefined) description.body1 = input.body1;
  if (input.body2 !== undefined) description.body2 = input.body2;
  if (input.warning !== undefined) description.warning = input.warning;

  return description;
}

const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

app.use("*", authenticate, authorizeRole("ADMIN"));

app.get("/stats", async (c) => {
  try {
    const [products, orders, completedOrders, pendingOrders, lowStock] = await Promise.all([
      Product.countDocuments({}),
      Order.countDocuments({}),
      Order.find({ status: "COMPLETED" }).select("amount"),
      Order.countDocuments({ status: "PENDING" }),
      Product.countDocuments({ inStock: false }),
    ]);

    const revenue = completedOrders.reduce((total, order) => {
      const value = Number.parseFloat(order.amount.value);
      return Number.isFinite(value) ? total + value : total;
    }, 0);

    return c.json({
      products,
      orders,
      revenue: roundCents(revenue).toFixed(2),
      pendingOrders,
      lowStock,
    });
  } catch (error) {
    console.error("Admin stats failed:", error);
    return c.json({ error: "Failed to fetch admin stats" }, 500);
  }
});

app.get("/products", async (c) => {
  const page = parsePositiveInt(c.req.query("page"), 1, 1_000_000);
  const limit = parsePositiveInt(c.req.query("limit"), 20, 100);

  if (page === null || limit === null) {
    return c.json({ error: "Invalid page or limit" }, 400);
  }

  const q = c.req.query("q")?.trim();
  const filter: QueryFilter<ProductType> = {};

  if (q) {
    filter.title = { $regex: escapeRegExp(q), $options: "i" };
  }

  try {
    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return c.json({
      page,
      limit,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      products,
    });
  } catch (error) {
    console.error("Admin product list failed:", error);
    return c.json({ error: "Failed to fetch products" }, 500);
  }
});

app.post("/products", async (c) => {
  const parsed = productCreateSchema.safeParse(await readRequestBody(c));

  if (!parsed.success) {
    return c.json({ message: "Invalid product", errors: z.flattenError(parsed.error) }, 400);
  }

  const input = parsed.data;
  const description = normalizeDescription(input.description);
  const productData: ProductType = {
    title: input.title,
    price: input.price,
    discount: input.discount ?? null,
    image: input.image,
    id: input.id ?? crypto.randomUUID(),
    isNewProduct: input.isNewProduct,
    inStock: input.inStock,
    moreImages: input.moreImages ?? [],
    tags: input.tags ?? [],
    ratings: [],
    ...(description !== undefined ? { description } : {}),
  };

  try {
    const product = await Product.create(productData);
    await invalidateProductCaches();
    return c.json(product, 201);
  } catch (error) {
    console.error("Admin product create failed:", error);
    return c.json({ error: "Failed to create product" }, 500);
  }
});

app.put("/products/:id", async (c) => {
  const { id } = c.req.param();

  if (!mongoose.isValidObjectId(id)) {
    return c.json({ error: "Product not found" }, 404);
  }

  const parsed = productUpdateSchema.safeParse(await readRequestBody(c));

  if (!parsed.success) {
    return c.json({ message: "Invalid product", errors: z.flattenError(parsed.error) }, 400);
  }

  try {
    const product = await Product.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    await invalidateProductCaches();
    return c.json(product, 200);
  } catch (error) {
    console.error("Admin product update failed:", error);
    return c.json({ error: "Failed to update product" }, 500);
  }
});

app.delete("/products/:id", async (c) => {
  const { id } = c.req.param();

  if (!mongoose.isValidObjectId(id)) {
    return c.json({ error: "Product not found" }, 404);
  }

  try {
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    await invalidateProductCaches();
    return c.json({ message: "Product deleted" }, 200);
  } catch (error) {
    console.error("Admin product delete failed:", error);
    return c.json({ error: "Failed to delete product" }, 500);
  }
});

app.get("/orders", async (c) => {
  const page = parsePositiveInt(c.req.query("page"), 1, 1_000_000);
  const limit = parsePositiveInt(c.req.query("limit"), 20, 100);
  const statusParam = c.req.query("status");

  if (page === null || limit === null) {
    return c.json({ error: "Invalid page or limit" }, 400);
  }

  const filter: QueryFilter<OrderType> = {};

  if (statusParam !== undefined && statusParam !== "") {
    const status = orderStatusSchema.shape.status.safeParse(statusParam);

    if (!status.success) {
      return c.json({ error: "Invalid order status" }, 400);
    }

    filter.status = status.data;
  }

  try {
    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-createResponse -captureResponse"),
      Order.countDocuments(filter),
    ]);

    return c.json({
      page,
      limit,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      orders,
    });
  } catch (error) {
    console.error("Admin order list failed:", error);
    return c.json({ error: "Failed to fetch orders" }, 500);
  }
});

app.patch("/orders/:id/status", async (c) => {
  const { id } = c.req.param();

  if (!mongoose.isValidObjectId(id)) {
    return c.json({ error: "Order not found" }, 404);
  }

  const parsed = orderStatusSchema.safeParse(await readRequestBody(c));

  if (!parsed.success) {
    return c.json({ error: "Invalid order status" }, 400);
  }

  const status: OrderStatus = parsed.data.status;

  try {
    const updated = await Order.findByIdAndUpdate(id, { status }, { new: true });

    if (!updated) {
      return c.json({ error: "Order not found" }, 404);
    }

    const order = await Order.findById(id).select("-createResponse -captureResponse");

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    return c.json(order, 200);
  } catch (error) {
    console.error("Admin order status update failed:", error);
    return c.json({ error: "Failed to update order status" }, 500);
  }
});

export default app;
