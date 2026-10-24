import mongoose, { Schema, type Model, type Types } from "mongoose";

export type OrderStatus = "CREATED" | "CAPTURING" | "PENDING" | "COMPLETED" | "FAILED";

export interface OrderItem {
  productId: Types.ObjectId;
  title: string;
  image: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderAmount {
  currency: "USD";
  value: string;
}

export interface OrderShippingAddress {
  name?: string | undefined;
  line1?: string | undefined;
  line2?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  postalCode?: string | undefined;
  country?: string | undefined;
}

export interface Order {
  userId?: Types.ObjectId;
  items: OrderItem[];
  amount: OrderAmount;
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
  shipping?: OrderShippingAddress;
  createdAt?: Date;
  updatedAt?: Date;
}

const orderItemSchema = new Schema<OrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: { type: String, required: true },
    image: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const orderAmountSchema = new Schema<OrderAmount>(
  {
    currency: { type: String, enum: ["USD"], required: true, default: "USD" },
    value: { type: String, required: true },
  },
  { _id: false },
);

const shippingAddressSchema = new Schema<OrderShippingAddress>(
  {
    name: { type: String, required: false },
    line1: { type: String, required: false },
    line2: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    postalCode: { type: String, required: false },
    country: { type: String, required: false },
  },
  { _id: false },
);

const orderSchema = new Schema<Order>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    items: { type: [orderItemSchema], required: true },
    amount: { type: orderAmountSchema, required: true },
    status: {
      type: String,
      enum: ["CREATED", "CAPTURING", "PENDING", "COMPLETED", "FAILED"],
      required: true,
      default: "CREATED",
      index: true,
    },
    paypalOrderId: { type: String, required: false, index: true },
    paypalCaptureId: { type: String, required: false },
    createIdempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    captureIdempotencyKey: { type: String, required: false },
    requestFingerprint: { type: String, required: false },
    createResponse: { type: Schema.Types.Mixed, required: false },
    createResponseStatus: { type: Number, required: false },
    captureResponse: { type: Schema.Types.Mixed, required: false },
    captureResponseStatus: { type: Number, required: false },
    captureRetryable: { type: Boolean, required: false },
    shipping: { type: shippingAddressSchema, required: false },
  },
  { timestamps: true },
);

const OrderModel: Model<Order> =
  (mongoose.models.Order as Model<Order> | undefined) ??
  mongoose.model<Order>("Order", orderSchema);

export default OrderModel;
