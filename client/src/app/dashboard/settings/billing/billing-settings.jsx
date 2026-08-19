"use client";

import { Check, CreditCard } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { SettingRow, SettingsCard, SettingsHeading } from "@/components/settings/settings-parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { PLANS as PLAN_DETAILS } from "@/constants/pricing";
import { formatBytes } from "@/lib/format";
import { openRazorpayCheckout } from "@/lib/razorpay-checkout";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";
import {
  createSubscription,
  getCurrentBilling,
  getPlans,
  verifySubscription,
} from "@/services/api/billing";
import { getStorageSummary } from "@/services/files";

const DETAILS_BY_PLAN = Object.fromEntries(PLAN_DETAILS.map((plan) => [plan.id, plan]));

async function fetchBillingData() {
  const [plans, billing, summary] = await Promise.all([
    getPlans(),
    getCurrentBilling(),
    getStorageSummary(),
  ]);

  return { plans, billing, summary };
}

function PlanSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-3 p-5 md:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-72 animate-pulse rounded-xl bg-surface-2" />
      ))}
    </div>
  );
}

export function BillingSettings() {
  const session = useSession();
  const updateSession = session.update;
  const [plans, setPlans] = useState(null);
  const [billing, setBilling] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);

  const applyBilling = useCallback(({ plans: nextPlans, billing: nextBilling, summary: nextSummary }) => {
    setPlans(nextPlans);
    setBilling(nextBilling);
    setSummary(nextSummary);
    updateSession({ plan: nextBilling.plan.name });
  }, [updateSession]);

  useEffect(() => {
    let cancelled = false;

    fetchBillingData()
      .then((data) => {
        if (!cancelled) applyBilling(data);
      })
      .catch((error) => {
        if (!cancelled) {
          notify({ title: "Could not load billing", description: error.message, type: "error" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applyBilling]);

  const choosePlan = async (plan) => {
    if (plan.id === "free" || plan.id === billing?.plan.id) return;

    setLoadingPlan(plan.id);
    try {
      const checkout = await createSubscription(plan.id);
      const payment = await openRazorpayCheckout({ checkout, account: session });
      if (!payment) return;

      await verifySubscription(payment);
      const nextBilling = await fetchBillingData();
      applyBilling(nextBilling);

      if (nextBilling.billing.plan.id === plan.id) {
        notify({
          title: `${plan.name} is active`,
          description: `Your storage allowance is now ${formatBytes(plan.storageQuotaBytes)}.`,
        });
      } else {
        notify({
          title: "Payment verified",
          description: "Razorpay is finishing the subscription activation.",
        });
      }
    } catch (error) {
      notify({ title: "Payment was not completed", description: error.message, type: "error" });
    } finally {
      setLoadingPlan(null);
    }
  };

  const occupied = summary ? summary.used + summary.trashed : 0;
  const hasPaidPlan = billing?.plan.id !== "free";

  return (
    <>
      <SettingsHeading
        title="Billing"
        description="Choose a monthly plan and keep your storage allowance visible."
      />

      <SettingsCard title="Current plan">
        <SettingRow
          label="Plan"
          control={
            billing ? <Badge variant="brand">{billing.plan.name}</Badge> : <span className="text-dim">Loading…</span>
          }
        />
        <SettingRow
          label="Storage used"
          control={
            <span className="text-md text-muted-foreground">
              {summary ? `${formatBytes(occupied)} of ${formatBytes(summary.quota)}` : "Loading…"}
            </span>
          }
        />
        <SettingRow
          label="Maximum file size"
          control={
            <span className="text-md text-muted-foreground">
              {billing ? formatBytes(billing.plan.maxFileSizeBytes) : "Loading…"}
            </span>
          }
        />
      </SettingsCard>

      <SettingsCard
        title="Plans"
        description="Prices are charged monthly in Indian rupees through Razorpay."
      >
        {!plans || !billing ? (
          <PlanSkeleton />
        ) : (
          <div className="grid gap-3 p-4 md:grid-cols-3">
            {plans.map((plan) => {
              const details = DETAILS_BY_PLAN[plan.id];
              const current = billing.plan.id === plan.id;
              const paidPlanUnavailable = hasPaidPlan && !current;

              return (
                <article
                  key={plan.id}
                  className={cn(
                    "flex min-w-0 flex-col rounded-xl border p-4",
                    current ? "border-brand/40 bg-brand-tint/35" : "border-line bg-surface",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-md font-medium text-foreground">{plan.name}</h3>
                      <p className="mt-1 text-sm leading-[1.5] text-dim">{details?.tagline}</p>
                    </div>
                    {current ? <Badge variant="brand" size="sm">Current</Badge> : null}
                  </div>

                  <p className="mt-5 flex items-baseline gap-1 text-foreground">
                    <span className="text-2xl font-semibold tabular-nums">₹{plan.pricePaise / 100}</span>
                    <span className="text-sm text-dim">/ month</span>
                  </p>

                  <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                    <li className="flex gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-brand" />
                      {formatBytes(plan.storageQuotaBytes)} storage
                    </li>
                    <li className="flex gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-brand" />
                      {formatBytes(plan.maxFileSizeBytes)} maximum file size
                    </li>
                  </ul>

                  <Button
                    className="mt-5 w-full"
                    variant={plan.id === "pro" ? "primary" : "secondary"}
                    loading={loadingPlan === plan.id}
                    disabled={current || plan.id === "free" || paidPlanUnavailable}
                    onClick={() => choosePlan(plan)}
                  >
                    <CreditCard className="size-3.5" />
                    {current
                      ? "Current plan"
                      : paidPlanUnavailable
                        ? "Plan change unavailable"
                        : `Choose ${plan.name}`}
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </SettingsCard>
    </>
  );
}
