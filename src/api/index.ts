import axios, { type InternalAxiosRequestConfig } from "axios";
import type {
  AuthCredentials,
  AuthResponse,
  AuthTokens,
  CreatePaymentOrderPayload,
  Order,
  PayPalOrderResponse,
  Product,
  ProductsResponse,
  Profile,
  PublicUser,
  RegisterData,
  UpdateAccountProfilePayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from "../types";

const baseURL = import.meta.env.VITE_BACK_END_API as string;

/** Client for public endpoints (products, auth, refresh, logout). */
const api = axios.create({ baseURL });

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem("accessToken");
  } catch {
    return null;
  }
};

const attachAccessToken = (config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

/** Client for authenticated endpoints. Reads the token from localStorage. */
const authApi = axios.create({ baseURL });
authApi.interceptors.request.use(attachAccessToken);

/** Extract a human-readable message from an axios/JS error. */
export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string => {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;

    if (data && typeof data === "object") {
      const body = data as {
        message?: unknown;
        error?: unknown;
        details?: unknown;
      };

      if (typeof body.message === "string" && body.message.trim()) {
        return body.message;
      }

      if (typeof body.error === "string" && body.error.trim()) {
        return body.error;
      }

      if (Array.isArray(body.details) && body.details.length > 0) {
        const detail = body.details[0] as {
          issue?: unknown;
          description?: unknown;
        };
        const issue = typeof detail.issue === "string" ? detail.issue : undefined;
        const description = typeof detail.description === "string" ? detail.description : undefined;

        if (issue || description) {
          return [issue, description].filter(Boolean).join(": ");
        }
      }
    }

    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) return error.message;

  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }

  return fallback;
};

// ==================== Products ====================

export const fetchProducts = (
  page: number = 1,
  params: Record<string, string | number> = {},
): Promise<ProductsResponse> => api.get(`/products/${page}`, { params }).then((res) => res.data);

export const fetchProductById = (id: string): Promise<Product> =>
  api.get(`/products/product/${id}`).then((res) => res.data);

export const fetchRelatedProducts = (tag: string, limit: number = 6): Promise<Product[]> =>
  api.get("/products/random", { params: { limit, tag } }).then((res) => res.data);

// ==================== Auth ====================

export const loginUser = (credentials: AuthCredentials): Promise<AuthResponse> =>
  api.post("/auth/login", credentials).then((res) => res.data);

export const registerUser = (data: RegisterData): Promise<AuthResponse> =>
  api.post("/auth/register", data).then((res) => res.data);

export const refreshToken = (refreshToken: string): Promise<AuthTokens> =>
  api.put("/refresh-token", { refreshToken }).then((res) => res.data);

export const logoutUser = (data: {
  id: string;
  accessToken: string;
}): Promise<{ message: string }> => api.post("/logout", data).then((res) => res.data);

// ==================== Account ====================

export const deleteAccount = (id: string, accessToken: string): Promise<{ message: string }> =>
  authApi
    .delete("/account", {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { id },
    })
    .then((res) => res.data);

export const updateAccountProfile = (
  data: UpdateAccountProfilePayload,
): Promise<{ message: string; user: PublicUser }> =>
  authApi.put("/auth/profile", data).then((res) => res.data);

export const updatePassword = (data: UpdatePasswordPayload): Promise<{ message: string }> =>
  authApi.put("/auth/password", data).then((res) => res.data);

// ==================== Profile ====================

export const fetchProfile = (): Promise<Profile> => authApi.get("/profile").then((res) => res.data);

export const updateProfile = (data: UpdateProfilePayload): Promise<Profile> =>
  authApi.put("/profile", data).then((res) => res.data);

// ==================== Orders ====================

export const fetchOrders = (): Promise<Order[]> => authApi.get("/orders").then((res) => res.data);

export const fetchOrder = (id: string): Promise<Order> =>
  authApi.get(`/orders/${id}`).then((res) => res.data);

// ==================== Payment ====================

/**
 * Creates a PayPal order. The idempotency key is sent both as the
 * `Idempotency-Key` header and in the request body so retries reuse the
 * same server-side PayPal request id.
 */
export const createPaymentOrder = (
  data: CreatePaymentOrderPayload,
  idempotencyKey: string,
): Promise<PayPalOrderResponse> =>
  authApi
    .post(
      "/payment/orders",
      { ...data, idempotencyKey },
      { headers: { "Idempotency-Key": idempotencyKey } },
    )
    .then((res) => res.data);

/**
 * Captures a PayPal order. A deterministic capture key (`capture:<orderId>`)
 * is sent so retries are deduplicated by the server.
 */
export const capturePaymentOrder = (
  orderId: string,
  idempotencyKey: string,
): Promise<PayPalOrderResponse> =>
  authApi
    .post(
      `/payment/orders/${orderId}/capture`,
      {
        idempotencyKey,
        captureIdempotencyKey: idempotencyKey,
      },
      { headers: { "Idempotency-Key": idempotencyKey } },
    )
    .then((res) => res.data);

export default api;
