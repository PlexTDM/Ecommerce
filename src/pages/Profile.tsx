import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchOrders, fetchProfile, getAccessToken, getApiErrorMessage } from "@/api";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { ProfileSkeleton } from "@/components/ui/skeletons";
import type { Order, Profile as ProfileModel, PublicUser } from "@/types";

const readStoredUser = (): PublicUser | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { id?: unknown }).id === "string" &&
      typeof (parsed as { email?: unknown }).email === "string"
    ) {
      return parsed as PublicUser;
    }

    return null;
  } catch {
    return null;
  }
};

const Profile = () => {
  const hasToken = Boolean(getAccessToken());
  const [user, setUser] = useState<PublicUser | null>(readStoredUser);
  const [profile, setProfile] = useState<ProfileModel | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(hasToken);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!hasToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    const load = async () => {
      const [profileResult, ordersResult] = await Promise.allSettled([
        fetchProfile(),
        fetchOrders(),
      ]);

      if (cancelled) return;

      const messages: string[] = [];

      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value);
      } else {
        messages.push(getApiErrorMessage(profileResult.reason, "Could not load your profile."));
      }

      if (ordersResult.status === "fulfilled") {
        setOrders(ordersResult.value);
      } else {
        messages.push(getApiErrorMessage(ordersResult.reason, "Could not load your orders."));
      }

      setError(messages.join(" "));
      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [hasToken, reloadKey]);

  if (!hasToken) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4 py-16">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Sign in to view your account</h1>
          <p className="mt-3 text-gray-500">
            Your profile, addresses and order history are available after you sign in.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Account</h1>
          <p className="text-gray-500">{user?.email ?? "Manage your profile and orders"}</p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="w-fit rounded-md bg-red-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <ProfileSkeleton />
        ) : (
          <ProfileTabs
            user={user}
            profile={profile}
            orders={orders}
            onUserUpdate={setUser}
            onProfileUpdate={setProfile}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;
