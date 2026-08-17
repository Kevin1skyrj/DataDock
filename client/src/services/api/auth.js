import { ApiError, apiRequest } from "./api-client";

const FIELD_BY_CODE = {
  "invalid-name": "name",
  "invalid-email": "email",
  "invalid-password": "password",
  "email-taken": "email",
  "invalid-current-password": "current",
  "current-password-incorrect": "current",
  "invalid-new-password": "next",
  "password-unchanged": "next",
};

export class AuthError extends Error {
  constructor(message, { code, field = null }) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.field = field;
  }
}

async function authRequest(path, options) {
  try {
    return await apiRequest(path, options);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;

    throw new AuthError(error.message, {
      code: error.code,
      field: FIELD_BY_CODE[error.code] ?? null,
    });
  }
}

export function signUp(details) {
  return authRequest("/auth/register", {
    method: "POST",
    body: details,
  });
}

export function signIn(credentials) {
  return authRequest("/auth/login", {
    method: "POST",
    body: credentials,
  });
}

export function verifyEmailOtp(attempt) {
  return authRequest("/auth/verify-email", {
    method: "POST",
    body: attempt,
  });
}

export function resendEmailOtp(details) {
  return authRequest("/auth/resend-verification", {
    method: "POST",
    body: details,
  });
}

export function requestPasswordReset(details) {
  return authRequest("/auth/forgot-password", {
    method: "POST",
    body: details,
  });
}

export function verifyPasswordResetOtp(attempt) {
  return authRequest("/auth/verify-reset-otp", {
    method: "POST",
    body: attempt,
  });
}

export function resetPassword(details) {
  return authRequest("/auth/reset-password", {
    method: "POST",
    body: details,
  });
}

export function changePassword(details) {
  return authRequest("/auth/change-password", {
    method: "POST",
    body: details,
  });
}

export function getCurrentUser(options) {
  return authRequest("/auth/me", options);
}

export function logout() {
  return authRequest("/auth/logout", { method: "POST" });
}

export function logoutAll() {
  return authRequest("/auth/logout-all", { method: "POST" });
}
