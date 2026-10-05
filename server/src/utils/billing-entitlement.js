const EARLY_CHARGE_ALLOWANCE_SECONDS = 3 * 24 * 60 * 60;

export function hasPaidAccess(subscription, now = new Date()) {
  return (
    subscription?.status === "active" &&
    subscription.currentPeriodEnd instanceof Date &&
    subscription.currentPeriodEnd > now &&
    subscription.paidThrough instanceof Date &&
    subscription.paidThrough >= subscription.currentPeriodEnd &&
    typeof subscription.verifiedPaymentId === "string"
  );
}

/**
 * Subscriptions created before payment-proof fields were introduced were
 * already activated through Razorpay's signed checkout and provider sync.
 * They can be recognized because the fields are absent, while every new row
 * stores both fields as null until capture is verified. This compatibility
 * path expires with the stored paid period and cannot grant a new cycle.
 */
export function hasLegacyPaidAccess(subscription, now = new Date()) {
  return (
    subscription?.status === "active" &&
    subscription.currentPeriodEnd instanceof Date &&
    subscription.currentPeriodEnd > now &&
    !Object.hasOwn(subscription, "paidThrough") &&
    !Object.hasOwn(subscription, "verifiedPaymentId")
  );
}

export function invoiceCoversPeriod(invoice, razorpaySubscription, plan) {
  const start = razorpaySubscription.current_start;
  const end = razorpaySubscription.current_end;

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    end <= start ||
    invoice?.subscription_id !== razorpaySubscription.id ||
    invoice.status !== "paid" ||
    invoice.currency !== plan.currency ||
    !Number.isInteger(invoice.amount_paid) ||
    invoice.amount_paid < plan.pricePaise ||
    invoice.amount_due !== 0 ||
    typeof invoice.payment_id !== "string"
  ) return false;

  // Subscription invoices may specify their billing window. If they do, use
  // that window rather than accepting a payment from an earlier cycle.
  if (Number.isInteger(invoice.billing_start) &&
      Number.isInteger(invoice.billing_end)) {
    return invoice.billing_start === start && invoice.billing_end === end;
  }

  // Older invoices may omit billing dates. A paid invoice issued just before
  // the cycle starts is still valid; an invoice from a past cycle is not.
  return Number.isInteger(invoice.paid_at) &&
    invoice.paid_at >= start - EARLY_CHARGE_ALLOWANCE_SECONDS &&
    invoice.paid_at < end;
}

export function paymentMatchesInvoice(payment, invoice, plan) {
  const refunded = Number.isInteger(payment?.amount_refunded)
    ? payment.amount_refunded
    : 0;

  return (
    payment?.id === invoice.payment_id &&
    payment.invoice_id === invoice.id &&
    payment.status === "captured" &&
    payment.captured === true &&
    payment.currency === plan.currency &&
    Number.isInteger(payment.amount) &&
    payment.amount >= plan.pricePaise &&
    payment.amount - refunded >= plan.pricePaise
  );
}
