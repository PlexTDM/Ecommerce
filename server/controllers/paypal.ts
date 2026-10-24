import { Hono, type Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import mongoose from "mongoose";
import { z } from "zod";
import { isDuplicateKeyError } from "../lib/errors.ts";
import { readRequestBody } from "../lib/request.ts";
import { paymentRateLimiter } from "../middleware/rateLimit.ts";
import {
  type OrderAmount,
  type OrderItem,
  type OrderShippingAddress,
  type OrderStatus,
} from "../models/order.ts";
import Order from "../models/order.ts";
import Product from "../models/product.ts";
import { calculateOrderAmount, calculateUnitPrice } from "../services/pricing.ts";
import {
  capturePayPalOrder,
  createPayPalOrder,
  PayPalApiError,
  type PayPalResponseData,
  type PayPalResult,
} from "../services/paypal.ts";
import type { AppEnv } from "../types.ts";
import { getOptionalAuthUser } from "./token.ts";

const app = new Hono<AppEnv>();

const MAX_IDEMPOTENCY_KEY_LENGTH = 200;
const CAPTURE_CLAIMABLE_STATUSES: OrderStatus[] = ["CREATED", "FAILED", "PENDING"];

const SHIPPING_FIELDS = [
  "name",
  "line1",
  "line2",
  "city",
  "state",
  "postalCode",
  "country",
] as const;

const cartItemSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().int().positive().max(99),
});

const shippingSchema = z.object({
  name: z.string().optional(),
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

const createOrderSchema = z.object({
  cart: z.array(cartItemSchema).min(1),
  shipping: shippingSchema.optional(),
  idempotencyKey: z.string().min(1).optional(),
});

const captureOrderSchema = z.object({
  idempotencyKey: z.string().min(1).optional(),
  captureIdempotencyKey: z.string().min(1).optional(),
});

interface CreateReplayState {
  _id: { toString(): string };
  requestFingerprint?: string | undefined;
  createResponse?: Record<string, unknown> | undefined;
  createResponseStatus?: number | undefined;
}

interface CaptureReplayState {
  amount: OrderAmount;
  status: OrderStatus;
  paypalOrderId?: string | undefined;
  captureIdempotencyKey?: string | undefined;
  captureResponse?: Record<string, unknown> | undefined;
  captureResponseStatus?: number | undefined;
  captureRetryable?: boolean | undefined;
}

function toContentfulStatus(status: number): ContentfulStatusCode {
  return (status >= 200 && status <= 599 ? status : 502) as ContentfulStatusCode;
}

function normalizeIdempotencyKey(value: string | null | undefined): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();

  if (trimmed.length === 0) return undefined;

  return trimmed.slice(0, MAX_IDEMPOTENCY_KEY_LENGTH);
}

function resolveIdempotencyKey(
  c: Context<AppEnv>,
  bodyKey: string | undefined,
): string | undefined {
  return (
    normalizeIdempotencyKey(c.req.header("Idempotency-Key")) ?? normalizeIdempotencyKey(bodyKey)
  );
}

function normalizeShipping(shipping: OrderShippingAddress | undefined): Record<string, string> {
  const normalized: Record<string, string> = {};

  if (!shipping) return normalized;

  for (const field of SHIPPING_FIELDS) {
    const value = shipping[field];

    if (typeof value !== "string") continue;

    const trimmed = value.trim();

    if (trimmed.length > 0) {
      normalized[field] = trimmed;
    }
  }

  return normalized;
}

function normalizeCart(
  cart: readonly { id: string; quantity: number }[],
): { id: string; quantity: number }[] {
  const quantities = new Map<string, number>();

  for (const line of cart) {
    const id = line.id.trim();
    quantities.set(id, (quantities.get(id) ?? 0) + line.quantity);
  }

  return [...quantities.entries()]
    .map(([id, quantity]) => ({ id, quantity }))
    .sort((left, right) => {
      if (left.id === right.id) return left.quantity - right.quantity;
      return left.id < right.id ? -1 : 1;
    });
}

async function createRequestFingerprint(
  cart: readonly { id: string; quantity: number }[],
  shipping: OrderShippingAddress | undefined,
): Promise<string> {
  const payload = JSON.stringify({
    cart: normalizeCart(cart),
    shipping: normalizeShipping(shipping),
  });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function responseStatus(data: PayPalResponseData): string {
  return typeof data.status === "string" ? data.status : "";
}

function orderStatusFromPayPal(status: string): OrderStatus | undefined {
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "PENDING" || status === "PAYER_ACTION_REQUIRED") {
    return "PENDING";
  }
  return undefined;
}

function hasInstrumentDeclined(data: PayPalResponseData): boolean {
  return data.details?.some((detail) => detail.issue === "INSTRUMENT_DECLINED") ?? false;
}

function extractCaptureId(data: PayPalResponseData): string | undefined {
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  return typeof capture?.id === "string" ? capture.id : undefined;
}

interface CapturedAmount {
  currency: string;
  value: string;
}

function extractCapturedAmount(data: PayPalResponseData): CapturedAmount | undefined {
  const amount = data.purchase_units?.[0]?.payments?.captures?.[0]?.amount;
  const currency = amount?.currency_code;
  const value = amount?.value;

  if (typeof currency !== "string" || typeof value !== "string") {
    return undefined;
  }

  return { currency, value };
}

function capturedAmountMatches(
  orderAmount: OrderAmount,
  captured: CapturedAmount | undefined,
): boolean {
  if (!captured) return false;
  if (captured.currency.toUpperCase() !== orderAmount.currency.toUpperCase()) {
    return false;
  }

  const expected = Number(orderAmount.value);
  const actual = Number(captured.value);

  if (!Number.isFinite(expected) || !Number.isFinite(actual)) return false;

  return Math.round(expected * 100) === Math.round(actual * 100);
}

function respondToExistingCreate(
  c: Context<AppEnv>,
  existing: CreateReplayState,
  requestFingerprint: string,
): Response {
  if (
    existing.requestFingerprint !== undefined &&
    existing.requestFingerprint !== requestFingerprint
  ) {
    return c.json(
      {
        message: "Idempotency-Key has already been used with a different request payload",
      },
      409,
    );
  }

  if (existing.createResponse) {
    return c.json(
      existing.createResponse,
      toContentfulStatus(existing.createResponseStatus ?? 200),
    );
  }

  return c.json(
    {
      message: "Order creation already in progress",
      orderId: existing._id.toString(),
    },
    409,
  );
}

function maybeReplayCapture(
  c: Context<AppEnv>,
  order: CaptureReplayState,
  captureKey: string,
  fallbackOrderId: string,
): Response | undefined {
  if (order.status === "COMPLETED") {
    if (order.captureResponse) {
      return c.json(order.captureResponse, toContentfulStatus(order.captureResponseStatus ?? 200));
    }

    return c.json(
      {
        id: order.paypalOrderId ?? fallbackOrderId,
        status: "COMPLETED",
      },
      200,
    );
  }

  if (order.captureResponse && order.captureIdempotencyKey === captureKey) {
    return c.json(order.captureResponse, toContentfulStatus(order.captureResponseStatus ?? 200));
  }

  if (order.status === "CAPTURING") {
    return c.json({ message: "Capture already in progress" }, 409);
  }

  if (order.status === "FAILED" && order.captureRetryable === false) {
    return c.json(
      {
        message: "This capture cannot be retried because a previous attempt failed permanently",
      },
      409,
    );
  }

  return undefined;
}

async function handleCreateOrder(c: Context<AppEnv>): Promise<Response> {
  const parsed = createOrderSchema.safeParse(await readRequestBody(c));

  if (!parsed.success) {
    return c.json({ message: "Invalid request", errors: z.flattenError(parsed.error) }, 400);
  }

  const { cart, shipping: shippingInput, idempotencyKey: bodyKey } = parsed.data;
  const idempotencyKey = resolveIdempotencyKey(c, bodyKey);

  if (!idempotencyKey) {
    return c.json(
      {
        message:
          "Missing idempotency key. Provide an Idempotency-Key header or an idempotencyKey body field.",
      },
      400,
    );
  }

  const shipping: OrderShippingAddress | undefined = shippingInput;
  const requestFingerprint = await createRequestFingerprint(cart, shipping);

  try {
    const existing = await Order.findOne({
      createIdempotencyKey: idempotencyKey,
    });

    if (existing) {
      return respondToExistingCreate(c, existing, requestFingerprint);
    }

    for (const line of cart) {
      if (!mongoose.isValidObjectId(line.id)) {
        return c.json({ message: "Invalid product id", productId: line.id }, 400);
      }
    }

    const productIds = cart.map((line) => new mongoose.Types.ObjectId(line.id));
    const products = await Product.find({ _id: { $in: productIds } });
    const productsById = new Map<string, (typeof products)[number]>();

    for (const product of products) {
      productsById.set(product._id.toString(), product);
    }

    const orderItems: OrderItem[] = [];

    for (const line of cart) {
      const product = productsById.get(line.id);

      if (!product) {
        return c.json({ message: "Product not found", productId: line.id }, 400);
      }

      if (!product.inStock) {
        return c.json({ message: "Product is out of stock", productId: line.id }, 400);
      }

      orderItems.push({
        productId: product._id,
        title: product.title,
        image: product.image,
        unitPrice: calculateUnitPrice(product.price, product.discount),
        quantity: line.quantity,
      });
    }

    const amount = calculateOrderAmount(orderItems);
    const authUser = getOptionalAuthUser(c);
    const order = await Order.create({
      items: orderItems,
      amount: { currency: "USD", value: amount.value },
      status: "CREATED",
      createIdempotencyKey: idempotencyKey,
      requestFingerprint,
      ...(authUser && mongoose.isValidObjectId(authUser.id)
        ? { userId: new mongoose.Types.ObjectId(authUser.id) }
        : {}),
      ...(shipping ? { shipping } : {}),
    });

    try {
      const result = await createPayPalOrder({
        value: amount.value,
        requestId: idempotencyKey,
        customId: order._id.toString(),
      });
      const paypalOrderId = result.data.id;

      if (typeof paypalOrderId !== "string") {
        await Order.findByIdAndUpdate(order._id, {
          status: "FAILED",
          createResponse: result.data,
          createResponseStatus: result.statusCode,
        });
        return c.json(result.data, toContentfulStatus(result.statusCode));
      }

      await Order.findByIdAndUpdate(order._id, {
        paypalOrderId,
        createResponse: result.data,
        createResponseStatus: result.statusCode,
      });

      return c.json(result.data, toContentfulStatus(result.statusCode));
    } catch (error) {
      const details: PayPalResponseData =
        error instanceof PayPalApiError ? error.details : { error: "Failed to create order" };
      const statusCode = error instanceof PayPalApiError ? error.statusCode : 502;

      await Order.findByIdAndUpdate(order._id, {
        status: "FAILED",
        createResponse: details,
        createResponseStatus: statusCode,
      });

      if (error instanceof PayPalApiError) {
        return c.json(details, toContentfulStatus(error.statusCode));
      }

      console.error("Failed to create PayPal order:", error);
      return c.json(details, 502);
    }
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const existing = await Order.findOne({
        createIdempotencyKey: idempotencyKey,
      });

      if (existing) {
        return respondToExistingCreate(c, existing, requestFingerprint);
      }

      return c.json({ message: "Order creation already in progress" }, 409);
    }

    console.error("Failed to create order:", error);
    return c.json({ error: "Failed to create order" }, 500);
  }
}

async function handleCaptureOrder(c: Context<AppEnv>): Promise<Response> {
  const bodyValue = await readRequestBody(c);
  const parsed = captureOrderSchema.safeParse(bodyValue ?? {});

  if (!parsed.success) {
    return c.json({ message: "Invalid request", errors: z.flattenError(parsed.error) }, 400);
  }

  const { orderID } = c.req.param();

  if (!orderID) {
    return c.json({ error: "Missing order id" }, 400);
  }

  const bodyKey = parsed.data.captureIdempotencyKey ?? parsed.data.idempotencyKey;
  // Captures default to a deterministic key so a retry without an explicit
  // key still maps to the same PayPal request.
  const captureKey = resolveIdempotencyKey(c, bodyKey) ?? `capture:${orderID}`;

  try {
    const order = await Order.findOne({ paypalOrderId: orderID });

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    const replay = maybeReplayCapture(c, order, captureKey, orderID);
    if (replay) return replay;

    const claimed = await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: { $in: CAPTURE_CLAIMABLE_STATUSES },
        captureRetryable: { $ne: false },
      },
      { status: "CAPTURING" },
      { new: true },
    );

    if (!claimed) {
      const latest = await Order.findOne({ paypalOrderId: orderID });

      if (!latest) {
        return c.json({ error: "Order not found" }, 404);
      }

      const replayAfterClaim = maybeReplayCapture(c, latest, captureKey, orderID);
      if (replayAfterClaim) return replayAfterClaim;

      return c.json(
        {
          message: "Capture already in progress",
          orderId: latest._id.toString(),
        },
        409,
      );
    }

    let result: PayPalResult;

    try {
      result = await capturePayPalOrder({
        orderId: orderID,
        requestId: captureKey,
        value: claimed.amount.value,
      });
    } catch (error) {
      if (error instanceof PayPalApiError) {
        console.error("Failed to capture PayPal order:", error);

        const retryable = hasInstrumentDeclined(error.details);

        await Order.findByIdAndUpdate(claimed._id, {
          status: retryable ? "CREATED" : "FAILED",
          captureResponse: error.details,
          captureResponseStatus: error.statusCode,
          captureIdempotencyKey: captureKey,
          captureRetryable: retryable,
        });

        return c.json(error.details, toContentfulStatus(error.statusCode));
      }

      console.error("Failed to capture order:", error);

      const details: PayPalResponseData = { error: "Failed to capture order" };

      await Order.findByIdAndUpdate(claimed._id, {
        status: "FAILED",
        captureResponse: details,
        captureResponseStatus: 502,
        captureIdempotencyKey: captureKey,
        captureRetryable: true,
      });

      return c.json(details, 502);
    }

    const paypalStatus = responseStatus(result.data);
    const mappedStatus = orderStatusFromPayPal(paypalStatus);
    const captureId = extractCaptureId(result.data);

    if (mappedStatus === "COMPLETED") {
      const captured = extractCapturedAmount(result.data);

      if (!capturedAmountMatches(claimed.amount, captured)) {
        const details: Record<string, unknown> = {
          ...result.data,
          message: captured
            ? "Captured amount does not match the order amount"
            : "Captured amount could not be verified against the order amount",
        };

        await Order.findByIdAndUpdate(claimed._id, {
          status: "FAILED",
          captureResponse: details,
          captureResponseStatus: 422,
          captureIdempotencyKey: captureKey,
          captureRetryable: false,
        });

        return c.json(details, 422);
      }

      await Order.findByIdAndUpdate(claimed._id, {
        status: "COMPLETED",
        captureResponse: result.data,
        captureResponseStatus: result.statusCode,
        captureIdempotencyKey: captureKey,
        captureRetryable: false,
        ...(captureId ? { paypalCaptureId: captureId } : {}),
      });

      return c.json(result.data, toContentfulStatus(result.statusCode));
    }

    if (mappedStatus === "PENDING") {
      await Order.findByIdAndUpdate(claimed._id, {
        status: "PENDING",
        captureResponse: result.data,
        captureResponseStatus: result.statusCode,
        captureIdempotencyKey: captureKey,
        captureRetryable: true,
        ...(captureId ? { paypalCaptureId: captureId } : {}),
      });

      return c.json(result.data, toContentfulStatus(result.statusCode));
    }

    if (hasInstrumentDeclined(result.data)) {
      await Order.findByIdAndUpdate(claimed._id, {
        status: "CREATED",
        captureResponse: result.data,
        captureResponseStatus: result.statusCode,
        captureIdempotencyKey: captureKey,
        captureRetryable: true,
      });

      return c.json(result.data, toContentfulStatus(result.statusCode));
    }

    await Order.findByIdAndUpdate(claimed._id, {
      status: "FAILED",
      captureResponse: result.data,
      captureResponseStatus: result.statusCode,
      captureIdempotencyKey: captureKey,
      captureRetryable: true,
    });

    return c.json(result.data, toContentfulStatus(result.statusCode));
  } catch (error) {
    console.error("Failed to capture order:", error);
    return c.json({ error: "Failed to capture order" }, 500);
  }
}

app.post("/orders", paymentRateLimiter, handleCreateOrder);
app.post("/api/orders", paymentRateLimiter, handleCreateOrder);
app.post("/orders/:orderID/capture", paymentRateLimiter, handleCaptureOrder);
app.post("/api/orders/:orderID/capture", paymentRateLimiter, handleCaptureOrder);

export default app;
