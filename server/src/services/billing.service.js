
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
  findSubscriptionsByUserId,
  findSubscriptionByRazorpayId,
  insertSubscription,
  releaseWebhookEvent,
  updateSubscription,
} from "../models/subscription.model.js";
import { withDistributedLock } from "./redis.service.js";
import {
  verifySubscriptionSignature,
  verifyWebhookSignature,
} from "../utils/razorpay-signature.js";
import {
  hasLegacyPaidAccess,
  hasPaidAccess,
  invoiceCoversPeriod,
  paymentMatchesInvoice,
} from "../utils/billing-entitlement.js";
import { logError } from "../utils/log-error.js";

/** A subscription in any of these states is one the user still holds. */
const OPEN_SUBSCRIPTION_STATUSES = Object.freeze([
  "created",
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

function paymentModeAllowsPaidAccess() {
  return process.env.NODE_ENV !== "production" ||
    razorpayKeyId.startsWith("rzp_live_");
}

function hasPaidEntitlement(subscription) {
  return paymentModeAllowsPaidAccess() &&
    (hasPaidAccess(subscription) || hasLegacyPaidAccess(subscription));
}

function toPublicPlan({ razorpayPlanId, ...plan }) {
  return plan;
}

function toPublicSubscription(subscription) {
  return {
    id: subscription._id.toHexString(),
    planId: subscription.planId,
    // Provider activation can precede a captured plan charge. Do not label
    // an unpaid account Active in the billing UI.
    status: subscription.status === "active" && !hasPaidEntitlement(subscription)
      ? "pending"
      : subscription.status,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    endedAt: subscription.endedAt ?? null,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd === true,
  };
}

function toCheckoutSubscription(subscription, plan) {
  return {
    keyId: razorpayKeyId,
    subscriptionId: subscription.razorpaySubscriptionId,
    plan: {
      id: plan.id,
      name: plan.name,
      pricePaise: plan.pricePaise,
      currency: plan.currency,
    },
  };
}

function assertPlanMatches(razorpaySubscription, subscription) {
  if (razorpaySubscription.plan_id !== subscription.razorpayPlanId) {
    throw new AppError("Subscription plan does not match", {
      statusCode: 409,
      code: "subscription-plan-mismatch",
    });
  }
}

async function findCapturedCyclePayment(razorpaySubscription, subscription) {
  if (razorpaySubscription.status !== "active") return null;

  const plan = getPlan(subscription.planId);
  if (!plan) return null;

  // Razorpay generates invoices for each subscription charge. The checkout
  // callback may only represent mandate authentication, so it is not proof
  // that the monthly plan price was captured.
  for (let skip = 0; skip < 200; skip += 100) {
    const result = await razorpayClient.invoices.all({
      subscription_id: subscription.razorpaySubscriptionId,
      count: 100,
      skip,
    });
    const invoices = result.items ?? [];

    for (const invoice of invoices) {
      if (!invoiceCoversPeriod(invoice, razorpaySubscription, plan)) continue;

      const payment = await razorpayClient.payments.fetch(invoice.payment_id);
      if (paymentMatchesInvoice(payment, invoice, plan)) return payment.id;
    }

    if (invoices.length < 100) break;
  }

  return null;
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

  const verifiedPaymentId = await findCapturedCyclePayment(
    razorpaySubscription,
    subscription,
  );

  return updateSubscription({
    razorpaySubscriptionId: subscription.razorpaySubscriptionId,
    changes: {
      ...toSubscriptionChanges(razorpaySubscription, subscription),
      verifiedPaymentId,
      paidThrough: verifiedPaymentId
        ? fromRazorpayTimestamp(razorpaySubscription.current_end)
        : null,
    },
  });
}

async function reconcileSubscriptionForRead(subscription) {
  try {
    return {
      subscription: await syncSubscription(subscription),
      succeeded: true,
    };
  } catch (error) {
    // Dashboard, storage and billing reads must remain available during a
    // temporary Razorpay outage or while old records are being backfilled.
    // Mutating payment operations still use strict provider synchronization.
    logError("Billing reconciliation deferred", error);
    return { subscription, succeeded: false };
  }
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
  let [activeSubscription, latestSubscription] = await Promise.all([
    findActiveSubscriptionByUserId(userId),
    findLatestSubscriptionByUserId(userId),
  ]);

  // At renewal, the stored period can expire before its webhook arrives.
  // Reconcile that one boundary here so quota checks recover automatically
  // without requiring the user to visit Billing first.
  if (
    !activeSubscription &&
    latestSubscription?.status === "active" &&
    latestSubscription.currentPeriodEnd instanceof Date &&
    latestSubscription.currentPeriodEnd <= new Date()
  ) {
    const reconciliation = await reconcileSubscriptionForRead(
      latestSubscription,
    );
    latestSubscription = reconciliation.subscription;
    if (
      latestSubscription.status === "active" &&
      latestSubscription.currentPeriodEnd instanceof Date &&
      latestSubscription.currentPeriodEnd > new Date()
    ) {
      activeSubscription = latestSubscription;
    }
  }

  // Backfill existing paid accounts, and verify the first paid cycle even if
  // the webhook arrived before Checkout's verification request.
  if (activeSubscription && !hasPaidAccess(activeSubscription)) {
    const reconciliation = await reconcileSubscriptionForRead(
      activeSubscription,
    );
    activeSubscription = reconciliation.subscription;
    if (latestSubscription?.razorpaySubscriptionId ===
        activeSubscription.razorpaySubscriptionId) {
      latestSubscription = activeSubscription;
    }
  }
  const paidPlan = activeSubscription
    ? getPlan(activeSubscription.planId)
    : null;

  return {
    plan:
      hasPaidEntitlement(activeSubscription) && paidPlan
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
    const reconciliation = await reconcileSubscriptionForRead(
      resolved.subscription,
    );
    if (reconciliation.succeeded) {
      resolved = await resolveBilling(userId);
    }
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
  if (!paymentModeAllowsPaidAccess()) {
    throw new AppError("Live payments are not configured", {
      statusCode: 503,
      code: "live-payments-unavailable",
    });
  }

  const plan = getPlan(planId);

  if (!plan || plan.id === "free") {
    throw new AppError("Select a valid paid plan", {
      statusCode: 400,
      code: "invalid-plan",
    });
  }

  return withDistributedLock(`datadock:billing-create:${userId}`, async () => {
  const existingSubscription = await findOpenSubscription(userId);

  if (existingSubscription) {
    // Closing Checkout does not cancel the Razorpay subscription. Reuse that
    // unpaid subscription instead of creating duplicates on every retry.
    if (
      existingSubscription.status === "created" &&
      existingSubscription.planId === plan.id
    ) {
      return toCheckoutSubscription(existingSubscription, plan);
    }

    throw new AppError(
      existingSubscription.cancelAtPeriodEnd
        ? "Your plan is scheduled to end. You can choose a new plan once it does."
        : existingSubscription.status === "created"
          ? "Another plan is awaiting payment. Cancel it before choosing a different plan."
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

  return toCheckoutSubscription(
    {
      razorpaySubscriptionId: razorpaySubscription.id,
    },
    plan,
  );
  }, { ttlMs: 60_000, waitMs: 8_000 });
}

export async function cancelSubscriptionsForAccountDeletion(userId) {
  const subscriptions = await findSubscriptionsByUserId(userId);
  const open = subscriptions.filter((subscription) =>
    OPEN_SUBSCRIPTION_STATUSES.includes(subscription.status),
  );

  for (const subscription of open) {
    try {
      await razorpayClient.subscriptions.cancel(
        subscription.razorpaySubscriptionId,
        false,
      );
    } catch (error) {
      const providerMessage = error.error?.description ?? error.description ?? "";
      if (!/already|cancelled|completed|not found|invalid/i.test(providerMessage)) {
        throw new AppError("The active subscription could not be cancelled", {
          statusCode: error.statusCode ?? 502,
          code: "subscription-cleanup-failed",
        });
      }
    }
  }
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
  let subscription = await findOpenSubscription(userId);

  if (!subscription) {
    throw new AppError("There is no subscription to cancel", {
      statusCode: 404,
      code: "subscription-not-found",
    });
  }

  if (subscription.status === "active" && !hasPaidEntitlement(subscription)) {
    subscription = await syncSubscription(subscription);
  }

  if (!OPEN_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
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
  const atCycleEnd = hasPaidEntitlement(subscription);

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
    paymentCaptured: hasPaidEntitlement(updatedSubscription),
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
    await syncSubscription(subscription);

    return { processed: true };
  } catch (error) {
    await releaseWebhookEvent(eventId);
    throw error;
  }
}
