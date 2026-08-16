import { saveOtp } from "../models/otp.model.js";
import { generateOtp, hashOtp } from "../utils/otp.js";
import { sendVerificationOtpEmail } from "./email.service.js";

export const EMAIL_VERIFICATION_PURPOSE = "email-verification";

const OTP_DURATION_MS = 10 * 60 * 1000;
const OTP_ATTEMPTS = 5;

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
