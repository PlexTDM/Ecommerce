import { createContext, useState, useCallback, useRef, type ReactNode } from "react";
import { fetchProducts, fetchProductById, fetchRelatedProducts } from "@/api";
import type { Product, ProductsResponse, ProductsTotal } from "@/types";

interface ProductsContextValue {
  // state
  homeProducts: Product[] | null;
  setHomeProducts: React.Dispatch<React.SetStateAction<Product[] | null>>;
  homeLoading: boolean;
  products: Product[];
  productsLoading: boolean;
  totalPages: number;
  totalProducts: ProductsTotal;
  notFound: boolean;
  productDetail: Product | null;
  setProductDetail: React.Dispatch<React.SetStateAction<Product | null>>;
  detailLoading: boolean;
  detailError: string | null;
  relatedProducts: Product[];
  setRelatedProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  relatedLoading: boolean;
  // actions
  loadHomeProducts: () => Promise<void>;
  loadProducts: (page?: number, params?: Record<string, string>) => Promise<void>;
  loadProductById: (id: string, cachedProduct?: Product) => Promise<void>;
  loadRelatedProducts: (tag: string) => Promise<void>;
  searchProducts: (query: string) => Promise<void>;
  filterProducts: (filterParams: Record<string, string>) => Promise<void>;
}

export const ProductsContext = createContext<ProductsContextValue>({} as ProductsContextValue);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  // home page — featured products
  const [homeProducts, setHomeProducts] = useState<Product[] | null>(null);
  const [homeLoading, setHomeLoading] = useState(false);

  // products list page
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState<ProductsTotal>({
    all: 0,
    discount: 0,
    inStock: 0,
    isNewProduct: 0,
    lessThan: { 10: 0, 20: 0, 50: 0, 100: 0 },
  });
  const [notFound, setNotFound] = useState(false);

  // product detail page
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailRequestId = useRef(0);

  // related products (on detail page)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // ==================== Actions ====================

  const loadHomeProducts = useCallback(async () => {
    if (homeProducts) return;
    setHomeLoading(true);
    try {
      const res: ProductsResponse = await fetchProducts(1, { limit: 5 });
      setHomeProducts(res.products);
    } catch (err) {
      console.error("loadHomeProducts error:", err);
    } finally {
      setHomeLoading(false);
    }
  }, [homeProducts]);

  const loadProducts = useCallback(
    async (page: number = 1, params: Record<string, string> = {}) => {
      setProductsLoading(true);
      setNotFound(false);
      try {
        const res: ProductsResponse = await fetchProducts(page, params);
        setProducts(res.products);
        setTotalPages(res.totalPages);
        setTotalProducts(res.totalProducts);
        setNotFound(res.products.length === 0);
      } catch (err) {
        console.error("loadProducts error:", err);
      } finally {
        setProductsLoading(false);
      }
    },
    [],
  );

  const loadProductById = useCallback(async (id: string, cachedProduct?: Product) => {
    const requestId = ++detailRequestId.current;

    if (cachedProduct) {
      setProductDetail(cachedProduct);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }

    setProductDetail(null);
    setDetailLoading(true);
    setDetailError(null);

    try {
      const res: Product = await fetchProductById(id);

      if (detailRequestId.current !== requestId) return;
      setProductDetail(res);
    } catch (err) {
      if (detailRequestId.current !== requestId) return;

      console.error("loadProductById error:", err);
      setProductDetail(null);
      setDetailError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      if (detailRequestId.current === requestId) {
        setDetailLoading(false);
      }
    }
  }, []);

  const loadRelatedProducts = useCallback(async (tag: string) => {
    setRelatedLoading(true);
    try {
      const res: Product[] = await fetchRelatedProducts(tag);
      setRelatedProducts(res);
    } catch (err) {
      console.error("loadRelatedProducts error:", err);
    } finally {
      setRelatedLoading(false);
    }
  }, []);

  const searchProducts = useCallback(
    (query: string) => loadProducts(1, { q: query }),
    [loadProducts],
  );

  const filterProducts = useCallback(
    (filterParams: Record<string, string>) => loadProducts(1, filterParams),
    [loadProducts],
  );

  return (
    <ProductsContext.Provider
      value={{
        // state
        homeProducts,
        setHomeProducts,
        homeLoading,
        products,
        productsLoading,
        totalPages,
        totalProducts,
        notFound,
        productDetail,
        setProductDetail,
        detailLoading,
        detailError,
        relatedProducts,
        setRelatedProducts,
        relatedLoading,
        // actions
        loadHomeProducts,
        loadProducts,
        loadProductById,
        loadRelatedProducts,
        searchProducts,
        filterProducts,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};
