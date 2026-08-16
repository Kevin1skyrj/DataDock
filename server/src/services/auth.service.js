import bcrypt from "bcrypt";

import { AppError } from "../errors/app-error.js";
import { findUserByEmail, insertUser } from "../models/user.model.js";
import { validateRegistrationInput } from "../validators/auth.validator.js";

const BCRYPT_ROUNDS = 12;

export async function registerUser(input) {
  const { name, email, password } = validateRegistrationInput(input);

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new AppError("An account already uses this email address", {
      statusCode: 409,
      code: "email-taken",
    });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let user;

  try {
    user = await insertUser({
      name,
      email,
      passwordHash,
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppError("An account already uses this email address", {
        statusCode: 409,
        code: "email-taken",
      });
    }

    throw error;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    verified: user.emailVerifiedAt !== null,
  };
}