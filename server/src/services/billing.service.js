
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

/** A subscription in any of these states is one the user still holds. */
const OPEN_SUBSCRIPTION_STATUSES = Object.freeze([
  "authenticated",
  "active",
  "pending",
  "halted",
  "paused",
]);
const PENDING_SYNC_STATUSES = Object.freeze([
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

function toPublicSubscription(subscription) {
  return {
    id: subscription._id.toHexString(),
    planId: subscription.planId,
    status: subscription.status,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    endedAt: subscription.endedAt ?? null,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd === true,
  };
}

function hasPaidAccess(subscription) {
  return (
    subscription?.status === "active" &&
    subscription.currentPeriodEnd instanceof Date &&
    subscription.currentPeriodEnd > new Date()
  );
}

function assertPlanMatches(razorpaySubscription, subscription) {
  if (razorpaySubscription.plan_id !== subscription.razorpayPlanId) {
    throw new AppError("Subscription plan does not match", {
      statusCode: 409,
      code: "subscription-plan-mismatch",
    });
  }
}

/**
 * Razorpay has no "cancelling" status. A subscription cancelled at cycle end
 * stays `active` until the cycle actually ends, and the entity carries no flag
 * saying a cancellation is pending — what it does carry is `end_at`, pulled
 * back to the end of the current cycle. So a subscription that ends when its
 * period ends is one that has been cancelled, wherever the cancellation was
 * asked for. Any non-active status means it is no longer pending: it happened.
 */
function resolveCancelAtPeriodEnd(razorpaySubscription, stored) {
  if (razorpaySubscription.status !== "active") return false;

  if (
    Number.isInteger(razorpaySubscription.end_at) &&
    Number.isInteger(razorpaySubscription.current_end)
  ) {
    return razorpaySubscription.end_at <= razorpaySubscription.current_end;
  }

  return stored === true;
}

function toSubscriptionChanges(razorpaySubscription, subscription) {
  return {
    status: razorpaySubscription.status,
    currentPeriodStart: fromRazorpayTimestamp(
      razorpaySubscription.current_start,
    ),
    currentPeriodEnd: fromRazorpayTimestamp(
      razorpaySubscription.current_end,
    ),
    endedAt: fromRazorpayTimestamp(razorpaySubscription.ended_at),
    cancelAtPeriodEnd: resolveCancelAtPeriodEnd(
      razorpaySubscription,
      subscription.cancelAtPeriodEnd,
    ),
  };
}

async function syncSubscription(subscription) {
  const razorpaySubscription =
    await razorpayClient.subscriptions.fetch(
      subscription.razorpaySubscriptionId,
    );

  assertPlanMatches(razorpaySubscription, subscription);

  return updateSubscription({
    razorpaySubscriptionId: subscription.razorpaySubscriptionId,
    changes: toSubscriptionChanges(razorpaySubscription, subscription),
  });
}

function needsSync(subscription) {
  if (!subscription) return false;
  if (PENDING_SYNC_STATUSES.includes(subscription.status)) return true;

  // A plan cancelled at cycle end only turns into `cancelled` when Razorpay
  // says so. If that webhook is late or never arrives, the stale `active` row
  // would block a new plan forever — so re-read it once the period it paid
  // for has lapsed.
  return (
    subscription.status === "active" &&
    subscription.currentPeriodEnd instanceof Date &&
    subscription.currentPeriodEnd <= new Date()
  );
}

/**
 * The subscription the user still holds, if any — the single gate every
 * "can they subscribe / can they cancel" decision goes through, so those two
 * questions can never disagree.
 */
async function findOpenSubscription(userId) {
  const subscription = await findOpenSubscriptionByUserId(
    userId,
    OPEN_SUBSCRIPTION_STATUSES,
  );

  if (!subscription || !needsSync(subscription)) return subscription;

  const synced = await syncSubscription(subscription);
  return OPEN_SUBSCRIPTION_STATUSES.includes(synced.status) ? synced : null;
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

  if (needsSync(resolved.subscription)) {
    await syncSubscription(resolved.subscription);
    resolved = await resolveBilling(userId);
  }

  const { plan, subscription } = resolved;
  const held =
    subscription && OPEN_SUBSCRIPTION_STATUSES.includes(subscription.status);

  return {
    plan: toPublicPlan(plan),
    // Decided here rather than in the browser, so the page never offers a plan
    // the API is about to refuse. One subscription at a time: a new one can
    // only be started once the one being held has actually finished.
    canChangePlan: !held,
    subscription: subscription ? toPublicSubscription(subscription) : null,
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

  const existingSubscription = await findOpenSubscription(userId);

  if (existingSubscription) {
    throw new AppError(
      existingSubscription.cancelAtPeriodEnd
        ? "Your plan is scheduled to end. You can choose a new plan once it does."
        : "You already have an active subscription",
      {
        statusCode: 409,
        code: "subscription-exists",
      },
    );
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

/**
 * Cancels at the end of the paid period, not now.
 *
 * The money for the current cycle has already been taken, so the storage it
 * bought stays available until that cycle runs out — `hasPaidAccess` keeps
 * returning true because the subscription is still `active`, and Razorpay
 * flips it to `cancelled` when the period ends.
 */
export async function cancelSubscription(userId) {
  const subscription = await findOpenSubscription(userId);

  if (!subscription) {
    throw new AppError("There is no subscription to cancel", {
      statusCode: 404,
      code: "subscription-not-found",
    });
  }

  if (subscription.cancelAtPeriodEnd) {
    throw new AppError("This plan is already scheduled to end", {
      statusCode: 409,
      code: "subscription-already-cancelling",
    });
  }

  // At cycle end only where there is a paid cycle left to honour. A
  // subscription that was never charged has nothing to protect, and Razorpay
  // rejects `cancel_at_cycle_end` outside the active state anyway.
  const atCycleEnd = subscription.status === "active";

  let razorpaySubscription;
  try {
    razorpaySubscription = await razorpayClient.subscriptions.cancel(
      subscription.razorpaySubscriptionId,
      atCycleEnd,
    );
  } catch (error) {
    throw new AppError(
      error.error?.description ??
        error.description ??
        "Razorpay could not cancel the subscription",
      {
        statusCode: error.statusCode ?? 502,
        code: "razorpay-cancel-failed",
      },
    );
  }

  const updatedSubscription = await updateSubscription({
    razorpaySubscriptionId: subscription.razorpaySubscriptionId,
    changes: {
      ...toSubscriptionChanges(razorpaySubscription, subscription),
      // Recorded from what was asked for rather than inferred from `end_at`,
      // which Razorpay does not always return on the cancel call itself.
      cancelAtPeriodEnd:
        atCycleEnd && razorpaySubscription.status === "active",
    },
  });

  return toPublicSubscription(updatedSubscription);
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

    // The entity is re-read rather than trusted from the payload, so every
    // `subscription.*` event — charged, cancelled, completed, halted, paused —
    // lands the same set of fields and no event kind needs its own branch.
    // A cancellation therefore synchronises itself: `subscription.cancelled`
    // clears `cancelAtPeriodEnd` and writes `endedAt` without special casing.
    const razorpaySubscription =
      await razorpayClient.subscriptions.fetch(subscriptionId);

    assertPlanMatches(razorpaySubscription, subscription);

    await updateSubscription({
      razorpaySubscriptionId: subscriptionId,
      changes: toSubscriptionChanges(razorpaySubscription, subscription),
    });

    return { processed: true };
  } catch (error) {
    await releaseWebhookEvent(eventId);
    throw error;
  }
}
