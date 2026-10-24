import { hash } from "bcryptjs";
import mongoose from "mongoose";
import Profile from "../models/profile.ts";
import User from "../models/user.ts";

const [emailArg, passwordArg] = Bun.argv.slice(2);
const email = (emailArg ?? Bun.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = passwordArg ?? Bun.env.ADMIN_PASSWORD ?? "";
const mongoUri = Bun.env.MONGO_URI ?? "";

if (!email || !password) {
  console.error(
    "Usage: bun run admin:create <email> <password>\n" +
      "   or: ADMIN_EMAIL=... ADMIN_PASSWORD=... bun run admin:create",
  );
  process.exit(1);
}

if (!mongoUri) {
  console.error("MONGO_URI is required (set it in .env or the environment).");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const fallbackUsername = email.split("@")[0] ?? email;

/** The failed run may have created the user before the profile insert failed. */
async function ensureProfile(userId: mongoose.Types.ObjectId): Promise<void> {
  const existingProfile = await Profile.findOne({ userId });

  if (existingProfile) return;

  await Profile.create({
    bio: "",
    userId,
    addresses: [],
  });
}

try {
  await mongoose.connect(mongoUri);

  const passwordHash = await hash(password, 10);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = "ADMIN";
    existing.password = passwordHash;

    if (!existing.username) {
      existing.username = fallbackUsername;
    }

    await existing.save();
    await ensureProfile(existing._id);
    console.log(`Updated existing user ${email} with the ADMIN role.`);
  } else {
    const userId = new mongoose.Types.ObjectId();

    await User.create({
      _id: userId,
      email,
      password: passwordHash,
      username: fallbackUsername,
      role: "ADMIN",
    });

    await ensureProfile(userId);

    console.log(`Created admin user ${email}.`);
  }
} catch (error) {
  console.error("Failed to create admin user:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
