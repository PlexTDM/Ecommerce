import type { Order, OrderStatus, Product, ProductDescription } from "./index";

// ==================== Dashboard ====================

export interface AdminStats {
  products: number;
  orders: number;
  revenue: string;
  pendingOrders: number;
  lowStock: number;
}

// ==================== Products ====================

export interface AdminProductPayload {
  title: string;
  price: number;
  discount: number | null;
  image: string;
  moreImages: string[];
  tags: string[];
  inStock: boolean;
  isNewProduct: boolean;
  description?: ProductDescription;
}

export interface AdminProductsQuery {
  page: number;
  limit: number;
  q?: string;
}

export interface AdminProductsResponse {
  page: number;
  limit: number;
  totalPages: number;
  totalProducts: number;
  products: Product[];
}

// ==================== Orders ====================

/**
 * The admin orders endpoint may populate the customer reference. Keep these
 * fields optional so the UI works with both populated and raw order documents.
 */
export interface AdminOrderCustomer {
  id?: string;
  _id?: string;
  email?: string | null;
  username?: string | null;
  name?: string | null;
}

export type AdminOrderUser = AdminOrderCustomer | string | null;

export interface AdminOrder extends Order {
  user?: AdminOrderUser;
  customer?: AdminOrderUser;
  email?: string | null;
}

export interface AdminOrdersQuery {
  page: number;
  limit: number;
  status?: OrderStatus;
}

export interface AdminOrdersResponse {
  page: number;
  limit: number;
  totalPages: number;
  totalOrders: number;
  orders: AdminOrder[];
}

export type AdminTabId = "overview" | "products" | "orders";
