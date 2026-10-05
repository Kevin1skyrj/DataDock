import assert from "node:assert/strict";
import test from "node:test";

import {
  hasPaidAccess,
  invoiceCoversPeriod,
  paymentMatchesInvoice,
} from "../src/utils/billing-entitlement.js";

const now = new Date("2026-10-06T12:00:00Z");
const periodEnd = new Date("2026-11-06T00:00:00Z");
const plan = { pricePaise: 9900, currency: "INR" };
const subscription = {
  id: "sub_example",
  current_start: 1791244800,
  current_end: 1793923200,
};
const invoice = {
  id: "inv_example",
  subscription_id: subscription.id,
  status: "paid",
  currency: "INR",
  amount_paid: 9900,
  amount_due: 0,
  payment_id: "pay_example",
  billing_start: subscription.current_start,
  billing_end: subscription.current_end,
};
const payment = {
  id: invoice.payment_id,
  invoice_id: invoice.id,
  status: "captured",
  captured: true,
  currency: "INR",
  amount: 9900,
  amount_refunded: 0,
};

test("active status alone never grants paid access", () => {
  const base = { status: "active", currentPeriodEnd: periodEnd };
  assert.equal(hasPaidAccess(base, now), false);
  assert.equal(hasPaidAccess({ ...base, paidThrough: periodEnd }, now), false);
  assert.equal(hasPaidAccess({
    ...base,
    paidThrough: periodEnd,
    verifiedPaymentId: "pay_example",
  }, now), true);
  assert.equal(hasPaidAccess({
    ...base,
    paidThrough: new Date("2026-10-01T00:00:00Z"),
    verifiedPaymentId: "pay_example",
  }, now), false);
  assert.equal(hasPaidAccess({
    ...base,
    paidThrough: periodEnd,
    verifiedPaymentId: "pay_example",
    status: "cancelled",
  }, now), false);
});

test("invoice must be paid, full price, and for the current cycle", () => {
  assert.equal(invoiceCoversPeriod(invoice, subscription, plan), true);
  assert.equal(invoiceCoversPeriod({ ...invoice, status: "issued" }, subscription, plan), false);
  assert.equal(invoiceCoversPeriod({ ...invoice, amount_paid: 100 }, subscription, plan), false);
  assert.equal(invoiceCoversPeriod({ ...invoice, subscription_id: "sub_other" }, subscription, plan), false);
  assert.equal(invoiceCoversPeriod({ ...invoice, billing_end: subscription.current_start }, subscription, plan), false);
  assert.equal(invoiceCoversPeriod({
    ...invoice,
    billing_start: null,
    billing_end: null,
    paid_at: subscription.current_start - 60,
  }, subscription, plan), true);
  assert.equal(invoiceCoversPeriod({
    ...invoice,
    billing_start: null,
    billing_end: null,
    paid_at: subscription.current_start - 10 * 24 * 60 * 60,
  }, subscription, plan), false);
});

test("payment must be captured, bound to invoice, and not fully refunded", () => {
  assert.equal(paymentMatchesInvoice(payment, invoice, plan), true);
  assert.equal(paymentMatchesInvoice({ ...payment, status: "authorized", captured: false }, invoice, plan), false);
  assert.equal(paymentMatchesInvoice({ ...payment, invoice_id: "inv_other" }, invoice, plan), false);
  assert.equal(paymentMatchesInvoice({ ...payment, amount: 100 }, invoice, plan), false);
  assert.equal(paymentMatchesInvoice({ ...payment, amount_refunded: 9900 }, invoice, plan), false);
  assert.equal(paymentMatchesInvoice({ ...payment, amount_refunded: 1 }, invoice, plan), false);
});
