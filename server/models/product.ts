import mongoose, { Schema, type Model } from "mongoose";

export interface ProductDescription {
  warning?: string;
  body1?: string;
  body2?: string;
}

export interface ProductRating {
  stars: number;
  count: number;
}

export interface Product {
  title: string;
  price: number;
  discount?: number | null;
  image: string;
  id: string;
  isNewProduct: boolean;
  inStock: boolean;
  moreImages: string[];
  tags: string[];
  description?: ProductDescription;
  ratings: ProductRating[];
  createdAt?: Date;
  updatedAt?: Date;
}

const descriptionSchema = new Schema<ProductDescription>(
  {
    warning: { type: String, required: false },
    body1: { type: String, required: false },
    body2: { type: String, required: false },
  },
  { _id: false },
);

const ratingSchema = new Schema<ProductRating>(
  {
    stars: { type: Number, required: true },
    count: { type: Number, required: true },
  },
  { _id: false },
);

const productSchema = new Schema<Product>(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, required: false, default: null },
    image: { type: String, required: true },
    id: { type: String, required: true },
    isNewProduct: { type: Boolean, required: true, default: false },
    inStock: { type: Boolean, required: true, default: true },
    moreImages: { type: [String], required: true, default: [] },
    tags: { type: [String], required: true, default: [] },
    description: { type: descriptionSchema, required: false },
    ratings: { type: [ratingSchema], required: true, default: [] },
  },
  { timestamps: true },
);

const ProductModel: Model<Product> =
  (mongoose.models.Product as Model<Product> | undefined) ??
  mongoose.model<Product>("Product", productSchema);

export default ProductModel;
