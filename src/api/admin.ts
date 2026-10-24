import axios from "axios";
import { authenticatedApi } from "./index";
import type { Order, OrderStatus, Product } from "@/types";
import type {
  AdminOrdersQuery,
  AdminOrdersResponse,
  AdminProductPayload,
  AdminProductsQuery,
  AdminProductsResponse,
  AdminStats,
} from "@/types/admin";

/** Admin requests share the authenticated client and its 401 refresh flow. */
const adminApi = authenticatedApi;

interface ErrorBody {
  message?: unknown;
  error?: unknown;
  details?: unknown;
}

/**
 * Extract a human-readable message from an axios/JS error. Mirrors the public
 * API helper without depending on it (the admin area owns its own client).
 */
export const getAdminApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string => {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;

    if (data && typeof data === "object") {
      const body = data as ErrorBody;

      if (typeof body.message === "string" && body.message.trim()) {
        return body.message;
      }

      if (typeof body.error === "string" && body.error.trim()) {
        return body.error;
      }

      if (Array.isArray(body.details) && body.details.length > 0) {
        const detail: unknown = body.details[0];

        if (detail && typeof detail === "object") {
          const { issue, description } = detail as {
            issue?: unknown;
            description?: unknown;
          };
          const parts = [issue, description].filter(
            (part): part is string => typeof part === "string" && part.trim().length > 0,
          );

          if (parts.length > 0) return parts.join(": ");
        }
      }
    }

    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
};

// ==================== Dashboard ====================

export const fetchAdminStats = (signal?: AbortSignal): Promise<AdminStats> =>
  adminApi.get("/admin/stats", { signal }).then((res) => res.data);

// ==================== Products ====================

export const fetchAdminProducts = (
  query: AdminProductsQuery,
  signal?: AbortSignal,
): Promise<AdminProductsResponse> =>
  adminApi
    .get("/admin/products", {
      params: {
        page: query.page,
        limit: query.limit,
        ...(query.q ? { q: query.q } : {}),
      },
      signal,
    })
    .then((res) => res.data);

export const createAdminProduct = (payload: AdminProductPayload): Promise<Product> =>
  adminApi.post("/admin/products", payload).then((res) => res.data);

export const updateAdminProduct = (id: string, payload: AdminProductPayload): Promise<Product> =>
  adminApi.put(`/admin/products/${encodeURIComponent(id)}`, payload).then((res) => res.data);

export const deleteAdminProduct = (id: string): Promise<{ message: string }> =>
  adminApi.delete(`/admin/products/${encodeURIComponent(id)}`).then((res) => res.data);

// ==================== Orders ====================

export const fetchAdminOrders = (
  query: AdminOrdersQuery,
  signal?: AbortSignal,
): Promise<AdminOrdersResponse> =>
  adminApi
    .get("/admin/orders", {
      params: {
        page: query.page,
        limit: query.limit,
        ...(query.status ? { status: query.status } : {}),
      },
      signal,
    })
    .then((res) => res.data);

export const updateAdminOrderStatus = (id: string, status: OrderStatus): Promise<Order> =>
  adminApi
    .patch(`/admin/orders/${encodeURIComponent(id)}/status`, { status })
    .then((res) => res.data);

export default adminApi;
