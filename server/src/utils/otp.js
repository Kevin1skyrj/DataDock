import {
  createHmac,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

export function generateOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp({ userId, purpose, code }) {
  const otpSecret = process.env.OTP_SECRET;

  if (!otpSecret) {
    throw new Error("OTP_SECRET is missing from environment variables");
  }

  return createHmac("sha256", otpSecret)
    .update(`${userId.toString()}:${purpose}:${code}`)
    .digest("hex");
}

export function verifyOtpHash({ userId, purpose, code, codeHash }) {
  const receivedHash = hashOtp({
    userId,
    purpose,
    code,
  });

  const receivedBuffer = Buffer.from(receivedHash, "hex");
  const storedBuffer = Buffer.from(codeHash, "hex");

  return (
    receivedBuffer.length === storedBuffer.length &&
    timingSafeEqual(receivedBuffer, storedBuffer)
  );
}