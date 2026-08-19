import { apiRequest } from "@/services/api/api-client";

export function getPlans() {
  return apiRequest("/billing/plans");
}

export function getCurrentBilling() {
  return apiRequest("/billing/current");
}

export function createSubscription(planId) {
  return apiRequest("/billing/subscriptions", {
    method: "POST",
    body: { planId },
  });
}

export function verifySubscription({ paymentId, subscriptionId, signature }) {
  return apiRequest("/billing/subscriptions/verify", {
    method: "POST",
    body: { paymentId, subscriptionId, signature },
  });
}
