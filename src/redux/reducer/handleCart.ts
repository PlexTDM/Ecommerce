import type { CartItem } from "@/types";
import type { CartAction } from "@/redux/action";

const CART_STORAGE_KEY = "cart";

const persistCart = (cart: CartItem[]): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Storage can be unavailable (private mode, quota, SSR). The in-memory
    // Redux state still works, so silently skip persistence.
  }
};

// Retrieve initial state from localStorage if available
const getInitialCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) return [];

    const parsed: unknown = JSON.parse(storedCart);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
};

const handleCart = (state: CartItem[] = getInitialCart(), action: CartAction): CartItem[] => {
  switch (action.type) {
    case "ADDITEM": {
      const product = action.payload;
      const quantity = product.qty !== undefined && product.qty > 0 ? product.qty : 1;
      const exist = state.find((item) => item._id === product._id);

      const updatedCart: CartItem[] = exist
        ? state.map((item) =>
            item._id === product._id ? { ...item, qty: item.qty + quantity } : item,
          )
        : [...state, { ...product, qty: quantity }];

      persistCart(updatedCart);
      return updatedCart;
    }

    case "DELITEM": {
      const updatedCart = state.filter((item) => item._id !== action.payload._id);

      if (updatedCart.length === state.length) return state;

      persistCart(updatedCart);
      return updatedCart;
    }

    case "INCREASE_QTY": {
      const exist = state.find((item) => item._id === action.payload._id);
      if (!exist) return state;

      const updatedCart = state.map((item) =>
        item._id === action.payload._id ? { ...item, qty: item.qty + 1 } : item,
      );

      persistCart(updatedCart);
      return updatedCart;
    }

    case "DECREASE_QTY": {
      const exist = state.find((item) => item._id === action.payload._id);
      if (!exist) return state;

      const updatedCart: CartItem[] =
        exist.qty > 1
          ? state.map((item) =>
              item._id === action.payload._id ? { ...item, qty: item.qty - 1 } : item,
            )
          : state.filter((item) => item._id !== exist._id);

      persistCart(updatedCart);
      return updatedCart;
    }

    case "CLEAR_CART": {
      persistCart([]);
      return [];
    }

    default:
      return state;
  }
};

export default handleCart;
