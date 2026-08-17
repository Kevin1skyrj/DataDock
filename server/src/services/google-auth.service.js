import { randomBytes } from "node:crypto";

import {
  GOOGLE_CLIENT_ID,
  GOOGLE_OAUTH_SCOPES,
  googleOAuthClient,
} from "../config/google-oauth.js";
import { AppError } from "../errors/app-error.js";
import {
  connectGoogleAccount,
  findUserByEmail,
  findUserByGoogleId,
  insertGoogleUser,
} from "../models/user.model.js";
import { createSession } from "./session.service.js";

export async function createGoogleAuthorizationRequest() {
  const state = randomBytes(32).toString("hex");

  const { codeVerifier, codeChallenge } =
    await googleOAuthClient.generateCodeVerifierAsync();

  const authorizationUrl = googleOAuthClient.generateAuthUrl({
    scope: GOOGLE_OAUTH_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });

  return {
    authorizationUrl,
    state,
    codeVerifier,
  };
}

export async function getGoogleIdentity({ code, codeVerifier }) {
  try {
    const { tokens } = await googleOAuthClient.getToken({
      code,
      codeVerifier,
    });

    if (!tokens.id_token) {
      throw new AppError("Google did not return an identity token", {
        statusCode: 401,
        code: "google-identity-missing",
      });
    }

    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new AppError("Google account identity could not be verified", {
        statusCode: 401,
        code: "google-identity-invalid",
      });
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name?.trim() || payload.email.split("@")[0],
      avatarUrl: payload.picture ?? null,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Google authentication failed", {
      statusCode: 401,
      code: "google-authentication-failed",
    });
  }
}

async function findOrCreateGoogleUser(identity) {
  let user = await findUserByGoogleId(identity.googleId);

  if (user) {
    if (user.deletedAt) {
      throw new AppError("This DataDock account is unavailable", {
        statusCode: 403,
        code: "account-disabled",
      });
    }

    return user;
  }

  user = await findUserByEmail(identity.email);

  if (user) {
    if (user.deletedAt) {
      throw new AppError("This DataDock account is unavailable", {
        statusCode: 403,
        code: "account-disabled",
      });
    }

    if (user.googleId && user.googleId !== identity.googleId) {
      throw new AppError("This email is connected to another Google account", {
        statusCode: 409,
        code: "google-account-conflict",
      });
    }

    const connectedUser = await connectGoogleAccount({
      userId: user._id,
      googleId: identity.googleId,
      avatarUrl: identity.avatarUrl,
    });

    if (connectedUser) {
      return connectedUser;
    }
  }

  try {
    return await insertGoogleUser(identity);
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }

    const existingUser =
      (await findUserByGoogleId(identity.googleId)) ??
      (await findUserByEmail(identity.email));

    if (
      existingUser?.googleId === identity.googleId &&
      !existingUser.deletedAt
    ) {
      return existingUser;
    }

    throw new AppError("This Google account cannot be connected", {
      statusCode: 409,
      code: "google-account-conflict",
    });
  }
}

export async function loginWithGoogle(identity) {
  const user = await findOrCreateGoogleUser(identity);
  const session = await createSession(user._id);

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      role: user.role ?? "user",
    },
    session,
  };
}
