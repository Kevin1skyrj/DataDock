import { getDatabase } from "../config/db.js";

const SUBSCRIPTIONS_COLLECTION = "subscriptions";

export async function createSubscriptionIndexes() {
  const subscriptions = getDatabase().collection(SUBSCRIPTIONS_COLLECTION);

  await subscriptions.createIndex(
    { razorpaySubscriptionId: 1 },
    { unique: true },
  );

  await subscriptions.createIndex({
    userId: 1,
    createdAt: -1,
  });
}

export async function insertSubscription({
  userId,
  planId,
  razorpayPlanId,
  razorpaySubscriptionId,
  status,
}) {
  const subscriptions = getDatabase().collection(SUBSCRIPTIONS_COLLECTION);
  const now = new Date();

  const subscription = {
    userId,
    planId,
    razorpayPlanId,
    razorpaySubscriptionId,
    status,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  };

  const result = await subscriptions.insertOne(subscription);

  return {
    ...subscription,
    _id: result.insertedId,
  };
}

export async function findSubscriptionByRazorpayId(
  razorpaySubscriptionId,
) {
  return getDatabase()
    .collection(SUBSCRIPTIONS_COLLECTION)
    .findOne({ razorpaySubscriptionId });
}

export async function findLatestSubscriptionByUserId(userId) {
  return getDatabase()
    .collection(SUBSCRIPTIONS_COLLECTION)
    .findOne(
      { userId },
      {
        sort: {
          createdAt: -1,
        },
      },
    );
}

export async function updateSubscription({
  razorpaySubscriptionId,
  changes,
}) {
  return getDatabase()
    .collection(SUBSCRIPTIONS_COLLECTION)
    .findOneAndUpdate(
      { razorpaySubscriptionId },
      {
        $set: {
          ...changes,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
      },
    );
}