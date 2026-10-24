import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface RefreshToken {
  tokenHash: string;
  expiresAt: Date;
  userId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const refreshTokenSchema = new Schema<RefreshToken>(
  {
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

const RefreshTokenModel: Model<RefreshToken> =
  (mongoose.models.RefreshToken as Model<RefreshToken> | undefined) ??
  mongoose.model<RefreshToken>("RefreshToken", refreshTokenSchema);

export default RefreshTokenModel;
