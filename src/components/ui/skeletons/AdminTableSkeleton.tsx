interface AdminTableSkeletonProps {
  rows?: number;
}

const AdminTableSkeleton = ({ rows = 7 }: AdminTableSkeletonProps) => (
  <div className="space-y-2 p-5" aria-hidden="true">
    {Array.from({ length: rows }, (_, index) => (
      <div key={index} className="h-14 animate-pulse rounded-xl bg-white/5" />
    ))}
  </div>
);

export default AdminTableSkeleton;
