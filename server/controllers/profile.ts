import { Hono } from "hono";
import mongoose from "mongoose";
import { z } from "zod";
import { readRequestBody } from "../lib/request.ts";
import Profile from "../models/profile.ts";
import type { AppEnv } from "../types.ts";
import { authenticate } from "./token.ts";

const app = new Hono<AppEnv>();

app.use("*", authenticate);

const addressSchema = z.object({
  id: z.string().min(1),
  street: z.string().min(1),
  apt: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().min(1),
});

const updateProfileSchema = z
  .object({
    bio: z.string().max(5_000).optional(),
    addresses: z.array(addressSchema).max(50).optional(),
  })
  .refine((data) => data.bio !== undefined || data.addresses !== undefined, {
    message: "At least one field is required",
  });

app.get("/", async (c) => {
  const user = c.get("user");

  try {
    const profile = await Profile.findOne({
      userId: new mongoose.Types.ObjectId(user.id),
    });

    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    return c.json(profile, 200);
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

app.put("/", async (c) => {
  const parsed = updateProfileSchema.safeParse(await readRequestBody(c));

  if (!parsed.success) {
    return c.json({ message: "Invalid request", errors: z.flattenError(parsed.error) }, 400);
  }

  const user = c.get("user");

  try {
    const update: {
      bio?: string;
      addresses?: z.infer<typeof addressSchema>[];
    } = {};

    if (parsed.data.bio !== undefined) {
      update.bio = parsed.data.bio;
    }

    if (parsed.data.addresses !== undefined) {
      update.addresses = parsed.data.addresses;
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(user.id) },
      update,
      { new: true, runValidators: true },
    );

    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    return c.json(profile, 200);
  } catch (error) {
    console.error("Failed to update profile:", error);
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

export default app;
