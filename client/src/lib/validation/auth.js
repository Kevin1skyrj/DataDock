import { z } from "zod";

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

export const emailRule = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("That doesn't look like an email address.");

/**
 * Deliberately only checks for presence. Login validates against what is
 * stored, not against today's password policy — telling someone their existing
 * password is too short is both useless and a hint they never asked for.
 */
export const currentPasswordRule = z.string().min(1, "Enter your password.");

export const loginSchema = z.object({
  email: emailRule,
  password: currentPasswordRule,
});
