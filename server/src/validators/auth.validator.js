import { z } from "zod";

const email = z
  .string({ error: "Enter a valid email address" })
  .trim()
  .toLowerCase()
  .email("Enter a valid email address");

const password = z
  .string({ error: "Enter your password" })
  .min(8, "Password must contain between 8 and 72 bytes")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
    message: "Password must contain between 8 and 72 bytes",
  });

const currentPassword = z
  .string({ error: "Enter your current password" })
  .min(1, "Enter your current password")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
    message: "Enter a valid current password",
  });

const otpCode = z
  .string({ error: "Enter a valid six-digit verification code" })
  .regex(/^\d{6}$/, "Enter a valid six-digit verification code");

export const registrationSchema = z
  .object({
    name: z
      .string({ error: "Name must contain between 2 and 60 characters" })
      .trim()
      .min(2, "Name must contain between 2 and 60 characters")
      .max(60, "Name must contain between 2 and 60 characters"),
    email,
    password,
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password: z
      .string({ error: "Enter your password" })
      .min(1, "Enter your password")
      .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
        message: "Enter a valid password",
      }),
  })
  .strict();

export const emailVerificationSchema = z
  .object({ email, code: otpCode })
  .strict();

export const emailSchema = z.object({ email }).strict();

export const passwordResetSchema = z
  .object({
    email,
    token: z
      .string({ error: "This password reset request is invalid or expired" })
      .regex(
        /^[A-Za-z0-9_-]{43}$/,
        "This password reset request is invalid or expired",
      ),
    password,
  })
  .strict();

export const passwordChangeSchema = z
  .object({
    currentPassword,
    newPassword: password,
  })
  .strict()
  .refine((input) => input.currentPassword !== input.newPassword, {
    message: "Choose a password different from your current password",
    path: ["newPassword"],
  });
