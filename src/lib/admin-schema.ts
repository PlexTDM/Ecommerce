import { z } from "zod";
import type { Product, ProductDescription } from "@/types";
import type { AdminProductPayload } from "@/types/admin";

const isNonNegativeNumber = (value: string): boolean => {
  if (value.trim() === "") return false;

  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
};

const requiredNumberField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine(isNonNegativeNumber, { message: `${label} must be a non-negative number` });

const optionalNumberField = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || isNonNegativeNumber(value), {
      message: `${label} must be a non-negative number or left blank`,
    });

export const productFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  price: requiredNumberField("Price"),
  discount: optionalNumberField("Discount").refine(
    (value) => value === "" || Number(value) <= 100,
    { message: "Discount must be between 0 and 100" },
  ),
  image: z.string().trim().min(1, "Main image is required"),
  moreImages: z.string().max(8000, "Image list is too long"),
  tags: z.string().max(1000, "Tag list is too long"),
  inStock: z.boolean(),
  isNewProduct: z.boolean(),
  description: z.object({
    body1: z.string().max(5000, "Description is too long").optional(),
    body2: z.string().max(5000, "Description is too long").optional(),
    warning: z.string().max(1000, "Warning is too long").optional(),
  }),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

export const createEmptyProductFormValues = (): ProductFormData => ({
  title: "",
  price: "",
  discount: "",
  image: "",
  moreImages: "",
  tags: "",
  inStock: true,
  isNewProduct: false,
  description: {
    body1: "",
    body2: "",
    warning: "",
  },
});

export const productToFormValues = (product: Product): ProductFormData => ({
  title: product.title,
  price: String(product.price),
  discount:
    product.discount === null || product.discount === undefined ? "" : String(product.discount),
  image: product.image,
  moreImages: (product.moreImages ?? []).join("\n"),
  tags: (product.tags ?? []).join(", "),
  inStock: product.inStock,
  isNewProduct: Boolean(product.isNewProduct),
  description: {
    body1: product.description?.body1 ?? "",
    body2: product.description?.body2 ?? "",
    warning: product.description?.warning ?? "",
  },
});

const parseImageLines = (value: string): string[] => {
  const seen = new Set<string>();
  const images: string[] = [];

  for (const line of value.split(/\r?\n/)) {
    const url = line.trim();

    if (url && !seen.has(url)) {
      seen.add(url);
      images.push(url);
    }
  }

  return images;
};

const parseTags = (value: string): string[] => {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const entry of value.split(",")) {
    const tag = entry.trim();

    if (tag && !seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
  }

  return tags;
};

const cleanOptionalText = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const roundCurrency = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export const productFormToPayload = (values: ProductFormData): AdminProductPayload => {
  const description: ProductDescription = {};
  const body1 = cleanOptionalText(values.description.body1);
  const body2 = cleanOptionalText(values.description.body2);
  const warning = cleanOptionalText(values.description.warning);

  if (body1) description.body1 = body1;
  if (body2) description.body2 = body2;
  if (warning) description.warning = warning;

  return {
    title: values.title.trim(),
    price: roundCurrency(Number(values.price)),
    discount: values.discount.trim() === "" ? null : roundCurrency(Number(values.discount.trim())),
    image: values.image.trim(),
    moreImages: parseImageLines(values.moreImages),
    tags: parseTags(values.tags),
    inStock: values.inStock,
    isNewProduct: values.isNewProduct,
    // Always include the object so edits can clear previously saved copy.
    description,
  };
};
