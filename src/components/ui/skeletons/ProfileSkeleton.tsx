const ProfileSkeleton = () => (
  <div className="rounded-xl bg-white p-8 shadow-sm" aria-hidden="true">
    <div className="animate-pulse space-y-4">
      <div className="h-24 rounded-xl bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="h-20 rounded-xl bg-gray-100" />
        <div className="h-20 rounded-xl bg-gray-100" />
        <div className="h-20 rounded-xl bg-gray-100" />
      </div>
      <div className="h-40 rounded-xl bg-gray-100" />
    </div>
  </div>
);

export default ProfileSkeleton;
