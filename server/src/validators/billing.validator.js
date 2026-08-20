import { z } from "zod";

export const createSubscriptionSchema = z
  .object({
    planId: z.enum(["pro", "premium"], {
      error: "Select a valid paid plan",
    }),
  })
  .strict();

export const verifySubscriptionSchema = z
  .object({
    paymentId: z
      .string({ error: "Payment ID is invalid" })
      .regex(/^pay_[A-Za-z0-9]+$/, "Payment ID is invalid"),
    subscriptionId: z
      .string({ error: "Subscription ID is invalid" })
      .regex(/^sub_[A-Za-z0-9]+$/, "Subscription ID is invalid"),
    signature: z
      .string({ error: "Payment signature is invalid" })
      .regex(/^[a-f0-9]{64}$/i, "Payment signature is invalid"),
  })
  .strict();
