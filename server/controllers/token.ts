import { hash } from "bcryptjs";
import type { Context, MiddlewareHandler } from "hono";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { z } from "zod";
import { getEnv } from "../env.ts";
import RefreshToken from "../models/refreshToken.ts";
import type { AppEnv, AuthUser, TokenUser, UserRole } from "../types.ts";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const tokenPayloadSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["ADMIN", "USER"]),
});

function decodeToken(token: string, secret: string): AuthUser {
  const decoded: unknown = jwt.verify(token, secret);
  return tokenPayloadSchema.parse(decoded);
}

export function verifyAccessToken(token: string): AuthUser {
  return decodeToken(token, getEnv().SECRET_ACCESS_TOKEN);
}

export function verifyRefreshToken(token: string): AuthUser {
  return decodeToken(token, getEnv().SECRET_REFRESH_TOKEN);
}

export function generateAccessToken(user: TokenUser): string {
  return jwt.sign({ id: user.id, role: user.role }, getEnv().SECRET_ACCESS_TOKEN, {
    expiresIn: "1d",
  });
}

export async function generateRefreshToken(user: TokenUser): Promise<string> {
  const refreshToken = jwt.sign({ id: user.id, role: user.role }, getEnv().SECRET_REFRESH_TOKEN, {
    expiresIn: "7d",
  });

  const tokenHash = await hash(refreshToken, 10);

  await RefreshToken.create({
    tokenHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    userId: new Types.ObjectId(user.id),
  });

  return refreshToken;
}

export function getBearerToken(c: Context<AppEnv>): string | undefined {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return undefined;

  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : undefined;
}

export function getOptionalAuthUser(c: Context<AppEnv>): AuthUser | undefined {
  const token = getBearerToken(c);
  if (!token) return undefined;

  try {
    return verifyAccessToken(token);
  } catch {
    return undefined;
  }
}

export const authenticate: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = getBearerToken(c);

  if (!token) {
    return c.json({ message: "No token provided" }, 401);
  }

  try {
    c.set("user", verifyAccessToken(token));
  } catch {
    return c.json({ message: "Invalid or expired token" }, 401);
  }

  await next();
};

export function authorizeRole(role: UserRole): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const user = c.get("user");

    if (!user || user.role !== role) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await next();
  };
}
