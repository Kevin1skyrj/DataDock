import { z } from "zod";

import { OTP_LENGTH } from "@/constants/auth";

/**
 * Validation for the authentication forms.
 *
 * The individual rules are exported alongside the schemas because the same
 * field appears on several screens — an email on login, register and forgot
 * password; a new password on register and reset — and the *message* is part of
 * the design. Composing schemas from shared rules is what keeps a visitor from
 * being told "Enter a valid email address." on one screen and something subtly
 * different on the next.
 *
 * Messages are written as instructions rather than accusations: "Enter your
 * password", not "Password is required". The field already says what it is.
 */

// Trim first, then hand the trimmed value to the format check — `.email()` on a
// string is deprecated in Zod 4, and piping keeps "you left it blank" and "that
// isn't an address" as two separate messages rather than one generic one.
export const emailRule = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .pipe(z.email("That doesn't look like an email address."));

/**
 * Deliberately only checks for presence. Login validates against what is
 * stored, not against today's password policy — telling someone their existing
 * password is too short is both useless and a hint they never asked for.
 */
export const currentPasswordRule = z.string().min(1, "Enter your password.");

export const nameRule = z
  .string()
  .trim()
  .min(2, "Enter your name.")
  .max(60, "That name is longer than we can store.");

/**
 * Length, and nothing else.
 *
 * Composition rules — a capital, a digit, a symbol — push people towards
 * `Password1!` and away from the long, memorable passphrases that are actually
 * hard to guess. NIST stopped recommending them years ago. The strength meter
 * beside this field gives the guidance instead, where it can be advisory rather
 * than a gate someone has to defeat.
 *
 * The ceiling is bcrypt's: it silently ignores anything past 72 bytes, and a
 * password whose last characters do not matter is worse than one that was
 * refused outright.
 */
export const newPasswordRule = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Passwords cannot be longer than 72 characters.");

export const loginSchema = z.object({
  email: emailRule,
  password: currentPasswordRule,
});

/**
 * The control only ever emits digits, so the pattern is a backstop rather than
 * a message anyone should see. The length message is the one that does the
 * work: it is what a half-finished code gets told.
 */
export const otpRule = z
  .string()
  .regex(/^\d*$/, "Codes are digits only.")
  .length(OTP_LENGTH, `Enter all ${OTP_LENGTH} digits.`);

export const registerSchema = z.object({
  name: nameRule,
  email: emailRule,
  password: newPasswordRule,
});

export const verifyOtpSchema = z.object({
  code: otpRule,
});

export const forgotPasswordSchema = z.object({
  email: emailRule,
});

export const resetPasswordSchema = z.object({
  password: newPasswordRule,
});
