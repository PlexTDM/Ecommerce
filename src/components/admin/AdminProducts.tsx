import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  getAdminApiErrorMessage,
  updateAdminProduct,
} from "../../api/admin";
import type { Product } from "../../types";
import type { AdminProductsResponse } from "../../types/admin";
import { productFormToPayload, type ProductFormData } from "../../lib/admin-schema";
import AdminPagination from "./AdminPagination";
import ConfirmDialog from "./ConfirmDialog";
import ProductFormModal from "./ProductFormModal";
import Spinner from "./Spinner";
import { AdminTableSkeleton } from "../ui/skeletons";
import {
  AlertIcon,
  BoxIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  TrashIcon,
} from "./icons";
import { formatCurrency, formatNumber } from "./format";

const PAGE_SIZE = 20;

const getEffectivePrice = (product: Product): number => {
  const discount = Number(product.discount) || 0;
  if (discount <= 0) return product.price;

  return Math.round((product.price * (1 - discount / 100) + Number.EPSILON) * 100) / 100;
};

const ProductThumbnail = ({ src, alt }: { src?: string; alt: string }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-950/60">
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <BoxIcon className="h-5 w-5 text-slate-600" />
      )}
    </div>
  );
};

const StockBadge = ({ inStock }: { inStock: boolean }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
      inStock
        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
        : "border-rose-400/30 bg-rose-500/10 text-rose-200"
    }`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
    {inStock ? "In stock" : "Out of stock"}
  </span>
);

const ProductTags = ({ tags }: { tags?: string[] }) => {
  if (!tags || tags.length === 0) {
    return <span className="text-xs text-slate-600">—</span>;
  }

  return (
    <div className="flex max-w-52 flex-wrap gap-1.5">
      {tags.slice(0, 3).map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-200"
        >
          {tag}
        </span>
      ))}
      {tags.length > 3 && (
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
          +{tags.length - 3}
        </span>
      )}
    </div>
  );
};

interface AdminProductsProps {
  active: boolean;
}

const AdminProducts = ({ active }: AdminProductsProps) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [data, setData] = useState<AdminProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!active) return;

    const controller = new AbortController();
    let isCurrent = true;

    setLoading(true);
    setError("");

    fetchAdminProducts(
      {
        page,
        limit: PAGE_SIZE,
        ...(debouncedSearch ? { q: debouncedSearch } : {}),
      },
      controller.signal,
    )
      .then((response) => {
        if (isCurrent) setData(response);
      })
      .catch((err: unknown) => {
        if (isCurrent) {
          setError(getAdminApiErrorMessage(err, "Could not load products."));
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [active, page, debouncedSearch, reloadKey]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (page !== 1) setPage(1);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setFormError("");
    setEditorOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormError("");
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
    setEditingProduct(null);
    setFormError("");
  };

  const handleSave = async (values: ProductFormData) => {
    setSaving(true);
    setFormError("");

    const payload = productFormToPayload(values);

    try {
      if (editingProduct) {
        const updated = await updateAdminProduct(editingProduct._id, payload);
        toast.success(`“${updated.title || payload.title}” updated`);
        setEditorOpen(false);
        setEditingProduct(null);
        setReloadKey((key) => key + 1);
      } else {
        const created = await createAdminProduct(payload);
        toast.success(`“${created.title || payload.title}” created`);
        setEditorOpen(false);
        setEditingProduct(null);
        setPage(1);
        setReloadKey((key) => key + 1);
      }
    } catch (err: unknown) {
      const message = getAdminApiErrorMessage(err, "Could not save this product.");
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (product: Product) => {
    setDeleteTarget(product);
    setDeleteError("");
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const result = await deleteAdminProduct(deleteTarget._id);
      toast.success(result.message || "Product deleted");
      setDeleteTarget(null);

      if (data && data.products.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        setReloadKey((key) => key + 1);
      }
    } catch (err: unknown) {
      const message = getAdminApiErrorMessage(err, "Could not delete this product.");
      setDeleteError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const products = data?.products ?? [];
  const totalProducts = data?.totalProducts ?? 0;
  const totalPages = Math.max(data?.totalPages ?? 1, 1);
  const rangeStart = totalProducts === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalProducts);
  const summary =
    totalProducts === 0
      ? "No products"
      : `Showing ${formatNumber(rangeStart)}–${formatNumber(rangeEnd)} of ${formatNumber(
          totalProducts,
        )} products`;

  return (
    <section
      aria-labelledby="admin-products-heading"
      aria-busy={loading}
      className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-2xl shadow-slate-950/40"
    >
      <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2
            id="admin-products-heading"
            className="text-lg font-semibold tracking-tight text-slate-100"
          >
            Products
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Create, edit, and manage the items shown on the storefront.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 pl-9 pr-9 text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 sm:w-72"
            />
            {loading && data && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner className="h-3.5 w-3.5 text-indigo-300" />
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition-colors hover:bg-indigo-400"
          >
            <PlusIcon className="h-4 w-4" />
            New product
          </button>
        </div>
      </div>

      {error && data && (
        <div
          role="alert"
          className="mx-5 mt-4 flex flex-col gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error} Showing the most recent results.</span>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-100 transition-colors hover:bg-rose-500/30"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {loading && !data ? (
        <AdminTableSkeleton />
      ) : !data ? (
        <div
          role="alert"
          className="m-5 flex flex-col gap-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
              <AlertIcon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold text-rose-100">Could not load products</h3>
              <p className="mt-1 text-sm text-rose-200/70">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-400"
          >
            <RefreshIcon className="h-4 w-4" />
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400">
            <BoxIcon className="h-6 w-6" />
          </span>
          <h3 className="mt-4 text-base font-semibold text-slate-200">No products found</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {debouncedSearch
              ? `Nothing matches “${debouncedSearch}”. Try a different search.`
              : "Create your first product to start building the catalog."}
          </p>
          {!debouncedSearch && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
            >
              <PlusIcon className="h-4 w-4" />
              Add product
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            className={`hidden overflow-x-auto transition-opacity md:block ${
              loading ? "opacity-60" : ""
            }`}
          >
            <table className="w-full min-w-205 text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-950/40 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Product
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">
                    Stock
                  </th>
                  <th scope="col" className="px-4 py-3.5 font-semibold">
                    Tags
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((product) => {
                  const isDeleting = deleting && deleteTarget?._id === product._id;
                  const hasDiscount = Number(product.discount) > 0;

                  return (
                    <tr key={product._id} className="transition-colors hover:bg-white/3">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <ProductThumbnail src={product.image} alt={product.title} />
                          <div className="min-w-0">
                            <p className="max-w-xs truncate font-medium text-slate-100">
                              {product.title}
                            </p>
                            <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                              <span>#{product._id.slice(-6)}</span>
                              {product.isNewProduct && (
                                <span className="rounded-full border border-indigo-400/25 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-200">
                                  New
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {hasDiscount ? (
                          <>
                            <p className="font-semibold text-slate-100">
                              {formatCurrency(getEffectivePrice(product))}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              <span className="line-through">{formatCurrency(product.price)}</span>{" "}
                              · {product.discount}% off
                            </p>
                          </>
                        ) : (
                          <p className="font-semibold text-slate-100">
                            {formatCurrency(product.price)}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <StockBadge inStock={product.inStock} />
                      </td>

                      <td className="px-4 py-3.5">
                        <ProductTags tags={product.tags} />
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            aria-label={`Edit ${product.title}`}
                            className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDelete(product)}
                            disabled={isDeleting}
                            aria-label={`Delete ${product.title}`}
                            className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-2 text-rose-300 transition-colors hover:bg-rose-500/20 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <Spinner className="h-4 w-4" />
                            ) : (
                              <TrashIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul
            className={`divide-y divide-white/10 md:hidden ${
              loading ? "opacity-60 transition-opacity" : ""
            }`}
          >
            {products.map((product) => {
              const isDeleting = deleting && deleteTarget?._id === product._id;
              const hasDiscount = Number(product.discount) > 0;

              return (
                <li key={product._id} className="p-4">
                  <div className="flex items-start gap-3">
                    <ProductThumbnail src={product.image} alt={product.title} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-100">{product.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">#{product._id.slice(-6)}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-slate-100">
                            {formatCurrency(
                              hasDiscount ? getEffectivePrice(product) : product.price,
                            )}
                          </p>
                          {hasDiscount && (
                            <p className="text-[11px] text-slate-500 line-through">
                              {formatCurrency(product.price)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StockBadge inStock={product.inStock} />
                        {product.isNewProduct && (
                          <span className="rounded-full border border-indigo-400/25 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-200">
                            New
                          </span>
                        )}
                      </div>

                      <div className="mt-2">
                        <ProductTags tags={product.tags} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(product)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => openDelete(product)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/20 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Spinner className="h-3.5 w-3.5" />
                      ) : (
                        <TrashIcon className="h-3.5 w-3.5" />
                      )}
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <AdminPagination
            page={page}
            totalPages={totalPages}
            summary={summary}
            disabled={loading}
            onPageChange={(nextPage) => setPage(Math.min(Math.max(nextPage, 1), totalPages))}
          />
        </>
      )}

      <AnimatePresence>
        {editorOpen && (
          <ProductFormModal
            key={editingProduct?._id ?? "new-product"}
            product={editingProduct}
            saving={saving}
            error={formError}
            onSave={handleSave}
            onCancel={closeEditor}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <ConfirmDialog
            key={deleteTarget._id}
            title="Delete product"
            message={
              <p>
                Delete <span className="font-semibold text-rose-100">{deleteTarget.title}</span>?
                This removes it from the catalog and cannot be undone.
              </p>
            }
            confirmLabel="Delete product"
            busyLabel="Deleting..."
            busy={deleting}
            error={deleteError}
            onConfirm={handleDelete}
            onCancel={closeDelete}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default AdminProducts;
