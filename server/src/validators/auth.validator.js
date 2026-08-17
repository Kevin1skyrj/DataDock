import { AppError } from "../errors/app-error.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateNewPassword(password, code = "invalid-password") {
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new AppError("Password must contain between 8 and 72 bytes", {
      statusCode: 400,
      code,
    });
  }

  return password;
}

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

  validateNewPassword(password);

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

export function validatePasswordResetInput({ email, token, password } = {}) {
  const { email: normalizedEmail } = validateEmailInput({ email });

  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new AppError("This password reset request is invalid or expired", {
      statusCode: 400,
      code: "password-reset-invalid",
    });
  }

  validateNewPassword(password);

  return {
    email: normalizedEmail,
    token,
    password,
  };
}

export function validatePasswordChangeInput({
  currentPassword,
  newPassword,
} = {}) {
  if (typeof currentPassword !== "string" || currentPassword.length === 0) {
    throw new AppError("Enter your current password", {
      statusCode: 400,
      code: "invalid-current-password",
    });
  }

  validateNewPassword(newPassword, "invalid-new-password");

  if (currentPassword === newPassword) {
    throw new AppError("Choose a password different from your current password", {
      statusCode: 400,
      code: "password-unchanged",
    });
  }

  return { currentPassword, newPassword };
}
