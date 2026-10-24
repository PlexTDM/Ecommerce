// ==================== Users & Auth ====================

export type UserRole = "ADMIN" | "USER";

/** User shape returned by the server (never includes the password hash). */
export interface PublicUser {
  id: string;
  email: string;
  username: string | null;
  role: UserRole;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  message: string;
  user: PublicUser;
}

/** Login/register response. */
export type TokenResponse = AuthResponse;

// ==================== Products ====================

/**
 * One rating entry. The catalog stores two shapes:
 * - `{ stars, count }` from the app's own writes;
 * - legacy per-star buckets scraped from the source, e.g. `{ "5": 12, "4": 3, ... }`.
 */
export interface ProductRating {
  stars?: number;
  count?: number;
  [key: string]: number | string | undefined;
}

export interface ProductDescription {
  body1?: string;
  body2?: string;
  warning?: string;
}

export interface Product {
  _id: string;
  id: string;
  title: string;
  price: number;
  discount?: number | null;
  image: string;
  moreImages?: string[];
  tags?: string[];
  inStock: boolean;
  isNewProduct?: boolean;
  ratings: ProductRating[];
  description?: ProductDescription;
}

export interface ProductsTotal {
  all: number;
  discount: number;
  inStock: number;
  isNewProduct: number;
  lessThan: Record<"10" | "20" | "50" | "100", number>;
}

export interface ProductsResponse {
  page?: number;
  limit?: number;
  products: Product[];
  totalPages: number;
  totalProducts: ProductsTotal;
}

export interface FilterParams {
  q?: string;
  tags?: string;
  price?: string;
  [key: string]: string | undefined;
}

// ==================== Cart ====================

export interface CartItem {
  _id: string;
  id: string;
  title: string;
  price: number;
  image: string;
  discount?: number | null;
  qty: number;
  moreImages?: string[];
  tags?: string[];
  inStock?: boolean;
  isNewProduct?: boolean;
  ratings?: ProductRating[];
  description?: ProductDescription;
}

// ==================== Profile ====================

export interface Address {
  id: string;
  street: string;
  apt?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Profile {
  _id?: string;
  bio: string;
  userId: string;
  addresses: Address[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfilePayload {
  bio?: string;
  addresses?: Address[];
}

export interface UpdateAccountProfilePayload {
  username?: string;
  email?: string;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// ==================== Orders ====================

export type OrderStatus = "CREATED" | "CAPTURING" | "PENDING" | "COMPLETED" | "FAILED";

export interface OrderItem {
  productId: string;
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
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Order {
  _id: string;
  id?: string;
  userId?: string;
  items: OrderItem[];
  amount: OrderAmount;
  status: OrderStatus;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  createIdempotencyKey?: string;
  captureIdempotencyKey?: string;
  shipping?: OrderShippingAddress;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== Payments ====================

export interface PaymentCartLine {
  id: string;
  quantity: number;
}

export interface ShippingInput {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CreatePaymentOrderPayload {
  cart: PaymentCartLine[];
  shipping?: ShippingInput;
}

export interface PayPalErrorDetail {
  issue?: string;
  description?: string;
}

export interface PayPalCapture {
  id?: string;
  status?: string;
  amount?: {
    currency_code?: string;
    value?: string;
  };
}

export interface PayPalPurchaseUnit {
  payments?: {
    captures?: PayPalCapture[];
  };
}

export interface PayPalOrderResponse {
  id?: string;
  status?: string;
  details?: PayPalErrorDetail[];
  purchase_units?: PayPalPurchaseUnit[];
  debug_id?: string;
  message?: string;
  error?: string;
  orderId?: string;
}
