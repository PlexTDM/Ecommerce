import type { PublicUser } from "@/types";

export const AUTH_CHANGED_EVENT = "auth:changed";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

const AUTH_STORAGE_KEYS: readonly string[] = [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY];

export interface AuthSnapshot {
  user: PublicUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface AuthSession extends AuthSnapshot {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

const EMPTY_SNAPSHOT: AuthSnapshot = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Narrow arbitrary stored JSON into the `PublicUser` shape used by the app. */
export const parseStoredUser = (raw: string | null): PublicUser | null => {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isRecord(parsed)) return null;

    const { id, email, username, role } = parsed;

    if (typeof id !== "string" || id.length === 0) return null;
    if (typeof email !== "string" || email.length === 0) return null;

    return {
      id,
      email,
      username: typeof username === "string" && username.length > 0 ? username : null,
      role: role === "ADMIN" ? "ADMIN" : "USER",
    };
  } catch {
    return null;
  }
};

const readItem = (key: string): string | null => {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeItem = (key: string, value: string): void => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode, quota). Keep the app usable.
  }
};

const removeItem = (key: string): void => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures; the in-memory auth event still fires below.
  }
};

let cachedKey: string | null = null;
let cachedSnapshot: AuthSnapshot = EMPTY_SNAPSHOT;

const invalidateSnapshot = (): void => {
  cachedKey = null;
  cachedSnapshot = EMPTY_SNAPSHOT;
};

const emitAuthChanged = (): void => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
};

/**
 * Stable snapshot for `useSyncExternalStore`. The cache key mirrors the stored
 * values so repeated calls return the same object until storage changes.
 */
export const getAuthSnapshot = (): AuthSnapshot => {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;

  const accessToken = readItem(ACCESS_TOKEN_KEY);
  const refreshToken = readItem(REFRESH_TOKEN_KEY);
  const rawUser = readItem(USER_KEY);
  const nextKey = `${accessToken ?? ""}\u0000${refreshToken ?? ""}\u0000${rawUser ?? ""}`;

  if (nextKey === cachedKey) return cachedSnapshot;

  cachedKey = nextKey;
  cachedSnapshot = {
    user: parseStoredUser(rawUser),
    accessToken,
    refreshToken,
  };

  return cachedSnapshot;
};

export const getStoredUser = (): PublicUser | null => getAuthSnapshot().user;

export const getAccessToken = (): string | null => readItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = (): string | null => readItem(REFRESH_TOKEN_KEY);

export const setAuthSession = ({ user, accessToken, refreshToken }: AuthSession): void => {
  writeItem(ACCESS_TOKEN_KEY, accessToken);
  writeItem(REFRESH_TOKEN_KEY, refreshToken);
  writeItem(USER_KEY, JSON.stringify(user));
  invalidateSnapshot();
  emitAuthChanged();
};

export const updateStoredTokens = ({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken: string;
}): void => {
  writeItem(ACCESS_TOKEN_KEY, accessToken);
  writeItem(REFRESH_TOKEN_KEY, refreshToken);
  invalidateSnapshot();
  emitAuthChanged();
};

export const clearAuthSession = (): void => {
  removeItem(ACCESS_TOKEN_KEY);
  removeItem(REFRESH_TOKEN_KEY);
  removeItem(USER_KEY);
  invalidateSnapshot();
  emitAuthChanged();
};

/**
 * Subscribe to same-tab auth mutations (`auth:changed`) and cross-tab changes
 * (`storage`). Only storage keys owned by the auth store trigger a refresh.
 */
export const subscribeToAuthChanges = (listener: () => void): (() => void) => {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = (event: StorageEvent): void => {
    if (event.key === null || AUTH_STORAGE_KEYS.includes(event.key)) {
      invalidateSnapshot();
      listener();
    }
  };

  window.addEventListener(AUTH_CHANGED_EVENT, listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
};
