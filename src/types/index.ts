export interface ProductRatings {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface ProductDescription {
  body1: string;
  body2?: string;
  warning?: string;
}

export interface Product {
  _id: string;
  id: string;
  title: string;
  price: number;
  discount?: number;
  image: string;
  moreImages?: string[];
  tags?: string[];
  inStock: number;
  isNewProduct?: boolean;
  ratings: ProductRatings[];
  description: ProductDescription;
}

export interface ProductsResponse {
  products: Product[];
  totalPages: number;
  totalProducts: number;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface FilterParams {
  q?: string;
  tags?: string;
  price?: string;
  [key: string]: string | undefined;
}
