import mongoose, { Schema, type Model } from "mongoose";
import type { UserRole } from "../types.ts";

export interface User {
  username?: string;
  email: string;
  password: string;
  avatar?: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<User>(
  {
    username: { type: String, required: false },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    avatar: { type: String, required: false },
    role: {
      type: String,
      enum: ["ADMIN", "USER"],
      required: true,
      default: "USER",
    },
  },
  { timestamps: true },
);

const UserModel: Model<User> =
  (mongoose.models.User as Model<User> | undefined) ?? mongoose.model<User>("User", userSchema);

export default UserModel;
