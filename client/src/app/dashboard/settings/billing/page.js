import { BillingSettings } from "@/app/dashboard/settings/billing/billing-settings";

export const metadata = { title: "Billing" };

export default async function BillingPage({ searchParams }) {
  const params = await searchParams;
  const requestedPlan = ["pro", "premium"].includes(params.plan) ? params.plan : null;

  return <BillingSettings requestedPlan={requestedPlan} />;
}
