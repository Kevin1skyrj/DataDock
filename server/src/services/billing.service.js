
import { getPlan, PLANS } from "../config/plan.js";
import {
  razorpayClient,
  razorpayKeyId,
} from "../config/razorpay.js";
import { AppError } from "../errors/app-error.js";
import {
  findLatestSubscriptionByUserId,
  findSubscriptionByRazorpayId,
  insertSubscription,
  updateSubscription,
} from "../models/subscription.model.js";
import { verifySubscriptionSignature } from "../utils/razorpay-signature.js";

const OPEN_SUBSCRIPTION_STATUSES = new Set([
  "created",
  "authenticated",
  "active",
  "pending",
  "halted",
  "paused",
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

async function resolveBilling(userId) {
  const subscription = await findLatestSubscriptionByUserId(userId);
  const paidPlan = subscription ? getPlan(subscription.planId) : null;

  return {
    plan: hasPaidAccess(subscription) && paidPlan ? paidPlan : PLANS.free,
    subscription,
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
  const { plan, subscription } = await resolveBilling(userId);

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

  const existingSubscription =
    await findLatestSubscriptionByUserId(userId);

  if (
    existingSubscription &&
    OPEN_SUBSCRIPTION_STATUSES.has(existingSubscription.status)
  ) {
    throw new AppError("You already have an active subscription", {
      statusCode: 409,
      code: "subscription-exists",
    });
  }

  const razorpaySubscription =
    await razorpayClient.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      total_count: 120,
      quantity: 1,
      customer_notify: true,
      notes: {
        userId: userId.toString(),
        planId: plan.id,
      },
    });

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

  const razorpaySubscription =
    await razorpayClient.subscriptions.fetch(subscriptionId);

  if (
    razorpaySubscription.plan_id !==
    subscription.razorpayPlanId
  ) {
    throw new AppError("Subscription plan does not match", {
      statusCode: 409,
      code: "subscription-plan-mismatch",
    });
  }

  const updatedSubscription = await updateSubscription({
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

  return {
    planId: updatedSubscription.planId,
    status: updatedSubscription.status,
    currentPeriodStart: updatedSubscription.currentPeriodStart,
    currentPeriodEnd: updatedSubscription.currentPeriodEnd,
  };
}
