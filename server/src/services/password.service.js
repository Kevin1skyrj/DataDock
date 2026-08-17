import bcrypt from "bcrypt";

import { AppError } from "../errors/app-error.js";
import {
  claimPasswordReset,
  savePasswordReset,
} from "../models/password-reset.model.js";
import {
  findUserByEmail,
  findUserById,
  updateUserPassword,
} from "../models/user.model.js";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "../utils/password-reset-token.js";
import {
  validatePasswordChangeInput,
  validatePasswordResetInput,
} from "../validators/auth.validator.js";
import {
  deleteAllUserSessions,
  deleteOtherUserSessions,
} from "./session.service.js";

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_DURATION_MS = 10 * 60 * 1000;

export async function createPasswordResetAuthorization(userId) {
  const token = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);

  await savePasswordReset({
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + RESET_TOKEN_DURATION_MS),
  });

  return token;
}

export async function resetPassword(input) {
  const { email, token, password } = validatePasswordResetInput(input);
  const user = await findUserByEmail(email);

  if (!user || user.deletedAt) {
    throw invalidReset();
  }

  const reset = await claimPasswordReset({
    userId: user._id,
    tokenHash: hashPasswordResetToken(token),
  });

  if (!reset) {
    throw invalidReset();
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await updateUserPassword({ userId: user._id, passwordHash });
  await deleteAllUserSessions(user._id);

  return { reset: true };
}

export async function changePassword({ userId, sessionId, input }) {
  const { currentPassword, newPassword } = validatePasswordChangeInput(input);
  const user = await findUserById(userId);

  const matches = user?.passwordHash
    ? await bcrypt.compare(currentPassword, user.passwordHash)
    : false;

  if (!matches) {
    throw new AppError("Current password is incorrect", {
      statusCode: 401,
      code: "current-password-incorrect",
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await updateUserPassword({ userId, passwordHash });
  await deleteOtherUserSessions({ userId, sessionId });

  return { changed: true };
}

function invalidReset() {
  return new AppError("This password reset request is invalid or expired", {
    statusCode: 400,
    code: "password-reset-invalid",
  });
}
