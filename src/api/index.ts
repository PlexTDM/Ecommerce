import axios from "axios";
import type {
  Product,
  ProductsResponse,
  AuthCredentials,
  RegisterData,
  TokenResponse,
} from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACK_END_API as string,
});

// ==================== Products ====================

export const fetchProducts = (
  page: number = 1,
  params: Record<string, string | number> = {},
): Promise<ProductsResponse> =>
  api.get(`/products/${page}`, { params }).then((res) => res.data);

export const fetchProductById = (id: string): Promise<Product> =>
  api.get(`/products/product/${id}`).then((res) => res.data);

export const fetchRelatedProducts = (
  tag: string,
  limit: number = 6,
): Promise<Product[]> =>
  api
    .get("/products/random", { params: { limit, tag } })
    .then((res) => res.data);

// ==================== Auth ====================

export const loginUser = (
  credentials: AuthCredentials,
): Promise<TokenResponse> =>
  api.post("/auth/login", credentials).then((res) => res.data);

export const registerUser = (
  data: RegisterData,
): Promise<{ message: string }> =>
  api.post("/auth/register", data).then((res) => res.data);

export const refreshToken = (refreshToken: string): Promise<TokenResponse> =>
  api.put("/refresh-token", { refreshToken }).then((res) => res.data);

export const logoutUser = (data: {
  id: string;
  accessToken: string;
}): Promise<{ message: string }> =>
  api.post("/logout", data).then((res) => res.data);

// ==================== Account ====================

export const deleteAccount = (
  id: string,
  accessToken: string,
): Promise<{ message: string }> =>
  api
    .delete("/account", {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { id },
    })
    .then((res) => res.data);

// ==================== Payment ====================

export const createPayment = (
  data: Record<string, unknown>,
): Promise<unknown> => api.post("/payment", data).then((res) => res.data);

export default api;
