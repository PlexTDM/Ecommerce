const AdminOverviewSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" aria-hidden="true">
    {Array.from({ length: 5 }, (_, index) => (
      <div
        key={index}
        className="animate-pulse rounded-2xl border border-white/5 bg-slate-900/60 p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-full space-y-3">
            <div className="h-3 w-24 rounded-full bg-white/5" />
            <div className="h-8 w-20 rounded-lg bg-white/10" />
          </div>
          <div className="h-10 w-10 rounded-xl bg-white/5" />
        </div>
        <div className="mt-4 h-3 w-28 rounded-full bg-white/5" />
      </div>
    ))}
  </div>
);

export default AdminOverviewSkeleton;
