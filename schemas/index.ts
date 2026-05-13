import * as z from "zod";

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(8, {
    message: "Minimum 8 characters required",
  }),
  firstName: z.string().min(1, {
    message: "First name is required",
  }),
  lastName: z.string().min(1, {
    message: "Last name is required",
  }),
});

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const NewPasswordSchema = z.object({
  password: z.string().min(8, {
    message: "Minimum 8 characters required",
  }),
});

export const SetupAdminSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  password: z.string().min(8, { message: "Minimum 8 characters required" }),
  setupSecret: z.string().optional(),
});

export const InviteSchema = z.object({
  email: z
    .string()
    .email({ message: "Enter a valid email" })
    .optional()
    .or(z.literal("")),
  role: z.enum(["ADMIN", "INSTRUCTOR"], {
    message: "Role must be Admin or Instructor",
  }),
});
export const SettingsSchema = z.object({
  firstName: z.optional(z.string()),
  lastName: z.optional(z.string()),
  bio: z.optional(z.string()),
  headline: z.optional(z.string()),
  location: z.optional(z.string()),
  image: z.optional(z.string()),
  socials: z.array(z.object({
    platform: z.string(),
    url: z.string().url({ message: "Must be a valid URL" }).or(z.literal(''))
  })).optional(),
});
