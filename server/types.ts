export type UserRole = "ADMIN" | "USER";

export interface AuthUser {
  id: string;
  role: UserRole;
}

export interface TokenUser {
  id: string;
  role: UserRole;
}

export interface AppEnv {
  Variables: {
    user: AuthUser;
  };
}

export interface PublicUser {
  id: string;
  email: string;
  username: string | null;
  role: UserRole;
}
