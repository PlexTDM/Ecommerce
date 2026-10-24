const ProductCardSkeleton = () => {
  return (
    <div className="border border-gray-200 p-2 rounded-md shadow-sm" aria-hidden="true">
      <div className="h-64 w-full animate-pulse rounded bg-gray-200" />

      <div className="p-2">
        <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-gray-200" />

        <div className="mt-3 flex items-center gap-2">
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-10 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="mt-3 h-5 w-1/3 animate-pulse rounded bg-gray-200" />

        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
