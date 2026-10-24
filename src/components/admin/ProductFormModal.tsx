import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminDialog from "./AdminDialog";
import Spinner from "./Spinner";
import { AlertIcon } from "./icons";
import {
  createEmptyProductFormValues,
  productFormSchema,
  productToFormValues,
  type ProductFormData,
} from "../../lib/admin-schema";
import type { Product } from "../../types";

interface ProductFormModalProps {
  product: Product | null;
  saving: boolean;
  error?: string;
  onSave: (data: ProductFormData) => void | Promise<void>;
  onCancel: () => void;
}

const inputClasses = (hasError: boolean): string =>
  `block w-full rounded-xl border bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
    hasError
      ? "border-rose-500/60 focus:border-rose-400 focus:ring-rose-500/25"
      : "border-white/10 focus:border-indigo-400 focus:ring-indigo-500/25"
  }`;

const labelClasses = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400";

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1.5 text-xs text-rose-300">{message}</p> : null;

const ProductFormModal = ({ product, saving, error, onSave, onCancel }: ProductFormModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ? productToFormValues(product) : createEmptyProductFormValues(),
  });

  return (
    <AdminDialog
      title={product ? "Edit product" : "New product"}
      description={
        product
          ? "Update the catalog details for this product."
          : "Add a new product to the storefront catalog."
      }
      onClose={onCancel}
      busy={saving}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSave)} className="space-y-5" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200"
          >
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="admin-product-title" className={labelClasses}>
            Title
          </label>
          <input
            id="admin-product-title"
            type="text"
            autoComplete="off"
            placeholder="e.g. Chibi Rem Figure"
            className={inputClasses(Boolean(errors.title))}
            {...register("title")}
          />
          <FieldError message={errors.title?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="admin-product-price" className={labelClasses}>
              Price (USD)
            </label>
            <input
              id="admin-product-price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              className={inputClasses(Boolean(errors.price))}
              {...register("price")}
            />
            <FieldError message={errors.price?.message} />
          </div>

          <div>
            <label htmlFor="admin-product-discount" className={labelClasses}>
              Discount (%)
            </label>
            <input
              id="admin-product-discount"
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              step="0.01"
              placeholder="Optional"
              className={inputClasses(Boolean(errors.discount))}
              {...register("discount")}
            />
            <FieldError message={errors.discount?.message} />
          </div>
        </div>

        <div>
          <label htmlFor="admin-product-image" className={labelClasses}>
            Main image
          </label>
          <input
            id="admin-product-image"
            type="text"
            autoComplete="off"
            placeholder="/assets/products/example.jpg"
            className={inputClasses(Boolean(errors.image))}
            {...register("image")}
          />
          <FieldError message={errors.image?.message} />
        </div>

        <div>
          <label htmlFor="admin-product-more-images" className={labelClasses}>
            Additional images
          </label>
          <textarea
            id="admin-product-more-images"
            rows={3}
            placeholder={"One image URL per line\nhttps://example.com/image-1.jpg"}
            className={`${inputClasses(Boolean(errors.moreImages))} resize-y font-mono text-xs leading-relaxed`}
            {...register("moreImages")}
          />
          <p className="mt-1.5 text-xs text-slate-500">One image URL per line.</p>
          <FieldError message={errors.moreImages?.message} />
        </div>

        <div>
          <label htmlFor="admin-product-tags" className={labelClasses}>
            Tags
          </label>
          <input
            id="admin-product-tags"
            type="text"
            autoComplete="off"
            placeholder="anime, figure, collectible"
            className={inputClasses(Boolean(errors.tags))}
            {...register("tags")}
          />
          <p className="mt-1.5 text-xs text-slate-500">Separate tags with commas.</p>
          <FieldError message={errors.tags?.message} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3.5 transition-colors hover:border-white/20">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-white/20 accent-indigo-500"
              {...register("inStock")}
            />
            <span>
              <span className="block text-sm font-medium text-slate-200">In stock</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Available for customers to purchase.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3.5 transition-colors hover:border-white/20">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-white/20 accent-indigo-500"
              {...register("isNewProduct")}
            />
            <span>
              <span className="block text-sm font-medium text-slate-200">New product</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Highlight this item as a new arrival.
              </span>
            </span>
          </label>
        </div>

        <fieldset className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Description
          </legend>

          <div className="mt-2 space-y-4">
            <div>
              <label htmlFor="admin-product-body1" className={labelClasses}>
                Body 1
              </label>
              <textarea
                id="admin-product-body1"
                rows={3}
                placeholder="Short introduction shown first."
                className={`${inputClasses(Boolean(errors.description?.body1))} resize-y`}
                {...register("description.body1")}
              />
              <FieldError message={errors.description?.body1?.message} />
            </div>

            <div>
              <label htmlFor="admin-product-body2" className={labelClasses}>
                Body 2
              </label>
              <textarea
                id="admin-product-body2"
                rows={3}
                placeholder="Additional details and specifications."
                className={`${inputClasses(Boolean(errors.description?.body2))} resize-y`}
                {...register("description.body2")}
              />
              <FieldError message={errors.description?.body2?.message} />
            </div>

            <div>
              <label htmlFor="admin-product-warning" className={labelClasses}>
                Warning
              </label>
              <textarea
                id="admin-product-warning"
                rows={2}
                placeholder="Optional safety or handling note."
                className={`${inputClasses(Boolean(errors.description?.warning))} resize-y`}
                {...register("description.warning")}
              />
              <FieldError message={errors.description?.warning?.message} />
            </div>
          </div>
        </fieldset>

        <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 flex flex-col-reverse gap-3 border-t border-white/10 bg-slate-900/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:-mb-6 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Spinner className="h-4 w-4" />}
            {saving ? "Saving..." : product ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </AdminDialog>
  );
};

export default ProductFormModal;
