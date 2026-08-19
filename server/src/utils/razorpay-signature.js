import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keySecret) {
  throw new Error("Razorpay key secret is missing");
}

export function verifySubscriptionSignature({
  paymentId,
  subscriptionId,
  signature,
}) {
  if (
    typeof paymentId !== "string" ||
    typeof subscriptionId !== "string" ||
    typeof signature !== "string"
  ) {
    return false;
  }

  const expectedSignature = createHmac("sha256", keySecret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest("hex");

  const receivedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}