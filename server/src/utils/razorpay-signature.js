import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { razorpayWebhookSecret } from "../config/razorpay.js";

const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keySecret) {
  throw new Error("Razorpay key secret is missing");
}

function signaturesMatch(expectedSignature, receivedSignature) {
  if (typeof receivedSignature !== "string") return false;

  const receivedBuffer = Buffer.from(receivedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
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

  return signaturesMatch(expectedSignature, signature);
}

export function verifyWebhookSignature({ rawBody, signature }) {
  if (!Buffer.isBuffer(rawBody)) return false;

  const expectedSignature = createHmac("sha256", razorpayWebhookSecret)
    .update(rawBody)
    .digest("hex");

  return signaturesMatch(expectedSignature, signature);
}
