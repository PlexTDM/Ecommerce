import type { Product } from "../../types";

export type AddCartPayload = Product & { qty?: number };

export type CartAction =
  | { type: "ADDITEM"; payload: AddCartPayload }
  | { type: "DELITEM"; payload: { _id: string } }
  | { type: "INCREASE_QTY"; payload: { _id: string } }
  | { type: "DECREASE_QTY"; payload: { _id: string } }
  | { type: "CLEAR_CART" };

// For Add Item to Cart
export const addCart = (product: AddCartPayload): CartAction => ({
  type: "ADDITEM",
  payload: product,
});

// For Delete Item from Cart
export const DELETE_ITEM = (productId: string): CartAction => ({
  type: "DELITEM",
  payload: { _id: productId },
});

export const INCREASE_QTY = (productId: string): CartAction => ({
  type: "INCREASE_QTY",
  payload: { _id: productId },
});

export const DECREASE_QTY = (productId: string): CartAction => ({
  type: "DECREASE_QTY",
  payload: { _id: productId },
});

export const CLEAR_CART = (): CartAction => ({ type: "CLEAR_CART" });
