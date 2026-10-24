import { useSyncExternalStore } from "react";
import { getAuthSnapshot, subscribeToAuthChanges, type AuthSnapshot } from "@/lib/auth-storage";

const EMPTY_SNAPSHOT: AuthSnapshot = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

const getServerSnapshot = (): AuthSnapshot => EMPTY_SNAPSHOT;

export interface AuthState {
  user: AuthSnapshot["user"];
  isAuthenticated: boolean;
  isAdmin: boolean;
}

/**
 * Auth state backed by localStorage. Subscribing to `auth:changed` keeps the
 * navbar in sync immediately after login, logout, and token refresh.
 */
export const useAuth = (): AuthState => {
  const snapshot = useSyncExternalStore(subscribeToAuthChanges, getAuthSnapshot, getServerSnapshot);

  return {
    user: snapshot.user,
    isAuthenticated: snapshot.user !== null && snapshot.accessToken !== null,
    isAdmin: snapshot.user?.role === "ADMIN",
  };
};

export default useAuth;
