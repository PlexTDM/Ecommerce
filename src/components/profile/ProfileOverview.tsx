import type { Order, Profile, PublicUser } from "../../types";

interface ProfileOverviewProps {
  user: PublicUser | null;
  profile: Profile | null;
  orders: Order[];
}

const ProfileOverview = ({ user, profile, orders }: ProfileOverviewProps) => {
  const displayName = user?.username?.trim() || user?.email?.split("@")[0] || "Guest";
  const email = user?.email ?? "No email on file";
  const initial = displayName.charAt(0).toUpperCase();
  const bio = profile?.bio?.trim() || "No bio yet.";
  const completedOrders = orders.filter((order) => order.status === "COMPLETED").length;
  const addressCount = profile?.addresses.length ?? 0;

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 sm:p-8">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-white/20 text-3xl font-bold text-white shadow-lg">
            {initial}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold text-white sm:text-3xl">{displayName}</h2>
            <p className="mt-1 truncate text-indigo-100">{email}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-indigo-100/80">
              {user?.role ?? "USER"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-gray-50 p-4 text-center ring-1 ring-gray-900/5">
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          <p className="text-sm text-gray-500">Total orders</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4 text-center ring-1 ring-gray-900/5">
          <p className="text-2xl font-bold text-gray-900">{completedOrders}</p>
          <p className="text-sm text-gray-500">Completed</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4 text-center ring-1 ring-gray-900/5">
          <p className="text-2xl font-bold text-gray-900">{addressCount}</p>
          <p className="text-sm text-gray-500">Saved addresses</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">About</h3>
        <p className="mt-2 whitespace-pre-line text-gray-700">{bio}</p>
      </div>
    </div>
  );
};

export default ProfileOverview;
