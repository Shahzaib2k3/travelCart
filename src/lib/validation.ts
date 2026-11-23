import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password needs a lowercase letter")
  .regex(/[A-Z]/, "Password needs an uppercase letter")
  .regex(/[0-9]/, "Password needs a number");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address");

export const createUserSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(["ADMIN", "AGENT"]),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  email: emailSchema.optional(),
  role: z.enum(["ADMIN", "AGENT"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });