/**
 * Plans, invoices and the subscription.
 *
 * Shaped around how Razorpay actually works, because the difference matters at
 * integration time. A checkout is not "charge this card" — it is:
 *
 *   1. your server creates an order and returns its id
 *   2. the browser opens Razorpay with that id
 *   3. Razorpay hands back a signed payment, which your server verifies
 *
 * The browser never sees a key secret and never decides that a payment
 * succeeded. `createCheckoutSession` below returns exactly what step 1 returns,
 * so wiring the real thing means replacing its body and calling `razorpay.open`
 * where the comment says — no component changes, and no restructuring of who
 * knows what.
 */

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Paise, not rupees. Money in floats is how totals end at ₹999.9999999. */
export const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "month",
    storageBytes: 5_000_000_000,
    storageLabel: "5 GB",
    tagline: "Enough to see whether this fits how you work.",
    features: [
      "5 GB of storage",
      "Files up to 2 GB",
      "Share links with expiry",
      "Web access",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 49_900,
    interval: "month",
    storageBytes: 100_000_000_000,
    storageLabel: "100 GB",
    tagline: "For people whose work lives in their drive.",
    popular: true,
    features: [
      "100 GB of storage",
      "Files up to 20 GB",
      "Password-protected links",
      "Version history for 30 days",
      "Priority support",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: 149_900,
    interval: "month",
    storageBytes: 1_000_000_000_000,
    storageLabel: "1 TB",
    tagline: "Shared storage, with someone in charge of it.",
    features: [
      "1 TB pooled across the team",
      "Unlimited members",
      "Shared folders and permissions",
      "Audit log",
      "SAML single sign-on",
    ],
  },
];

let subscription = {
  planId: "pro",
  status: "active",
  startedAt: "2026-01-08T00:00:00.000Z",
  renewsAt: "2026-09-01T00:00:00.000Z",
  cancelAtPeriodEnd: false,
};

const INVOICES = [
  { id: "inv_2026_08", number: "DD-2026-008", at: "2026-08-01T00:00:00.000Z", amount: 49_900, status: "paid" },
  { id: "inv_2026_07", number: "DD-2026-007", at: "2026-07-01T00:00:00.000Z", amount: 49_900, status: "paid" },
  { id: "inv_2026_06", number: "DD-2026-006", at: "2026-06-01T00:00:00.000Z", amount: 49_900, status: "paid" },
  { id: "inv_2026_05", number: "DD-2026-005", at: "2026-05-01T00:00:00.000Z", amount: 49_900, status: "paid" },
  { id: "inv_2026_04", number: "DD-2026-004", at: "2026-04-01T00:00:00.000Z", amount: 49_900, status: "refunded" },
];

const paymentMethod = {
  brand: "Visa",
  last4: "4242",
  expiry: "09/28",
  name: "Alex Rivera",
};

const billingAddress = {
  line1: "12 Residency Road",
  line2: "Shanthala Nagar",
  city: "Bengaluru",
  state: "Karnataka",
  postcode: "560025",
  country: "India",
  gstin: null,
};

export async function getSubscription() {
  await wait(220);
  return { ...subscription, plan: PLANS.find((plan) => plan.id === subscription.planId) };
}

export async function getInvoices() {
  await wait(260);
  return INVOICES.map((invoice) => ({ ...invoice }));
}

export async function getBillingDetails() {
  await wait(200);
  return { paymentMethod: { ...paymentMethod }, address: { ...billingAddress } };
}

/**
 * Step 1 of the Razorpay flow: the server creates an order.
 *
 * Returns what the real endpoint returns — an order id, the amount in paise,
 * the currency, and the publishable key. The browser hands all four straight to
 * `new Razorpay({...}).open()`; it never sees the secret, and it never decides
 * whether the payment worked. Verification happens on the webhook.
 *
 * @returns {Promise<{orderId: string, amount: number, currency: string, keyId: string}>}
 */
export async function createCheckoutSession(planId) {
  await wait(650);

  const plan = PLANS.find((entry) => entry.id === planId);
  if (!plan) throw new Error("That plan is no longer available.");
  if (plan.id === subscription.planId) throw new Error(`You are already on ${plan.name}.`);

  return {
    orderId: `order_${Math.random().toString(36).slice(2, 12)}`,
    amount: plan.price,
    currency: "INR",
    // The publishable key. Safe in the browser by design; the secret is not.
    keyId: "rzp_test_mock_key",
    planId: plan.id,
  };
}

export async function cancelSubscription() {
  await wait(500);
  // Cancels at the end of the period rather than immediately. Someone who paid
  // for the month keeps the month — taking it away the moment they cancel is
  // how a refund request starts.
  subscription = { ...subscription, cancelAtPeriodEnd: true, status: "cancelling" };
  return { ...subscription };
}

export async function resumeSubscription() {
  await wait(400);
  subscription = { ...subscription, cancelAtPeriodEnd: false, status: "active" };
  return { ...subscription };
}

/** Test seam. */
export function __resetBilling() {
  subscription = {
    planId: "pro",
    status: "active",
    startedAt: "2026-01-08T00:00:00.000Z",
    renewsAt: "2026-09-01T00:00:00.000Z",
    cancelAtPeriodEnd: false,
  };
}
