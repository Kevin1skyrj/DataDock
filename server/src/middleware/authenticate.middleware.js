import { SESSION_COOKIE_NAME } from "../config/session.js";
import { AppError } from "../errors/app-error.js";
import { findActiveSessionByTokenHash } from "../models/session.model.js";
import { findUserById } from "../models/user.model.js";
import { hashSessionToken } from "../utils/session-token.js";

function authenticationRequired() {
  return new AppError("Authentication is required", {
    statusCode: 401,
    code: "authentication-required",
  });
}

export async function authenticate(req, res, next) {
  try {
    const token = req.signedCookies?.[SESSION_COOKIE_NAME];

    if (typeof token !== "string" || !token) {
      throw authenticationRequired();
    }

    const tokenHash = hashSessionToken(token);
    const session = await findActiveSessionByTokenHash(tokenHash);

    if (!session) {
      throw authenticationRequired();
    }

    const user = await findUserById(session.userId);

    if (!user) {
      throw authenticationRequired();
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    req.auth = {
      sessionId: session._id,
      expiresAt: session.expiresAt,
    };

    next();
  } catch (error) {
    next(error);
  }
}