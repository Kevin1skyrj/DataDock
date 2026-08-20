import bcrypt from "bcrypt";

import { AppError } from "../errors/app-error.js";
import { findUserByEmail, insertUser } from "../models/user.model.js";
import { createSession } from "./session.service.js";
import { sendEmailVerificationOtp } from "./otp.service.js";
const BCRYPT_ROUNDS = 12;

export async function registerUser(input) {
  const { name, email, password } = input;

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

  await sendEmailVerificationOtp({
    userId: user._id,
    email: user.email,
  });

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    verified: user.emailVerifiedAt !== null,
  };
}

export async function loginUser(input) {
  const { email, password } = input;

  const user = await findUserByEmail(email);

  const passwordMatches = user?.passwordHash && !user.deletedAt
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!passwordMatches) {
    throw new AppError("Email or password is incorrect", {
      statusCode: 401,
      code: "invalid-credentials",
    });
  }

  if (!user.emailVerifiedAt) {
    throw new AppError("Verify your email before signing in", {
      statusCode: 403,
      code: "unverified",
    });
  }

  const session = await createSession(user._id);

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role ?? "user",
    },
    session,
  };
}
