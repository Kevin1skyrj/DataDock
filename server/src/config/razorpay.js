import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

if (!keyId || !keySecret) {
  throw new Error("Razorpay credentials are missing");
}

if (!webhookSecret) {
  throw new Error("RAZORPAY_WEBHOOK_SECRET is missing");
}

export const razorpayKeyId = keyId;
export const razorpayWebhookSecret = webhookSecret;

export const razorpayClient = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});
