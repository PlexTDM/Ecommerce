import { z } from "zod";

export const settingsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Username must be at least 2 characters")
    .max(50, "Username must be at most 50 characters"),
  email: z.string().trim().min(1, "Email is required").email("Please enter a valid email address"),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(6, "Password must be at least 6 characters")
      .max(128, "Password must be at most 128 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordFormData = z.infer<typeof passwordSchema>;

export const addressSchema = z.object({
  street: z.string().trim().min(1, "Street address is required"),
  apt: z.string().trim().optional(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State/region is required"),
  zip: z.string().trim().min(1, "ZIP/postal code is required"),
  country: z.string().trim().min(1, "Country is required"),
});

export type AddressFormData = z.infer<typeof addressSchema>;
