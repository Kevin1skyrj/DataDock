
import { getPlan, PLANS } from "../config/plan.js";
import {
  razorpayClient,
  razorpayKeyId,
} from "../config/razorpay.js";
import { AppError } from "../errors/app-error.js";
import {
  claimWebhookEvent,
  findActiveSubscriptionByUserId,
  findLatestSubscriptionByUserId,
  findOpenSubscriptionByUserId,
  findSubscriptionByRazorpayId,
  insertSubscription,
  releaseWebhookEvent,
  updateSubscription,
} from "../models/subscription.model.js";
import {
  verifySubscriptionSignature,
  verifyWebhookSignature,
} from "../utils/razorpay-signature.js";

const OPEN_SUBSCRIPTION_STATUSES = new Set([
  "authenticated",
  "active",
  "pending",
  "halted",
  "paused",
]);
const PENDING_SYNC_STATUSES = new Set([
  "created",
  "authenticated",
  "pending",
]);

function fromRazorpayTimestamp(value) {
  return Number.isInteger(value)
    ? new Date(value * 1000)
    : null;
}

function toPublicPlan({ razorpayPlanId, ...plan }) {
  return plan;
}

function hasPaidAccess(subscription) {
  return (
    subscription?.status === "active" &&
    subscription.currentPeriodEnd instanceof Date &&
    subscription.currentPeriodEnd > new Date()
  );
}

async function syncSubscription(subscription) {
  const razorpaySubscription =
    await razorpayClient.subscriptions.fetch(
      subscription.razorpaySubscriptionId,
    );

  if (razorpaySubscription.plan_id !== subscription.razorpayPlanId) {
    throw new AppError("Subscription plan does not match", {
      statusCode: 409,
      code: "subscription-plan-mismatch",
    });
  }

  return updateSubscription({
    razorpaySubscriptionId: subscription.razorpaySubscriptionId,
    changes: {
      status: razorpaySubscription.status,
      currentPeriodStart: fromRazorpayTimestamp(
        razorpaySubscription.current_start,
      ),
      currentPeriodEnd: fromRazorpayTimestamp(
        razorpaySubscription.current_end,
      ),
    },
  });
}

async function resolveBilling(userId) {
  const [activeSubscription, latestSubscription] = await Promise.all([
    findActiveSubscriptionByUserId(userId),
    findLatestSubscriptionByUserId(userId),
  ]);
  const paidPlan = activeSubscription
    ? getPlan(activeSubscription.planId)
    : null;

  return {
    plan:
      hasPaidAccess(activeSubscription) && paidPlan
        ? paidPlan
        : PLANS.free,
    subscription: activeSubscription ?? latestSubscription,
  };
}

export function listPlans() {
  return Object.values(PLANS).map(toPublicPlan);
}

export async function getEffectivePlan(userId) {
  const { plan } = await resolveBilling(userId);
  return plan;
}

export async function getCurrentBilling(userId) {
  let resolved = await resolveBilling(userId);

  if (PENDING_SYNC_STATUSES.has(resolved.subscription?.status)) {
    await syncSubscription(resolved.subscription);
    resolved = await resolveBilling(userId);
  }

  const { plan, subscription } = resolved;

  return {
    plan: toPublicPlan(plan),
    subscription: subscription
      ? {
          id: subscription._id.toHexString(),
          planId: subscription.planId,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        }
      : null,
  };
}

export async function createSubscription({ userId, planId }) {
  const plan = getPlan(planId);

  if (!plan || plan.id === "free") {
    throw new AppError("Select a valid paid plan", {
      statusCode: 400,
      code: "invalid-plan",
    });
  }

  const existingSubscription = await findOpenSubscriptionByUserId(
    userId,
    [...OPEN_SUBSCRIPTION_STATUSES],
  );

  if (
    existingSubscription &&
    OPEN_SUBSCRIPTION_STATUSES.has(existingSubscription.status)
  ) {
    throw new AppError("You already have an active subscription", {
      statusCode: 409,
      code: "subscription-exists",
    });
  }

  let razorpaySubscription;
  try {
    razorpaySubscription = await razorpayClient.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      total_count: 120,
      quantity: 1,
      customer_notify: true,
      notes: {
        userId: userId.toString(),
        planId: plan.id,
      },
    });
  } catch (error) {
    throw new AppError(
      error.error?.description ??
        error.description ??
        "Razorpay could not create the subscription",
      {
        statusCode: error.statusCode ?? 502,
        code: "razorpay-subscription-failed",
      },
    );
  }

  await insertSubscription({
    userId,
    planId: plan.id,
    razorpayPlanId: plan.razorpayPlanId,
    razorpaySubscriptionId: razorpaySubscription.id,
    status: razorpaySubscription.status,
  });

  return {
    keyId: razorpayKeyId,
    subscriptionId: razorpaySubscription.id,
    plan: {
      id: plan.id,
      name: plan.name,
      pricePaise: plan.pricePaise,
      currency: plan.currency,
    },
  };
}

export async function verifySubscription({
  userId,
  paymentId,
  subscriptionId,
  signature,
}) {
  const subscription =
    await findSubscriptionByRazorpayId(subscriptionId);

  if (
    !subscription ||
    !subscription.userId.equals(userId)
  ) {
    throw new AppError("Subscription was not found", {
      statusCode: 404,
      code: "subscription-not-found",
    });
  }

  const signatureIsValid = verifySubscriptionSignature({
    paymentId,
    subscriptionId,
    signature,
  });

  if (!signatureIsValid) {
    throw new AppError("Payment verification failed", {
      statusCode: 400,
      code: "invalid-payment-signature",
    });
  }

  const updatedSubscription = await syncSubscription(subscription);

  return {
    planId: updatedSubscription.planId,
    status: updatedSubscription.status,
    currentPeriodStart: updatedSubscription.currentPeriodStart,
    currentPeriodEnd: updatedSubscription.currentPeriodEnd,
  };
}

export async function processWebhook({ rawBody, signature, eventId }) {
  if (!verifyWebhookSignature({ rawBody, signature })) {
    throw new AppError("Webhook signature is invalid", {
      statusCode: 400,
      code: "invalid-webhook-signature",
    });
  }

  if (typeof eventId !== "string" || !eventId) {
    throw new AppError("Webhook event ID is missing", {
      statusCode: 400,
      code: "missing-webhook-event-id",
    });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw new AppError("Webhook payload is invalid", {
      statusCode: 400,
      code: "invalid-webhook-payload",
    });
  }

  const claimed = await claimWebhookEvent(eventId);
  if (!claimed) return { duplicate: true };

  try {
    if (!payload.event?.startsWith("subscription.")) {
      return { ignored: true };
    }

    const subscriptionId = payload.payload?.subscription?.entity?.id;
    if (typeof subscriptionId !== "string") {
      throw new AppError("Webhook subscription is missing", {
        statusCode: 400,
        code: "missing-webhook-subscription",
      });
    }

    const subscription = await findSubscriptionByRazorpayId(subscriptionId);
    if (!subscription) return { ignored: true };

    const razorpaySubscription =
      await razorpayClient.subscriptions.fetch(subscriptionId);

    if (razorpaySubscription.plan_id !== subscription.razorpayPlanId) {
      throw new AppError("Webhook subscription plan does not match", {
        statusCode: 409,
        code: "subscription-plan-mismatch",
      });
    }

    await updateSubscription({
      razorpaySubscriptionId: subscriptionId,
      changes: {
        status: razorpaySubscription.status,
        currentPeriodStart: fromRazorpayTimestamp(
          razorpaySubscription.current_start,
        ),
        currentPeriodEnd: fromRazorpayTimestamp(
          razorpaySubscription.current_end,
        ),
      },
    });

    return { processed: true };
  } catch (error) {
    await releaseWebhookEvent(eventId);
    throw error;
  }
}
