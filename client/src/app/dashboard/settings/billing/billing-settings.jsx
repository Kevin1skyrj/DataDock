"use client";

import { Check, CreditCard } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { SettingRow, SettingsCard, SettingsHeading } from "@/components/settings/settings-parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { notify } from "@/components/ui/toast";
import { PLANS as PLAN_DETAILS } from "@/constants/pricing";
import { formatBytes } from "@/lib/format";
import { openRazorpayCheckout } from "@/lib/razorpay-checkout";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";
import {
  cancelSubscription,
  createSubscription,
  getCurrentBilling,
  getPlans,
  verifySubscription,
} from "@/services/api/billing";
import { getStorageSummary } from "@/services/files";

const DETAILS_BY_PLAN = Object.fromEntries(PLAN_DETAILS.map((plan) => [plan.id, plan]));

/**
 * A billing date, always absolute and always spelled out.
 *
 * `formatDate` is the workspace's, and it answers "Today, 14:22" for anything
 * recent — right for a file you just touched, wrong for a renewal, where the
 * only thing anyone wants is the day the money moves.
 */
const BILLING_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatBillingDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : BILLING_DATE.format(date);
}

/**
 * Razorpay's status vocabulary, said in the product's own words.
 *
 * `halted` and `authenticated` are accurate and mean nothing to the person
 * paying; what they need to know is whether the plan is working, waiting, or
 * finished.
 */
const STATUS_LABELS = {
  active: { label: "Active", variant: "success" },
  created: { label: "Awaiting payment", variant: "warning" },
  authenticated: { label: "Awaiting first charge", variant: "warning" },
  pending: { label: "Payment pending", variant: "warning" },
  halted: { label: "Payment failed", variant: "error" },
  paused: { label: "Paused", variant: "warning" },
  cancelled: { label: "Cancelled", variant: "neutral" },
  completed: { label: "Completed", variant: "neutral" },
  expired: { label: "Expired", variant: "neutral" },
};

/**
 * The one date worth showing, and what to call it.
 *
 * A subscription that renews and one that is winding down both end their period
 * on the same field — the difference is entirely in the word in front of it,
 * and that word is the whole message.
 */
function describePeriod(subscription) {
  if (!subscription) return null;

  if (subscription.status === "active") {
    return {
      label: subscription.cancelAtPeriodEnd ? "Access until" : "Renews on",
      value: formatBillingDate(subscription.currentPeriodEnd),
    };
  }

  const ended = formatBillingDate(subscription.endedAt);
  if (ended) return { label: "Ended on", value: ended };

  const period = formatBillingDate(subscription.currentPeriodEnd);
  return period ? { label: "Ends on", value: period } : null;
}

function planActionLabel({ plan, current, canChangePlan, endingSoon }) {
  if (current) return "Current plan";
  if (plan.id === "free") return "Cancel to downgrade";
  if (!canChangePlan) {
    return endingSoon ? "Available when your plan ends" : "Plan change unavailable";
  }
  return `Choose ${plan.name}`;
}

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
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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

  const subscription = billing?.subscription ?? null;
  const canChangePlan = billing?.canChangePlan ?? false;
  const endingSoon = subscription?.cancelAtPeriodEnd === true;
  // Cancellable exactly when the server would accept it: something is being
  // held, and it is not already on its way out.
  const cancellable = Boolean(billing) && !canChangePlan && !endingSoon;
  const period = describePeriod(subscription);
  const status = subscription ? STATUS_LABELS[subscription.status] : null;

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

  const confirmCancel = async () => {
    setCancelling(true);
    try {
      await cancelSubscription();
      const nextBilling = await fetchBillingData();
      applyBilling(nextBilling);
      setConfirmingCancel(false);

      const until = formatBillingDate(nextBilling.billing.subscription?.currentPeriodEnd);
      notify({
        title: "Plan cancelled",
        description: until
          ? `You keep everything on this plan until ${until}. Nothing will be charged after that.`
          : "Nothing further will be charged.",
      });
    } catch (error) {
      notify({ title: "Could not cancel the plan", description: error.message, type: "error" });
    } finally {
      setCancelling(false);
    }
  };

  const occupied = summary ? summary.used + summary.trashed : 0;

  return (
    <>
      <SettingsHeading
        title="Billing"
        description="Choose a monthly plan and keep your storage allowance visible."
      />

      <SettingsCard
        title="Current plan"
        footer={
          cancellable ? (
            <Button variant="ghost" onClick={() => setConfirmingCancel(true)}>
              Cancel plan
            </Button>
          ) : null
        }
      >
        <SettingRow
          label="Plan"
          hint={
            endingSoon && period?.value
              ? `Cancelled — your paid features stay until ${period.value}.`
              : undefined
          }
          control={
            billing ? <Badge variant="brand">{billing.plan.name}</Badge> : <span className="text-dim">Loading…</span>
          }
        />

        {status ? (
          <SettingRow
            label="Status"
            control={
              <Badge variant={endingSoon ? "warning" : status.variant}>
                {endingSoon && subscription.status === "active" ? "Ending" : status.label}
              </Badge>
            }
          />
        ) : null}

        {period?.value ? (
          <SettingRow
            label={period.label}
            control={
              <span className="text-md tabular-nums text-muted-foreground">{period.value}</span>
            }
          />
        ) : null}

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
              const locked = !current && (plan.id === "free" || !canChangePlan);

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
                    disabled={current || locked}
                    onClick={() => choosePlan(plan)}
                  >
                    <CreditCard className="size-3.5" />
                    {planActionLabel({ plan, current, canChangePlan, endingSoon })}
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </SettingsCard>

      {/* The same dialog permanent deletion uses. Cancelling is not destructive
          in the same way — nothing is lost today — but it is the one billing
          action that cannot be undone by pressing the button again. */}
      <ConfirmDialog
        open={confirmingCancel}
        title="Cancel your plan?"
        body={
          period?.value
            ? `Your ${billing?.plan.name} plan stays active until ${period.value}, and you will not be charged again. After that your account returns to the Free plan and its storage limit.`
            : "You will not be charged again, and your account returns to the Free plan when the current period ends."
        }
        confirmLabel="Cancel plan"
        loading={cancelling}
        onConfirm={confirmCancel}
        onClose={() => setConfirmingCancel(false)}
      />
    </>
  );
}
