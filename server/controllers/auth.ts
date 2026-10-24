import { compare, hash } from "bcryptjs";
import { Hono } from "hono";
import type { Types } from "mongoose";
import { z } from "zod";
import { isDuplicateKeyError } from "../lib/errors.ts";
import { readRequestBody } from "../lib/request.ts";
import { authRateLimiter } from "../middleware/rateLimit.ts";
import Profile from "../models/profile.ts";
import User from "../models/user.ts";
import type { AppEnv, PublicUser, TokenUser, UserRole } from "../types.ts";
import { authenticate, generateAccessToken, generateRefreshToken } from "./token.ts";

const app = new Hono<AppEnv>();

interface UserResponseSource {
  _id: Types.ObjectId;
  email: string;
  username?: string;
  role: UserRole;
}

function toPublicUser(user: UserResponseSource): PublicUser {
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username ?? null,
    role: user.role,
  };
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  username: z.string().trim().min(2).max(50).optional(),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  confirmPassword: z.string().optional(),
});

const updateProfileSchema = z
  .object({
    username: z.string().trim().min(2).max(50).optional(),
    email: z.string().email().optional(),
  })
  .refine((data) => data.username !== undefined || data.email !== undefined, {
    message: "At least one field is required",
  });

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(128),
});

app.get("/ping", (c) => c.text("pong"));

app.post("/login", authRateLimiter, async (c) => {
  const parsed = loginSchema.safeParse(await readRequestBody(c));

  if (!parsed.success) {
    return c.json({ message: "Invalid request", errors: z.flattenError(parsed.error) }, 400);
  }

  try {
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() });

    if (!user) {
      return c.json({ message: "user not found" }, 404);
    }

    const passwordMatches = await compare(parsed.data.password, user.password);

    if (!passwordMatches) {
      return c.json({ message: "password does not match" }, 401);
    }

    const tokenUser: TokenUser = {
      id: user._id.toString(),
      role: user.role,
    };
    const accessToken = generateAccessToken(tokenUser);
    const refreshToken = await generateRefreshToken(tokenUser);

    return c.json({
      message: "User Logged in successfully",
      user: toPublicUser(user),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("login", error);
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

app.post("/register", authRateLimiter, async (c) => {
  const parsed = registerSchema.safeParse(await readRequestBody(c));

  if (!parsed.success) {
    return c.json({ message: "Invalid request", errors: z.flattenError(parsed.error) }, 400);
  }

  const data = parsed.data;

  if (data.confirmPassword !== undefined && data.confirmPassword !== data.password) {
    return c.json({ message: "Passwords do not match" }, 400);
  }

  const email = data.email.toLowerCase();

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return c.json({ message: "User already exists" }, 400);
    }

    const hashedPassword = await hash(data.password, 10);
    const username = data.username ?? data.name;

    const newUser = await User.create({
      email,
      password: hashedPassword,
      ...(username ? { username } : {}),
    });

    try {
      await Profile.create({
        bio: "Hello I Like Anime",
        userId: newUser._id,
        addresses: [],
      });
    } catch (profileError) {
      await User.findByIdAndDelete(newUser._id);
      throw profileError;
    }

    const tokenUser: TokenUser = {
      id: newUser._id.toString(),
      role: newUser.role,
    };
    const accessToken = generateAccessToken(tokenUser);
    const refreshToken = await generateRefreshToken(tokenUser);

    return c.json(
      {
        message: "User registered successfully",
        user: toPublicUser(newUser),
        accessToken,
        refreshToken,
      },
      201,
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return c.json({ message: "User already exists" }, 400);
    }

    console.error("register", error);
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

app.put("/profile", authenticate, async (c) => {
  const parsed = updateProfileSchema.safeParse(await readRequestBody(c));

  if (!parsed.success) {
    return c.json({ message: "Invalid request", errors: z.flattenError(parsed.error) }, 400);
  }

  const userId = c.get("user").id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return c.json({ message: "user not found" }, 404);
    }

    const update: Partial<Pick<typeof user, "username" | "email">> = {};

    if (parsed.data.username !== undefined) {
      update.username = parsed.data.username;
    }

    if (parsed.data.email !== undefined) {
      const email = parsed.data.email.toLowerCase();

      if (email !== user.email) {
        const existing = await User.findOne({
          email,
          _id: { $ne: user._id },
        });

        if (existing) {
          return c.json({ message: "Email already in use" }, 400);
        }
      }

      update.email = email;
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, update, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return c.json({ message: "user not found" }, 404);
    }

    return c.json({
      message: "Profile updated successfully",
      user: toPublicUser(updatedUser),
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return c.json({ message: "Email already in use" }, 400);
    }

    console.error("profile update", error);
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

app.put("/password", authenticate, async (c) => {
  const parsed = updatePasswordSchema.safeParse(await readRequestBody(c));

  if (!parsed.success) {
    return c.json({ message: "Invalid request", errors: z.flattenError(parsed.error) }, 400);
  }

  try {
    const user = await User.findById(c.get("user").id);

    if (!user) {
      return c.json({ message: "user not found" }, 404);
    }

    const passwordMatches = await compare(parsed.data.currentPassword, user.password);

    if (!passwordMatches) {
      return c.json({ message: "password does not match" }, 401);
    }

    const hashedPassword = await hash(parsed.data.newPassword, 10);
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    return c.json({ message: "Password updated successfully" }, 200);
  } catch (error) {
    console.error("password update", error);
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

export default app;
