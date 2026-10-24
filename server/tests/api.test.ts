import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { hashSync } from "bcryptjs";
import type { Hono } from "hono";
import { Types } from "mongoose";
import { resetEnvCacheForTests } from "../env.ts";
import { resetPayPalTokenCacheForTests } from "../services/paypal.ts";
import type { AppEnv } from "../types.ts";

Bun.env.MONGO_URI = "mongodb://localhost:27017/ecommerce-test";
Bun.env.SECRET_ACCESS_TOKEN = "test_access_token";
Bun.env.SECRET_REFRESH_TOKEN = "test_refresh_token";
Bun.env.PAYPAL_CLIENT_ID = "test_client_id";
Bun.env.PAYPAL_CLIENT_SECRET = "test_client_secret";
Bun.env.CORS_ALLOWED_ORIGINS = "http://localhost:3000";
Bun.env.PAYPAL_MOCK = "false";
Bun.env.NODE_ENV = "test";

type Role = "ADMIN" | "USER";
type OrderStatus = "CREATED" | "CAPTURING" | "PENDING" | "COMPLETED" | "FAILED";

interface FakeProduct {
  _id: Types.ObjectId;
  title: string;
  price: number;
  discount: number | null;
  image: string;
  id: string;
  isNewProduct: boolean;
  inStock: boolean;
  moreImages: string[];
  tags: string[];
  description: { warning?: string; body1?: string; body2?: string };
  ratings: { stars: number; count: number }[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface FakeUser {
  _id: Types.ObjectId;
  username?: string;
  email: string;
  password: string;
  role: Role;
}

interface FakeAddress {
  id: string;
  street: string;
  apt?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface FakeProfile {
  _id: Types.ObjectId;
  bio: string;
  userId: Types.ObjectId;
  addresses: FakeAddress[];
}

interface FakeRefreshToken {
  _id: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  userId: Types.ObjectId;
}

interface FakeOrderItem {
  productId: Types.ObjectId;
  title: string;
  image: string;
  unitPrice: number;
  quantity: number;
}

interface FakeOrder {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  items: FakeOrderItem[];
  amount: { currency: "USD"; value: string };
  status: OrderStatus;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  createIdempotencyKey: string;
  captureIdempotencyKey?: string;
  requestFingerprint?: string;
  createResponse?: Record<string, unknown>;
  createResponseStatus?: number;
  captureResponse?: Record<string, unknown>;
  captureResponseStatus?: number;
  captureRetryable?: boolean;
  shipping?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error("Expected an object");
  return value;
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function numberField(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function booleanField(record: Record<string, unknown>, key: string): boolean | undefined {
  const value = record[key];
  return typeof value === "boolean" ? value : undefined;
}

function stringArrayField(record: Record<string, unknown>, key: string): string[] | undefined {
  const value = record[key];
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string");
}

function omitFields<T>(value: T, fields: unknown): T {
  if (typeof fields !== "string" || !isRecord(value)) return value;

  const excluded = fields
    .split(/\s+/)
    .map((field) => field.trim())
    .filter((field) => field.startsWith("-"))
    .map((field) => field.slice(1));

  if (excluded.length === 0) return value;

  const copy: Record<string, unknown> = { ...value };

  for (const field of excluded) {
    delete copy[field];
  }

  return copy as unknown as T;
}

function idString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value instanceof Types.ObjectId) return value.toString();
  return undefined;
}

function objectIdFrom(value: unknown): Types.ObjectId {
  if (value instanceof Types.ObjectId) return value;
  const id = idString(value);
  return id ? new Types.ObjectId(id) : new Types.ObjectId();
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  return JSON.parse(text) as unknown;
}

async function readJsonObject(response: Response): Promise<Record<string, unknown>> {
  return asRecord(await readJson(response));
}

class FakeQuery<T> implements PromiseLike<T[]> {
  private items: T[];

  constructor(items: T[]) {
    this.items = [...items];
  }

  sort(spec: Record<string, 1 | -1>): this {
    const direction = spec.createdAt;

    if (direction === 1 || direction === -1) {
      this.items = [...this.items].sort((left, right) => {
        const leftDate =
          isRecord(left) && left.createdAt instanceof Date ? left.createdAt.getTime() : 0;
        const rightDate =
          isRecord(right) && right.createdAt instanceof Date ? right.createdAt.getTime() : 0;
        return (leftDate - rightDate) * direction;
      });
    }

    return this;
  }

  skip(count: number): this {
    this.items = this.items.slice(count);
    return this;
  }

  limit(count: number): this {
    this.items = this.items.slice(0, count);
    return this;
  }

  select(fields: unknown): this {
    this.items = this.items.map((item) => omitFields(item, fields));
    return this;
  }

  then<TResult1 = T[], TResult2 = never>(
    onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.items).then(onfulfilled, onrejected);
  }
}

class FakeSingleQuery<T> implements PromiseLike<T | null> {
  private value: T | null;

  constructor(value: T | null) {
    this.value = value;
  }

  select(fields: unknown): this {
    this.value = this.value === null ? null : omitFields(this.value, fields);
    return this;
  }

  then<TResult1 = T | null, TResult2 = never>(
    onfulfilled?: ((value: T | null) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.value).then(onfulfilled, onrejected);
  }
}

const productStore: FakeProduct[] = [];
const userStore: FakeUser[] = [];
const profileStore: FakeProfile[] = [];
const refreshTokenStore: FakeRefreshToken[] = [];
const orderStore: FakeOrder[] = [];

function regexMatches(value: string, pattern: unknown): boolean {
  if (typeof pattern === "string") return pattern === value;
  if (!isRecord(pattern)) return true;

  const source = pattern.$regex;
  if (typeof source !== "string") return true;

  const flags = pattern.$options === "i" ? "i" : "";
  return new RegExp(source, flags).test(value);
}

function productTextValue(product: FakeProduct, key: string): string {
  if (key === "title") return product.title;
  if (key === "description.body1") return product.description.body1 ?? "";
  if (key === "description.body2") return product.description.body2 ?? "";
  return "";
}

function matchesProductCondition(
  product: FakeProduct,
  condition: Record<string, unknown>,
): boolean {
  return Object.entries(condition).every(([key, pattern]) => {
    if (key === "title" || key === "description.body1" || key === "description.body2") {
      return regexMatches(productTextValue(product, key), pattern);
    }

    return true;
  });
}

function matchesProductFilter(product: FakeProduct, filter: Record<string, unknown>): boolean {
  const orConditions = filter.$or;

  if (Array.isArray(orConditions)) {
    const matchesAny = orConditions.some(
      (condition) => isRecord(condition) && matchesProductCondition(product, condition),
    );

    if (!matchesAny) return false;
  }

  if (filter.title !== undefined && !regexMatches(product.title, filter.title)) {
    return false;
  }

  const tags = filter.tags;

  if (isRecord(tags) && Array.isArray(tags.$in)) {
    const matchesTag = tags.$in.some((pattern) => {
      if (pattern instanceof RegExp) return product.tags.some((tag) => pattern.test(tag));
      return typeof pattern === "string" && product.tags.includes(pattern);
    });

    if (!matchesTag) return false;
  }

  const discount = filter.discount;

  if (isRecord(discount) && discount.$ne === null && product.discount === null) {
    return false;
  }

  if (typeof filter.inStock === "boolean" && product.inStock !== filter.inStock) {
    return false;
  }

  if (typeof filter.isNewProduct === "boolean" && product.isNewProduct !== filter.isNewProduct) {
    return false;
  }

  const price = filter.price;

  if (isRecord(price)) {
    if (typeof price.$gte === "number" && product.price < price.$gte) return false;
    if (typeof price.$lte === "number" && product.price > price.$lte) return false;
  }

  return true;
}

function parseProductDescription(value: Record<string, unknown>): FakeProduct["description"] {
  const description: FakeProduct["description"] = {};
  const warning = stringField(value, "warning");
  const body1 = stringField(value, "body1");
  const body2 = stringField(value, "body2");

  if (warning !== undefined) description.warning = warning;
  if (body1 !== undefined) description.body1 = body1;
  if (body2 !== undefined) description.body2 = body2;

  return description;
}

function applyProductUpdate(product: FakeProduct, update: unknown): void {
  const parsed = isRecord(update) ? update : {};
  const title = stringField(parsed, "title");
  const price = numberField(parsed, "price");
  const image = stringField(parsed, "image");
  const externalId = stringField(parsed, "id");
  const inStock = booleanField(parsed, "inStock");
  const isNewProduct = booleanField(parsed, "isNewProduct");
  const moreImages = stringArrayField(parsed, "moreImages");
  const tags = stringArrayField(parsed, "tags");

  if (title !== undefined) product.title = title;
  if (price !== undefined) product.price = price;
  if (image !== undefined) product.image = image;
  if (externalId !== undefined) product.id = externalId;
  if (inStock !== undefined) product.inStock = inStock;
  if (isNewProduct !== undefined) product.isNewProduct = isNewProduct;
  if (moreImages !== undefined) product.moreImages = moreImages;
  if (tags !== undefined) product.tags = tags;

  if (parsed.discount === null) {
    product.discount = null;
  } else {
    const discount = numberField(parsed, "discount");
    if (discount !== undefined) product.discount = discount;
  }

  if (isRecord(parsed.description)) {
    product.description = parseProductDescription(parsed.description);
  }

  product.updatedAt = new Date();
}

const productModel = {
  async aggregate(_pipeline: unknown[]): Promise<FakeProduct[]> {
    return [...productStore];
  },
  async create(data: unknown): Promise<FakeProduct> {
    const parsed = asRecord(data);
    const now = new Date();
    const product: FakeProduct = {
      _id: new Types.ObjectId(),
      title: stringField(parsed, "title") ?? "",
      price: numberField(parsed, "price") ?? 0,
      discount: typeof parsed.discount === "number" ? parsed.discount : null,
      image: stringField(parsed, "image") ?? "",
      id: stringField(parsed, "id") ?? crypto.randomUUID(),
      isNewProduct: booleanField(parsed, "isNewProduct") ?? false,
      inStock: booleanField(parsed, "inStock") ?? true,
      moreImages: stringArrayField(parsed, "moreImages") ?? [],
      tags: stringArrayField(parsed, "tags") ?? [],
      description: isRecord(parsed.description) ? parseProductDescription(parsed.description) : {},
      ratings: [],
      createdAt: now,
      updatedAt: now,
    };

    productStore.push(product);
    return product;
  },
  async findById(id: unknown): Promise<FakeProduct | null> {
    const target = idString(id);
    return productStore.find((product) => product._id.toString() === target) ?? null;
  },
  find(filter: unknown): FakeQuery<FakeProduct> {
    const parsedFilter = isRecord(filter) ? filter : {};
    const matches = productStore.filter((product) => matchesProductFilter(product, parsedFilter));
    return new FakeQuery(matches);
  },
  async countDocuments(filter: unknown): Promise<number> {
    const parsedFilter = isRecord(filter) ? filter : {};
    return productStore.filter((product) => matchesProductFilter(product, parsedFilter)).length;
  },
  async findByIdAndUpdate(id: unknown, update: unknown): Promise<FakeProduct | null> {
    const product = await this.findById(id);

    if (!product) return null;

    applyProductUpdate(product, update);
    return product;
  },
  async findByIdAndDelete(id: unknown): Promise<FakeProduct | null> {
    const target = idString(id);
    const index = productStore.findIndex((product) => product._id.toString() === target);

    if (index < 0) return null;

    const [removed] = productStore.splice(index, 1);
    return removed ?? null;
  },
};

function matchesUserFilter(user: FakeUser, filter: Record<string, unknown>): boolean {
  const email = filter.email;

  if (typeof email === "string" && user.email !== email) return false;

  const idFilter = filter._id;

  if (isRecord(idFilter)) {
    const notEqual = idFilter.$ne;

    if (notEqual instanceof Types.ObjectId && notEqual.equals(user._id)) {
      return false;
    }

    if (typeof notEqual === "string" && notEqual === user._id.toString()) {
      return false;
    }
  } else if (typeof idFilter === "string" && idFilter !== user._id.toString()) {
    return false;
  }

  return true;
}

const userModel = {
  async findOne(filter: unknown): Promise<FakeUser | null> {
    const parsedFilter = isRecord(filter) ? filter : {};
    return userStore.find((user) => matchesUserFilter(user, parsedFilter)) ?? null;
  },
  async create(data: unknown): Promise<FakeUser> {
    const parsed = asRecord(data);
    const email = stringField(parsed, "email");
    const password = stringField(parsed, "password");

    if (!email || !password) {
      throw new Error("Invalid user data");
    }

    const username = stringField(parsed, "username");
    const role: Role = parsed.role === "ADMIN" ? "ADMIN" : "USER";
    const user: FakeUser = {
      _id: new Types.ObjectId(),
      email,
      password,
      role,
      ...(username ? { username } : {}),
    };

    userStore.push(user);
    return user;
  },
  async findById(id: unknown): Promise<FakeUser | null> {
    const target = idString(id);
    return userStore.find((user) => user._id.toString() === target) ?? null;
  },
  async findByIdAndUpdate(id: unknown, update: unknown): Promise<FakeUser | null> {
    const user = await this.findById(id);

    if (!user) return null;

    const parsedUpdate = isRecord(update) ? update : {};
    const username = stringField(parsedUpdate, "username");
    const email = stringField(parsedUpdate, "email");
    const password = stringField(parsedUpdate, "password");

    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (password !== undefined) user.password = password;

    return user;
  },
  async findByIdAndDelete(id: unknown): Promise<FakeUser | null> {
    const target = idString(id);
    const index = userStore.findIndex((user) => user._id.toString() === target);

    if (index < 0) return null;

    const [removed] = userStore.splice(index, 1);
    return removed ?? null;
  },
};

function parseAddresses(value: unknown): FakeAddress[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((address) => {
    const apt = stringField(address, "apt");

    return {
      id: stringField(address, "id") ?? "",
      street: stringField(address, "street") ?? "",
      ...(apt !== undefined ? { apt } : {}),
      city: stringField(address, "city") ?? "",
      state: stringField(address, "state") ?? "",
      zip: stringField(address, "zip") ?? "",
      country: stringField(address, "country") ?? "",
    };
  });
}

const profileModel = {
  async create(data: unknown): Promise<FakeProfile> {
    const parsed = asRecord(data);
    const profile: FakeProfile = {
      _id: new Types.ObjectId(),
      bio: stringField(parsed, "bio") ?? "",
      userId: objectIdFrom(parsed.userId),
      addresses: parseAddresses(parsed.addresses),
    };

    profileStore.push(profile);
    return profile;
  },
  async findOne(filter: unknown): Promise<FakeProfile | null> {
    const parsedFilter = isRecord(filter) ? filter : {};
    const userId = idString(parsedFilter.userId);
    return profileStore.find((profile) => profile.userId.toString() === userId) ?? null;
  },
  async findOneAndUpdate(filter: unknown, update: unknown): Promise<FakeProfile | null> {
    const profile = await this.findOne(filter);

    if (!profile) return null;

    const parsedUpdate = isRecord(update) ? update : {};
    const bio = stringField(parsedUpdate, "bio");

    if (bio !== undefined) profile.bio = bio;
    if (Array.isArray(parsedUpdate.addresses)) {
      profile.addresses = parseAddresses(parsedUpdate.addresses);
    }

    return profile;
  },
  async findOneAndDelete(filter: unknown): Promise<FakeProfile | null> {
    const profile = await this.findOne(filter);

    if (!profile) return null;

    const index = profileStore.indexOf(profile);
    if (index >= 0) profileStore.splice(index, 1);

    return profile;
  },
};

const refreshTokenModel = {
  async create(data: unknown): Promise<FakeRefreshToken> {
    const parsed = asRecord(data);
    const tokenHash = stringField(parsed, "tokenHash");

    if (!tokenHash) throw new Error("Invalid refresh token data");

    const token: FakeRefreshToken = {
      _id: new Types.ObjectId(),
      tokenHash,
      expiresAt: parsed.expiresAt instanceof Date ? parsed.expiresAt : new Date(),
      userId: objectIdFrom(parsed.userId),
    };

    refreshTokenStore.push(token);
    return token;
  },
  find(filter: unknown): FakeQuery<FakeRefreshToken> {
    const parsedFilter = isRecord(filter) ? filter : {};
    const userId = idString(parsedFilter.userId);
    const matches = refreshTokenStore.filter((token) => token.userId.toString() === userId);
    return new FakeQuery(matches);
  },
  async deleteMany(filter: unknown): Promise<{ deletedCount: number }> {
    const parsedFilter = isRecord(filter) ? filter : {};
    const userId = idString(parsedFilter.userId);
    const remaining = refreshTokenStore.filter((token) => token.userId.toString() !== userId);
    const deletedCount = refreshTokenStore.length - remaining.length;

    refreshTokenStore.length = 0;
    refreshTokenStore.push(...remaining);

    return { deletedCount };
  },
};

function parseOrderItems(value: unknown): FakeOrderItem[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((item) => ({
    productId: objectIdFrom(item.productId),
    title: stringField(item, "title") ?? "",
    image: stringField(item, "image") ?? "",
    unitPrice: typeof item.unitPrice === "number" ? item.unitPrice : 0,
    quantity: typeof item.quantity === "number" ? item.quantity : 1,
  }));
}

function matchesOrderFilter(order: FakeOrder, filter: Record<string, unknown>): boolean {
  const status = filter.status;

  if (typeof status === "string" && order.status !== status) {
    return false;
  }

  if (isRecord(status) && Array.isArray(status.$in)) {
    const allowed = status.$in;

    if (!allowed.some((candidate) => candidate === order.status)) {
      return false;
    }
  }

  const captureRetryable = filter.captureRetryable;

  if (
    isRecord(captureRetryable) &&
    captureRetryable.$ne === false &&
    order.captureRetryable === false
  ) {
    return false;
  }

  const idFilter = filter._id;

  if (idFilter !== undefined) {
    const target = idString(idFilter);

    if (!target || order._id.toString() !== target) {
      return false;
    }
  }

  const createKey = filter.createIdempotencyKey;

  if (typeof createKey === "string" && order.createIdempotencyKey !== createKey) {
    return false;
  }

  const paypalOrderId = filter.paypalOrderId;

  if (typeof paypalOrderId === "string" && order.paypalOrderId !== paypalOrderId) {
    return false;
  }

  const userId = filter.userId;

  if (userId instanceof Types.ObjectId) {
    if (!order.userId || !order.userId.equals(userId)) return false;
  }

  return true;
}

function applyOrderUpdate(order: FakeOrder, update: unknown): void {
  const parsedUpdate = isRecord(update) ? update : {};
  const status = parsedUpdate.status;

  if (
    status === "CREATED" ||
    status === "CAPTURING" ||
    status === "PENDING" ||
    status === "COMPLETED" ||
    status === "FAILED"
  ) {
    order.status = status;
  }

  const paypalOrderId = stringField(parsedUpdate, "paypalOrderId");
  const paypalCaptureId = stringField(parsedUpdate, "paypalCaptureId");
  const captureIdempotencyKey = stringField(parsedUpdate, "captureIdempotencyKey");
  const requestFingerprint = stringField(parsedUpdate, "requestFingerprint");
  const createResponseStatus = parsedUpdate.createResponseStatus;
  const captureResponseStatus = parsedUpdate.captureResponseStatus;
  const captureRetryable = parsedUpdate.captureRetryable;

  if (paypalOrderId !== undefined) order.paypalOrderId = paypalOrderId;
  if (paypalCaptureId !== undefined) order.paypalCaptureId = paypalCaptureId;
  if (captureIdempotencyKey !== undefined) {
    order.captureIdempotencyKey = captureIdempotencyKey;
  }
  if (requestFingerprint !== undefined) {
    order.requestFingerprint = requestFingerprint;
  }
  if (typeof createResponseStatus === "number") {
    order.createResponseStatus = createResponseStatus;
  }
  if (typeof captureResponseStatus === "number") {
    order.captureResponseStatus = captureResponseStatus;
  }
  if (typeof captureRetryable === "boolean") {
    order.captureRetryable = captureRetryable;
  }

  if (isRecord(parsedUpdate.createResponse)) {
    order.createResponse = parsedUpdate.createResponse;
  }

  if (isRecord(parsedUpdate.captureResponse)) {
    order.captureResponse = parsedUpdate.captureResponse;
  }
}

const orderModel = {
  async create(data: unknown): Promise<FakeOrder> {
    const parsed = asRecord(data);
    const createIdempotencyKey = stringField(parsed, "createIdempotencyKey");

    if (!createIdempotencyKey) {
      throw new Error("Invalid order data");
    }

    const amount = isRecord(parsed.amount) ? parsed.amount : {};
    const userId = parsed.userId !== undefined ? objectIdFrom(parsed.userId) : undefined;
    const shipping = isRecord(parsed.shipping) ? parsed.shipping : undefined;
    const requestFingerprint = stringField(parsed, "requestFingerprint");
    const now = new Date();
    const order: FakeOrder = {
      _id: new Types.ObjectId(),
      items: parseOrderItems(parsed.items),
      amount: {
        currency: "USD",
        value: stringField(amount, "value") ?? "0.00",
      },
      status: "CREATED",
      createIdempotencyKey,
      ...(requestFingerprint ? { requestFingerprint } : {}),
      ...(userId ? { userId } : {}),
      ...(shipping ? { shipping } : {}),
      createdAt: now,
      updatedAt: now,
    };

    orderStore.push(order);
    return order;
  },
  async findOne(filter: unknown): Promise<FakeOrder | null> {
    const parsedFilter = isRecord(filter) ? filter : {};
    return orderStore.find((order) => matchesOrderFilter(order, parsedFilter)) ?? null;
  },
  find(filter: unknown): FakeQuery<FakeOrder> {
    const parsedFilter = isRecord(filter) ? filter : {};
    const matches = orderStore.filter((order) => matchesOrderFilter(order, parsedFilter));
    return new FakeQuery(matches);
  },
  async countDocuments(filter: unknown): Promise<number> {
    const parsedFilter = isRecord(filter) ? filter : {};
    return orderStore.filter((order) => matchesOrderFilter(order, parsedFilter)).length;
  },
  findById(id: unknown): FakeSingleQuery<FakeOrder> {
    const target = idString(id);
    const order = orderStore.find((candidate) => candidate._id.toString() === target) ?? null;
    return new FakeSingleQuery(order);
  },
  async findByIdAndUpdate(id: unknown, update: unknown): Promise<FakeOrder | null> {
    const order = await this.findById(id);

    if (!order) return null;

    applyOrderUpdate(order, update);
    order.updatedAt = new Date();
    return order;
  },
  async findOneAndUpdate(filter: unknown, update: unknown): Promise<FakeOrder | null> {
    const parsedFilter = isRecord(filter) ? filter : {};
    const order = orderStore.find((candidate) => matchesOrderFilter(candidate, parsedFilter));

    if (!order) return null;

    applyOrderUpdate(order, update);
    order.updatedAt = new Date();
    return order;
  },
};

mock.module(import.meta.resolve("../models/product.ts"), () => ({
  default: productModel,
}));
mock.module(import.meta.resolve("../models/user.ts"), () => ({
  default: userModel,
}));
mock.module(import.meta.resolve("../models/profile.ts"), () => ({
  default: profileModel,
}));
mock.module(import.meta.resolve("../models/refreshToken.ts"), () => ({
  default: refreshTokenModel,
}));
mock.module(import.meta.resolve("../models/order.ts"), () => ({
  default: orderModel,
}));

const originalFetch = globalThis.fetch;
let paypalTokenCount = 0;
let paypalCreateCount = 0;
let paypalCaptureCount = 0;
const paypalRequestIds: string[] = [];
const paypalCaptureRequestIds: string[] = [];

type FakeCaptureBehavior = "completed" | "pending" | "declined" | "amount-mismatch" | "error";

let paypalCaptureBehavior: FakeCaptureBehavior = "completed";

function createdOrderAmount(paypalOrderId: string): string {
  return orderStore.find((order) => order.paypalOrderId === paypalOrderId)?.amount.value ?? "0.00";
}

const fakeFetch: typeof fetch = Object.assign(
  async (input: string | URL | Request, init?: BunFetchRequestInit): Promise<Response> => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const headers = new Headers(init?.headers);

    if (url.endsWith("/v1/oauth2/token")) {
      paypalTokenCount += 1;
      return Response.json({
        access_token: "test-access-token",
        expires_in: 3600,
      });
    }

    if (url.includes("/capture")) {
      paypalCaptureCount += 1;
      paypalCaptureRequestIds.push(headers.get("PayPal-Request-Id") ?? "");
      const match = /\/orders\/([^/]+)\/capture$/.exec(url);
      const orderId = match?.[1] ? decodeURIComponent(match[1]) : "UNKNOWN";
      const amountValue = createdOrderAmount(orderId);

      if (paypalCaptureBehavior === "error") {
        return Response.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
      }

      if (paypalCaptureBehavior === "declined") {
        return Response.json(
          {
            id: orderId,
            status: "UNPROCESSABLE_ENTITY",
            details: [
              {
                issue: "INSTRUMENT_DECLINED",
                description: "The instrument presented was declined.",
              },
            ],
          },
          { status: 422 },
        );
      }

      const capturedValue = paypalCaptureBehavior === "amount-mismatch" ? "0.01" : amountValue;

      return Response.json({
        id: orderId,
        status: paypalCaptureBehavior === "pending" ? "PENDING" : "COMPLETED",
        purchase_units: [
          {
            payments: {
              captures: [
                {
                  id: `CAPTURE-${paypalCaptureCount}`,
                  status: paypalCaptureBehavior === "pending" ? "PENDING" : "COMPLETED",
                  amount: {
                    currency_code: "USD",
                    value: capturedValue,
                  },
                },
              ],
            },
          },
        ],
      });
    }

    if (url.includes("/v2/checkout/orders")) {
      paypalCreateCount += 1;
      paypalRequestIds.push(headers.get("PayPal-Request-Id") ?? "");

      return Response.json(
        {
          id: `PAYPAL-${paypalCreateCount}`,
          status: "CREATED",
        },
        { status: 201 },
      );
    }

    throw new Error(`Unexpected fetch call: ${url}`);
  },
  {
    preconnect: (
      _url: string | URL,
      _options?: {
        dns?: boolean;
        tcp?: boolean;
        http?: boolean;
        https?: boolean;
      },
    ): void => {},
  },
);

globalThis.fetch = fakeFetch;

const productAId = new Types.ObjectId();
const productBId = new Types.ObjectId();
const outOfStockId = new Types.ObjectId();
const seedUserId = new Types.ObjectId();
const adminUserId = new Types.ObjectId();

let app: Hono<AppEnv>;
let authAccessToken = "";
let adminAccessToken = "";
let firstCreateBody: Record<string, unknown> = {};
let firstCreateStatus = 0;

async function jsonRequest(
  path: string,
  method: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  return app.request(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function createTestOrder(
  createKey: string,
): Promise<{ order: FakeOrder; paypalOrderId: string }> {
  const response = await jsonRequest(
    "/payment/orders",
    "POST",
    { cart: [{ id: productAId.toString(), quantity: 1 }] },
    { "Idempotency-Key": createKey },
  );
  const body = await readJsonObject(response);
  const paypalOrderId = stringField(body, "id");
  const order = orderStore.find((candidate) => candidate.createIdempotencyKey === createKey);

  if (response.status !== 201 || !paypalOrderId || !order) {
    throw new Error(`Failed to create test order ${createKey}`);
  }

  return { order, paypalOrderId };
}

beforeAll(async () => {
  productStore.push(
    {
      _id: productAId,
      title: "Discounted Figure",
      price: 100,
      discount: 10,
      image: "https://example.com/a.jpg",
      id: "external-a",
      isNewProduct: true,
      inStock: true,
      moreImages: [],
      tags: ["anime"],
      description: { body1: "A figure" },
      ratings: [{ stars: 5, count: 2 }],
    },
    {
      _id: productBId,
      title: "Regular Figure",
      price: 25.5,
      discount: null,
      image: "https://example.com/b.jpg",
      id: "external-b",
      isNewProduct: false,
      inStock: true,
      moreImages: [],
      tags: ["manga"],
      description: {},
      ratings: [],
    },
    {
      _id: outOfStockId,
      title: "Sold Out Figure",
      price: 50,
      discount: null,
      image: "https://example.com/c.jpg",
      id: "external-c",
      isNewProduct: false,
      inStock: false,
      moreImages: [],
      tags: [],
      description: {},
      ratings: [],
    },
  );

  userStore.push({
    _id: seedUserId,
    username: "Test User",
    email: "test@example.com",
    password: hashSync("password123", 10),
    role: "USER",
  });

  userStore.push({
    _id: adminUserId,
    username: "Admin User",
    email: "admin@example.com",
    password: hashSync("adminpassword123", 10),
    role: "ADMIN",
  });

  profileStore.push({
    _id: new Types.ObjectId(),
    bio: "Hello I Like Anime",
    userId: seedUserId,
    addresses: [],
  });

  const serverModule = await import("../server.ts");
  app = serverModule.app;

  const loginResponse = await jsonRequest("/auth/login", "POST", {
    email: "test@example.com",
    password: "password123",
  });
  const loginBody = await readJsonObject(loginResponse);
  const token = stringField(loginBody, "accessToken");

  if (!token) throw new Error("Test setup login failed");

  authAccessToken = token;

  const adminLoginResponse = await jsonRequest("/auth/login", "POST", {
    email: "admin@example.com",
    password: "adminpassword123",
  });
  const adminLoginBody = await readJsonObject(adminLoginResponse);
  const adminToken = stringField(adminLoginBody, "accessToken");

  if (!adminToken) throw new Error("Test setup admin login failed");

  adminAccessToken = adminToken;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe("Ecommerce API", () => {
  test("GET / and /auth/ping respond", async () => {
    const rootResponse = await app.request("/");
    expect(rootResponse.status).toBe(200);

    const pingResponse = await app.request("/auth/ping");
    expect(pingResponse.status).toBe(200);
    expect(await pingResponse.text()).toBe("pong");
  });

  test("POST /auth/login returns tokens and a sanitized user", async () => {
    const response = await jsonRequest("/auth/login", "POST", {
      email: "test@example.com",
      password: "password123",
    });
    const body = await readJsonObject(response);

    expect(response.status).toBe(200);
    expect(stringField(body, "message")).toBe("User Logged in successfully");
    expect(stringField(body, "accessToken")).toBeString();
    expect(stringField(body, "refreshToken")).toBeString();

    const user = asRecord(body.user);
    expect(stringField(user, "id")).toBe(seedUserId.toString());
    expect(stringField(user, "email")).toBe("test@example.com");
    expect(stringField(user, "role")).toBe("USER");
    expect(user.password).toBeUndefined();
  });

  test("POST /auth/register creates a sanitized user", async () => {
    const response = await jsonRequest("/auth/register", "POST", {
      name: "Second User",
      email: "second@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    const body = await readJsonObject(response);

    expect(response.status).toBe(201);
    expect(stringField(body, "message")).toBe("User registered successfully");
    expect(stringField(body, "accessToken")).toBeString();
    expect(stringField(body, "refreshToken")).toBeString();

    const user = asRecord(body.user);
    expect(stringField(user, "username")).toBe("Second User");
    expect(user.password).toBeUndefined();
  });

  test("GET /products/random, /products/:page and /products/product/:id", async () => {
    const randomResponse = await app.request("/products/random?limit=2");
    const randomBody = await readJson(randomResponse);

    expect(randomResponse.status).toBe(200);
    expect(Array.isArray(randomBody)).toBe(true);
    expect((randomBody as unknown[]).length).toBeGreaterThan(0);

    const listResponse = await app.request("/products/1?limit=2");
    const listBody = await readJsonObject(listResponse);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listBody.products)).toBe(true);

    const detailResponse = await app.request(`/products/product/${productAId.toString()}`);
    const detailBody = await readJsonObject(detailResponse);

    expect(detailResponse.status).toBe(200);
    expect(stringField(detailBody, "title")).toBe("Discounted Figure");
  });

  test("POST /payment/orders computes server-side discounted totals", async () => {
    const createKey = "create-order-1";
    const response = await jsonRequest(
      "/payment/orders",
      "POST",
      {
        cart: [
          { id: productAId.toString(), quantity: 2 },
          { id: productBId.toString(), quantity: 1 },
        ],
      },
      {
        "Idempotency-Key": createKey,
        Authorization: `Bearer ${authAccessToken}`,
      },
    );
    const body = await readJsonObject(response);

    firstCreateBody = body;
    firstCreateStatus = response.status;

    expect(response.status).toBe(201);
    expect(stringField(body, "id")).toBe("PAYPAL-1");
    expect(stringField(body, "status")).toBe("CREATED");
    expect(paypalRequestIds).toContain(createKey);

    const localOrder = orderStore.find((order) => order.createIdempotencyKey === createKey);

    expect(localOrder).toBeDefined();
    expect(localOrder?.amount.value).toBe("205.50");
    expect(localOrder?.items).toHaveLength(2);
    expect(localOrder?.items[0]?.unitPrice).toBe(90);
    expect(localOrder?.items[1]?.unitPrice).toBe(25.5);
    expect(localOrder?.userId?.toString()).toBe(seedUserId.toString());
    expect(localOrder?.requestFingerprint).toBeString();
    expect(localOrder?.createResponseStatus).toBe(201);
    expect(paypalTokenCount).toBeGreaterThan(0);
  });

  test("duplicate create idempotency key replays without a second PayPal call", async () => {
    const createKey = "create-order-1";
    const beforeOrders = orderStore.length;
    const beforeCreateCalls = paypalCreateCount;
    const response = await jsonRequest(
      "/payment/orders",
      "POST",
      {
        cart: [
          { id: productAId.toString(), quantity: 2 },
          { id: productBId.toString(), quantity: 1 },
        ],
      },
      {
        "Idempotency-Key": createKey,
        Authorization: `Bearer ${authAccessToken}`,
      },
    );
    const body = await readJsonObject(response);

    expect(response.status).toBe(firstCreateStatus);
    expect(body).toEqual(firstCreateBody);
    expect(orderStore.length).toBe(beforeOrders);
    expect(paypalCreateCount).toBe(beforeCreateCalls);
  });

  test("create order without an idempotency key returns 400", async () => {
    const beforeOrders = orderStore.length;
    const beforeCreateCalls = paypalCreateCount;
    const response = await jsonRequest("/payment/orders", "POST", {
      cart: [{ id: productAId.toString(), quantity: 1 }],
    });
    const body = await readJsonObject(response);

    expect(response.status).toBe(400);
    expect(stringField(body, "message")).toContain("Missing idempotency key");
    expect(orderStore.length).toBe(beforeOrders);
    expect(paypalCreateCount).toBe(beforeCreateCalls);
  });

  test("reusing an idempotency key with a different payload returns 409", async () => {
    const beforeOrders = orderStore.length;
    const beforeCreateCalls = paypalCreateCount;
    const response = await jsonRequest(
      "/payment/orders",
      "POST",
      { cart: [{ id: productAId.toString(), quantity: 1 }] },
      { "Idempotency-Key": "create-order-1" },
    );
    const body = await readJsonObject(response);

    expect(response.status).toBe(409);
    expect(stringField(body, "message")).toContain("different request payload");
    expect(orderStore.length).toBe(beforeOrders);
    expect(paypalCreateCount).toBe(beforeCreateCalls);
  });

  test("create order rejects invalid and out-of-stock products", async () => {
    const beforeOrders = orderStore.length;
    const beforeCreateCalls = paypalCreateCount;
    const missingProductResponse = await jsonRequest(
      "/payment/orders",
      "POST",
      {
        cart: [{ id: new Types.ObjectId().toString(), quantity: 1 }],
      },
      { "Idempotency-Key": "missing-product" },
    );

    expect(missingProductResponse.status).toBe(400);

    const outOfStockResponse = await jsonRequest(
      "/payment/orders",
      "POST",
      {
        cart: [{ id: outOfStockId.toString(), quantity: 1 }],
      },
      { "Idempotency-Key": "out-of-stock" },
    );

    expect(outOfStockResponse.status).toBe(400);

    const emptyCartResponse = await jsonRequest(
      "/payment/orders",
      "POST",
      { cart: [] },
      { "Idempotency-Key": "empty-cart" },
    );

    expect(emptyCartResponse.status).toBe(400);
    expect(orderStore.length).toBe(beforeOrders);
    expect(paypalCreateCount).toBe(beforeCreateCalls);
  });

  test("duplicate capture returns the stored response without a second PayPal call", async () => {
    const localOrder = orderStore.find((order) => order.createIdempotencyKey === "create-order-1");
    const paypalOrderId = localOrder?.paypalOrderId;

    if (!paypalOrderId) throw new Error("Expected a PayPal order id");

    const beforeCaptureCalls = paypalCaptureCount;
    const captureKey = "capture-order-1";
    const firstResponse = await jsonRequest(
      `/payment/orders/${paypalOrderId}/capture`,
      "POST",
      {},
      { "Idempotency-Key": captureKey },
    );
    const firstBody = await readJsonObject(firstResponse);

    expect(firstResponse.status).toBe(200);
    expect(stringField(firstBody, "status")).toBe("COMPLETED");
    expect(paypalCaptureCount).toBe(beforeCaptureCalls + 1);
    expect(localOrder?.status).toBe("COMPLETED");
    expect(localOrder?.captureIdempotencyKey).toBe(captureKey);
    expect(localOrder?.paypalCaptureId).toBe("CAPTURE-1");

    const secondResponse = await jsonRequest(
      `/payment/orders/${paypalOrderId}/capture`,
      "POST",
      {},
      { "Idempotency-Key": captureKey },
    );
    const secondBody = await readJsonObject(secondResponse);

    expect(secondResponse.status).toBe(200);
    expect(secondBody).toEqual(firstBody);
    expect(paypalCaptureCount).toBe(beforeCaptureCalls + 1);

    const differentKeyResponse = await jsonRequest(
      `/payment/orders/${paypalOrderId}/capture`,
      "POST",
      {},
      { "Idempotency-Key": "a-different-capture-key" },
    );
    const differentKeyBody = await readJsonObject(differentKeyResponse);

    expect(differentKeyResponse.status).toBe(200);
    expect(differentKeyBody).toEqual(firstBody);
    expect(paypalCaptureCount).toBe(beforeCaptureCalls + 1);
  });

  test("PENDING capture is not COMPLETED and can be retried with a new key", async () => {
    const { order, paypalOrderId } = await createTestOrder("pending-capture-order");

    paypalCaptureBehavior = "pending";

    try {
      const beforeCaptureCalls = paypalCaptureCount;
      const captureKey = "pending-capture-1";
      const firstResponse = await jsonRequest(
        `/payment/orders/${paypalOrderId}/capture`,
        "POST",
        {},
        { "Idempotency-Key": captureKey },
      );
      const firstBody = await readJsonObject(firstResponse);

      expect(firstResponse.status).toBe(200);
      expect(stringField(firstBody, "status")).toBe("PENDING");
      expect(order.status).toBe("PENDING");
      expect(order.status).not.toBe("COMPLETED");
      expect(order.captureResponseStatus).toBe(200);
      expect(paypalCaptureCount).toBe(beforeCaptureCalls + 1);
      expect(paypalCaptureRequestIds).toContain(captureKey);

      const replayResponse = await jsonRequest(
        `/payment/orders/${paypalOrderId}/capture`,
        "POST",
        {},
        { "Idempotency-Key": captureKey },
      );
      const replayBody = await readJsonObject(replayResponse);

      expect(replayResponse.status).toBe(200);
      expect(replayBody).toEqual(firstBody);
      expect(paypalCaptureCount).toBe(beforeCaptureCalls + 1);

      paypalCaptureBehavior = "completed";

      const retryResponse = await jsonRequest(
        `/payment/orders/${paypalOrderId}/capture`,
        "POST",
        {},
        { "Idempotency-Key": "pending-capture-2" },
      );
      const retryBody = await readJsonObject(retryResponse);

      expect(retryResponse.status).toBe(200);
      expect(stringField(retryBody, "status")).toBe("COMPLETED");
      expect(order.status).toBe("COMPLETED");
      expect(paypalCaptureCount).toBe(beforeCaptureCalls + 2);
    } finally {
      paypalCaptureBehavior = "completed";
    }
  });

  test("amount mismatch fails the capture and never marks it COMPLETED", async () => {
    const { order, paypalOrderId } = await createTestOrder("amount-mismatch-order");

    paypalCaptureBehavior = "amount-mismatch";

    try {
      const beforeCaptureCalls = paypalCaptureCount;
      const captureKey = "amount-mismatch-capture";
      const response = await jsonRequest(
        `/payment/orders/${paypalOrderId}/capture`,
        "POST",
        {},
        { "Idempotency-Key": captureKey },
      );
      const body = await readJsonObject(response);

      expect(response.status).toBe(422);
      expect(stringField(body, "message")).toContain("does not match");
      expect(order.status).toBe("FAILED");
      expect(order.status).not.toBe("COMPLETED");
      expect(order.captureResponseStatus).toBe(422);
      expect(order.captureRetryable).toBe(false);
      expect(paypalCaptureCount).toBe(beforeCaptureCalls + 1);

      const replayResponse = await jsonRequest(
        `/payment/orders/${paypalOrderId}/capture`,
        "POST",
        {},
        { "Idempotency-Key": captureKey },
      );
      const replayBody = await readJsonObject(replayResponse);

      expect(replayResponse.status).toBe(422);
      expect(replayBody).toEqual(body);
      expect(paypalCaptureCount).toBe(beforeCaptureCalls + 1);

      const newKeyResponse = await jsonRequest(
        `/payment/orders/${paypalOrderId}/capture`,
        "POST",
        {},
        { "Idempotency-Key": "amount-mismatch-capture-2" },
      );

      expect(newKeyResponse.status).toBe(409);
      expect(paypalCaptureCount).toBe(beforeCaptureCalls + 1);
    } finally {
      paypalCaptureBehavior = "completed";
    }
  });

  test("a failed capture replays for the same key and can be retried with a new key", async () => {
    const { order, paypalOrderId } = await createTestOrder("failed-capture-order");

    paypalCaptureBehavior = "error";

    try {
      const beforeCaptureCalls = paypalCaptureCount;
      const captureKey = "failed-capture-1";
      const firstResponse = await jsonRequest(
        `/payment/orders/${paypalOrderId}/capture`,
        "POST",
        {},
        { "Idempotency-Key": captureKey },
      );
      const firstBody = await readJsonObject(firstResponse);

      expect(firstResponse.status).toBe(500);
      expect(order.status).toBe("FAILED");
      expect(order.captureResponseStatus).toBe(500);
      expect(order.captureRetryable).toBe(true);
      expect(paypalCaptureCount).toBe(beforeCaptureCalls + 1);

      const replayResponse = await jsonRequest(
        `/payment/orders/${paypalOrderId}/capture`,
        "POST",
        {},
        { "Idempotency-Key": captureKey },
      );
      const replayBody = await readJsonObject(replayResponse);

      expect(replayResponse.status).toBe(500);
      expect(replayBody).toEqual(firstBody);
      expect(paypalCaptureCount).toBe(beforeCaptureCalls + 1);

      paypalCaptureBehavior = "completed";

      const retryResponse = await jsonRequest(
        `/payment/orders/${paypalOrderId}/capture`,
        "POST",
        {},
        { "Idempotency-Key": "failed-capture-2" },
      );
      const retryBody = await readJsonObject(retryResponse);

      expect(retryResponse.status).toBe(200);
      expect(stringField(retryBody, "status")).toBe("COMPLETED");
      expect(order.status).toBe("COMPLETED");
      expect(paypalCaptureCount).toBe(beforeCaptureCalls + 2);
    } finally {
      paypalCaptureBehavior = "completed";
    }
  });

  test("INSTRUMENT_DECLINED remains retryable and is not permanently FAILED", async () => {
    const { order, paypalOrderId } = await createTestOrder("declined-capture-order");

    paypalCaptureBehavior = "declined";

    try {
      const beforeCaptureCalls = paypalCaptureCount;
      const captureKey = "declined-capture-1";
      const firstResponse = await jsonRequest(
        `/payment/orders/${paypalOrderId}/capture`,
        "POST",
        {},
        { "Idempotency-Key": captureKey },
      );
      const firstBody = await readJsonObject(firstResponse);

      expect(firstResponse.status).toBe(422);
      expect(order.status).toBe("CREATED");
      expect(order.status).not.toBe("FAILED");
      expect(order.captureRetryable).toBe(true);
      expect(paypalCaptureCount).toBe(beforeCaptureCalls + 1);

      const replayResponse = await jsonRequest(
        `/payment/orders/${paypalOrderId}/capture`,
        "POST",
        {},
        { "Idempotency-Key": captureKey },
      );
      const replayBody = await readJsonObject(replayResponse);

      expect(replayResponse.status).toBe(422);
      expect(replayBody).toEqual(firstBody);
      expect(paypalCaptureCount).toBe(beforeCaptureCalls + 1);

      paypalCaptureBehavior = "completed";

      const retryResponse = await jsonRequest(
        `/payment/orders/${paypalOrderId}/capture`,
        "POST",
        {},
        { "Idempotency-Key": "declined-capture-2" },
      );
      const retryBody = await readJsonObject(retryResponse);

      expect(retryResponse.status).toBe(200);
      expect(stringField(retryBody, "status")).toBe("COMPLETED");
      expect(order.status).toBe("COMPLETED");
      expect(paypalCaptureCount).toBe(beforeCaptureCalls + 2);
    } finally {
      paypalCaptureBehavior = "completed";
    }
  });

  test("a capture that is already in progress returns 409 without calling PayPal", async () => {
    const { order, paypalOrderId } = await createTestOrder("in-progress-capture-order");

    order.status = "CAPTURING";

    const beforeCaptureCalls = paypalCaptureCount;
    const response = await jsonRequest(
      `/payment/orders/${paypalOrderId}/capture`,
      "POST",
      {},
      { "Idempotency-Key": "in-progress-capture" },
    );

    expect(response.status).toBe(409);
    expect(paypalCaptureCount).toBe(beforeCaptureCalls);

    order.status = "CREATED";
  });

  test("PAYPAL_MOCK=true returns deterministic mock orders through aliases", async () => {
    Bun.env.PAYPAL_MOCK = "true";
    resetEnvCacheForTests();
    resetPayPalTokenCacheForTests();

    try {
      const createKey = "mock-order-key";
      const beforeCreateCalls = paypalCreateCount;
      const createResponse = await jsonRequest(
        "/payment/api/orders",
        "POST",
        { cart: [{ id: productAId.toString(), quantity: 1 }] },
        { "Idempotency-Key": createKey },
      );
      const createBody = await readJsonObject(createResponse);

      expect(createResponse.status).toBe(201);
      expect(stringField(createBody, "id")).toBe(`MOCK-${createKey}`);
      expect(stringField(createBody, "status")).toBe("CREATED");
      expect(paypalCreateCount).toBe(beforeCreateCalls);

      const mockOrderId = stringField(createBody, "id");

      if (!mockOrderId) throw new Error("Expected a mock order id");

      const captureResponse = await jsonRequest(
        `/payment/api/orders/${mockOrderId}/capture`,
        "POST",
        {},
        { "Idempotency-Key": "mock-capture-key" },
      );
      const captureBody = await readJsonObject(captureResponse);

      expect(captureResponse.status).toBe(200);
      expect(stringField(captureBody, "id")).toBe(mockOrderId);
      expect(stringField(captureBody, "status")).toBe("COMPLETED");
    } finally {
      Bun.env.PAYPAL_MOCK = "false";
      resetEnvCacheForTests();
      resetPayPalTokenCacheForTests();
    }
  });

  test("GET /orders returns the authenticated user's orders", async () => {
    const response = await app.request("/orders", {
      headers: { Authorization: `Bearer ${authAccessToken}` },
    });
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);

    const orders = body as unknown[];
    expect(orders.length).toBeGreaterThan(0);

    const orderRecords = orders.map(asRecord);
    const firstOrder = orderRecords.find(
      (order) => stringField(order, "createIdempotencyKey") === "create-order-1",
    );

    if (!firstOrder) throw new Error("Expected the seeded order");

    expect(stringField(firstOrder, "userId")).toBe(seedUserId.toString());
    expect(stringField(firstOrder, "createIdempotencyKey")).toBe("create-order-1");
  });

  test("GET /orders/:id enforces ownership", async () => {
    const order = orderStore.find(
      (candidate) => candidate.createIdempotencyKey === "create-order-1",
    );

    if (!order) throw new Error("Expected a local order");

    const response = await app.request(`/orders/${order._id.toString()}`, {
      headers: { Authorization: `Bearer ${authAccessToken}` },
    });

    expect(response.status).toBe(200);

    const unauthenticatedResponse = await app.request(`/orders/${order._id.toString()}`);

    expect(unauthenticatedResponse.status).toBe(401);
  });

  test("GET and PUT /profile manage bio and addresses", async () => {
    const getResponse = await app.request("/profile", {
      headers: { Authorization: `Bearer ${authAccessToken}` },
    });
    const getBody = await readJsonObject(getResponse);

    expect(getResponse.status).toBe(200);
    expect(stringField(getBody, "bio")).toBe("Hello I Like Anime");

    const putResponse = await jsonRequest(
      "/profile",
      "PUT",
      {
        bio: "Updated bio",
        addresses: [
          {
            id: "home",
            street: "1 Main St",
            city: "Tokyo",
            state: "Tokyo",
            zip: "100-0001",
            country: "JP",
          },
        ],
      },
      { Authorization: `Bearer ${authAccessToken}` },
    );
    const putBody = await readJsonObject(putResponse);

    expect(putResponse.status).toBe(200);
    expect(stringField(putBody, "bio")).toBe("Updated bio");
    expect(Array.isArray(putBody.addresses)).toBe(true);
  });

  test("admin endpoints reject unauthenticated and non-admin users", async () => {
    const unauthenticated = await app.request("/admin/stats");
    expect(unauthenticated.status).toBe(401);

    const nonAdmin = await app.request("/admin/stats", {
      headers: { Authorization: `Bearer ${authAccessToken}` },
    });
    expect(nonAdmin.status).toBe(403);

    const nonAdminCreate = await jsonRequest(
      "/admin/products",
      "POST",
      { title: "Forbidden Product" },
      { Authorization: `Bearer ${authAccessToken}` },
    );
    expect(nonAdminCreate.status).toBe(403);
  });

  test("admin stats report counts, pending orders and completed revenue", async () => {
    const response = await app.request("/admin/stats", {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    const body = await readJsonObject(response);
    const completedCents = orderStore
      .filter((order) => order.status === "COMPLETED")
      .reduce((total, order) => total + Math.round(Number(order.amount.value) * 100), 0);

    expect(response.status).toBe(200);
    expect(body.products).toBe(productStore.length);
    expect(body.orders).toBe(orderStore.length);
    expect(body.pendingOrders).toBe(
      orderStore.filter((order) => order.status === "PENDING").length,
    );
    expect(body.lowStock).toBe(productStore.filter((product) => !product.inStock).length);
    expect(stringField(body, "revenue")).toBe((completedCents / 100).toFixed(2));
  });

  test("admin can create, update and delete a product", async () => {
    const createResponse = await jsonRequest(
      "/admin/products",
      "POST",
      {
        title: "Admin (Test) Product",
        price: 42.5,
        discount: 15,
        image: "https://example.com/admin.jpg",
        moreImages: ["https://example.com/admin-2.jpg"],
        tags: ["admin", "test"],
        inStock: true,
        isNewProduct: true,
        description: { body1: "Admin created product" },
      },
      { Authorization: `Bearer ${adminAccessToken}` },
    );
    const created = await readJsonObject(createResponse);
    const mongoId = idString(created._id);
    const externalId = stringField(created, "id");

    expect(createResponse.status).toBe(201);
    expect(stringField(created, "title")).toBe("Admin (Test) Product");
    expect(externalId).toBeString();
    expect(externalId).not.toBe(mongoId);
    expect(created.ratings).toEqual([]);

    if (!mongoId) throw new Error("Expected the created product id");

    const listResponse = await app.request(
      `/admin/products?q=${encodeURIComponent("Admin (Test)")}&limit=5`,
      { headers: { Authorization: `Bearer ${adminAccessToken}` } },
    );
    const listBody = await readJsonObject(listResponse);

    expect(listResponse.status).toBe(200);
    expect(listBody.page).toBe(1);
    expect(listBody.limit).toBe(5);
    expect(listBody.totalProducts).toBe(1);
    expect(Array.isArray(listBody.products)).toBe(true);

    const updateResponse = await jsonRequest(
      `/admin/products/${mongoId}`,
      "PUT",
      { price: 60, discount: null, inStock: false },
      { Authorization: `Bearer ${adminAccessToken}` },
    );
    const updated = await readJsonObject(updateResponse);

    expect(updateResponse.status).toBe(200);
    expect(updated.price).toBe(60);
    expect(updated.discount).toBeNull();
    expect(updated.inStock).toBe(false);

    const deleteResponse = await app.request(`/admin/products/${mongoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    const deleteBody = await readJsonObject(deleteResponse);

    expect(deleteResponse.status).toBe(200);
    expect(stringField(deleteBody, "message")).toBe("Product deleted");

    const missingResponse = await app.request(`/admin/products/${mongoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });

    expect(missingResponse.status).toBe(404);
  });

  test("admin can list orders and update their status", async () => {
    const orderId = new Types.ObjectId();

    orderStore.push({
      _id: orderId,
      userId: seedUserId,
      items: [
        {
          productId: productAId,
          title: "Admin Order Product",
          image: "https://example.com/admin-order.jpg",
          unitPrice: 10,
          quantity: 1,
        },
      ],
      amount: { currency: "USD", value: "10.00" },
      status: "CREATED",
      createIdempotencyKey: "admin-order-test",
      createResponse: { secret: "create blob" },
      captureResponse: { secret: "capture blob" },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const listResponse = await app.request("/admin/orders?status=CREATED&limit=5", {
      headers: { Authorization: `Bearer ${adminAccessToken}` },
    });
    const listBody = await readJsonObject(listResponse);
    const orders = listBody.orders;

    expect(listResponse.status).toBe(200);
    expect(listBody.page).toBe(1);
    expect(listBody.limit).toBe(5);
    expect(listBody.totalOrders).toBeGreaterThan(0);
    expect(Array.isArray(orders)).toBe(true);

    const listedOrder = (orders as unknown[])
      .map(asRecord)
      .find((order) => idString(order._id) === orderId.toString());

    if (!listedOrder) throw new Error("Expected the admin order in the list");

    expect(stringField(listedOrder, "status")).toBe("CREATED");
    expect(listedOrder.createResponse).toBeUndefined();
    expect(listedOrder.captureResponse).toBeUndefined();

    const patchResponse = await jsonRequest(
      `/admin/orders/${orderId.toString()}/status`,
      "PATCH",
      { status: "COMPLETED" },
      { Authorization: `Bearer ${adminAccessToken}` },
    );
    const patched = await readJsonObject(patchResponse);

    expect(patchResponse.status).toBe(200);
    expect(stringField(patched, "status")).toBe("COMPLETED");
    expect(patched.createResponse).toBeUndefined();
    expect(patched.captureResponse).toBeUndefined();

    const invalidStatusResponse = await jsonRequest(
      `/admin/orders/${orderId.toString()}/status`,
      "PATCH",
      { status: "SHIPPED" },
      { Authorization: `Bearer ${adminAccessToken}` },
    );

    expect(invalidStatusResponse.status).toBe(400);

    const missingResponse = await jsonRequest(
      `/admin/orders/${new Types.ObjectId().toString()}/status`,
      "PATCH",
      { status: "COMPLETED" },
      { Authorization: `Bearer ${adminAccessToken}` },
    );

    expect(missingResponse.status).toBe(404);
  });

  test("GET /products/search is an alias that escapes regex characters", async () => {
    const searchResponse = await app.request("/products/search?q=Discounted&limit=2");
    const searchBody = await readJsonObject(searchResponse);
    const found = searchBody.products as unknown[];

    expect(searchResponse.status).toBe(200);
    expect(searchBody.page).toBe(1);
    expect(searchBody.limit).toBe(2);
    expect(found).toHaveLength(1);
    expect(stringField(asRecord(found[0]), "title")).toBe("Discounted Figure");

    const pageResponse = await app.request("/products/search?page=2&limit=1");
    const pageBody = await readJsonObject(pageResponse);

    expect(pageResponse.status).toBe(200);
    expect(pageBody.page).toBe(2);
    expect(pageBody.limit).toBe(1);

    const regexQueryResponse = await app.request(`/products/search?q=${encodeURIComponent(".*")}`);
    const regexQueryBody = await readJsonObject(regexQueryResponse);

    expect(regexQueryResponse.status).toBe(200);
    expect(regexQueryBody.products).toEqual([]);

    const regexTagsResponse = await app.request(`/products/1?tags=${encodeURIComponent("(anime")}`);
    const regexTagsBody = await readJsonObject(regexTagsResponse);

    expect(regexTagsResponse.status).toBe(200);
    expect(regexTagsBody.products).toEqual([]);
  });
});
