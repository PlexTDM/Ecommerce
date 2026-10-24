import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface Address {
  id: string;
  street: string;
  apt?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Profile {
  bio: string;
  userId: Types.ObjectId;
  addresses: Address[];
  createdAt?: Date;
  updatedAt?: Date;
}

const addressSchema = new Schema<Address>(
  {
    id: { type: String, required: true },
    street: { type: String, required: true },
    apt: { type: String, required: false },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const profileSchema = new Schema<Profile>(
  {
    bio: { type: String, required: true, default: "" },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    addresses: { type: [addressSchema], required: true, default: [] },
  },
  { timestamps: true },
);

const ProfileModel: Model<Profile> =
  (mongoose.models.Profile as Model<Profile> | undefined) ??
  mongoose.model<Profile>("Profile", profileSchema);

export default ProfileModel;
