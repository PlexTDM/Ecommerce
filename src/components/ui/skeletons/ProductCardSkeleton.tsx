const ProductCardSkeleton = () => {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      aria-hidden="true"
    >
      <div className="aspect-square w-full animate-pulse bg-gray-200" />

      <div className="space-y-2 p-3 sm:p-4">
        <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-2/5 animate-pulse rounded bg-gray-100" />
        <div className="h-5 w-1/3 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 h-9 w-full animate-pulse rounded-xl bg-gray-100" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
