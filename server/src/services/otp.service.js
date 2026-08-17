import {
  saveOtp,
  claimOtpAttempt,
  deleteOtp,
  findOtp,
} from "../models/otp.model.js";
import { generateOtp, hashOtp, verifyOtpHash } from "../utils/otp.js";
import { sendVerificationOtpEmail } from "./email.service.js";
import { AppError } from "../errors/app-error.js";
import {
  findUserByEmail,
  markUserEmailVerified,
} from "../models/user.model.js";
import {
  validateEmailVerificationInput,
  validateEmailInput,
} from "../validators/auth.validator.js";

export const EMAIL_VERIFICATION_PURPOSE = "email-verification";

const OTP_DURATION_MS = 10 * 60 * 1000;
const OTP_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export async function sendEmailVerificationOtp({ userId, email }) {
  if (!userId) {
    throw new Error("userId is required to create an OTP");
  }

  if (!email) {
    throw new Error("email is required to send an OTP");
  }

  const code = generateOtp();

  const codeHash = hashOtp({
    userId,
    purpose: EMAIL_VERIFICATION_PURPOSE,
    code,
  });

  const expiresAt = new Date(Date.now() + OTP_DURATION_MS);

  await saveOtp({
    userId,
    purpose: EMAIL_VERIFICATION_PURPOSE,
    codeHash,
    expiresAt,
    attemptsRemaining: OTP_ATTEMPTS,
  });

  await sendVerificationOtpEmail({
    to: email,
    code,
  });

  return {
    expiresAt,
  };
}

export async function verifyEmailOtp(input) {
  const { email, code } = validateEmailVerificationInput(input);

  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError("The verification code is invalid or expired", {
      statusCode: 400,
      code: "otp-invalid-or-expired",
    });
  }

  if (user.emailVerifiedAt) {
    throw new AppError("This email address is already verified", {
      statusCode: 409,
      code: "already-verified",
    });
  }

  const otp = await claimOtpAttempt({
    userId: user._id,
    purpose: EMAIL_VERIFICATION_PURPOSE,
  });

  if (!otp) {
    throw new AppError("The verification code is invalid or expired", {
      statusCode: 400,
      code: "otp-invalid-or-expired",
    });
  }

  const matches = verifyOtpHash({
    userId: user._id,
    purpose: EMAIL_VERIFICATION_PURPOSE,
    code,
    codeHash: otp.codeHash,
  });

  if (!matches) {
    throw new AppError("The verification code is incorrect", {
      statusCode: 400,
      code: "otp-invalid",
    });
  }

  const verifiedUser = await markUserEmailVerified(user._id);

  if (!verifiedUser) {
    throw new AppError("This email address is already verified", {
      statusCode: 409,
      code: "already-verified",
    });
  }

  await deleteOtp({
    userId: user._id,
    purpose: EMAIL_VERIFICATION_PURPOSE,
  });

  return {
    id: verifiedUser._id.toString(),
    email: verifiedUser.email,
    verified: true,
  };
}

export async function resendEmailVerificationOtp(input) {
  const { email } = validateEmailInput(input);

  const user = await findUserByEmail(email);

  if (!user || user.emailVerifiedAt) {
    return {
      sentTo: email,
    };
  }

  const existingOtp = await findOtp({
    userId: user._id,
    purpose: EMAIL_VERIFICATION_PURPOSE,
  });

  const cooldownActive =
    existingOtp &&
    Date.now() - existingOtp.createdAt.getTime() <
      OTP_RESEND_COOLDOWN_MS;

  if (cooldownActive) {
    return {
      sentTo: email,
    };
  }

  await sendEmailVerificationOtp({
    userId: user._id,
    email: user.email,
  });

  return {
    sentTo: email,
  };
}
