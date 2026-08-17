import { AppError } from "../errors/app-error.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistrationInput({ name, email, password } = {}) {
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (normalizedName.length < 2 || normalizedName.length > 60) {
    throw new AppError("Name must contain between 2 and 60 characters", {
      statusCode: 400,
      code: "invalid-name",
    });
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new AppError("Enter a valid email address", {
      statusCode: 400,
      code: "invalid-email",
    });
  }

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new AppError("Password must contain between 8 and 72 bytes", {
      statusCode: 400,
      code: "invalid-password",
    });
  }

  return {
    name: normalizedName,
    email: normalizedEmail,
    password,
  };
}

export function validateLoginInput({ email, password } = {}) {
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new AppError("Enter a valid email address", {
      statusCode: 400,
      code: "invalid-email",
    });
  }

  if (typeof password !== "string" || password.length === 0) {
    throw new AppError("Enter your password", {
      statusCode: 400,
      code: "invalid-password",
    });
  }

  return {
    email: normalizedEmail,
    password,
  };
}

export function validateEmailVerificationInput({ email, code } = {}) {
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new AppError("Enter a valid email address", {
      statusCode: 400,
      code: "invalid-email",
    });
  }

  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    throw new AppError("Enter a valid six-digit verification code", {
      statusCode: 400,
      code: "invalid-otp",
    });
  }

  return {
    email: normalizedEmail,
    code,
  };
}

export function validateEmailInput({ email } = {}) {
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new AppError("Enter a valid email address", {
      statusCode: 400,
      code: "invalid-email",
    });
  }

  return {
    email: normalizedEmail,
  };
}