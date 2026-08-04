"use client";

import { Check, CreditCard, Download, Pencil } from "lucide-react";
import { useEffect, useState } from "react";

import { SettingRow, SettingsCard, SettingsHeading } from "@/components/settings/settings-parts";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { notify } from "@/components/ui/toast";
import { formatBytes, formatDate } from "@/lib/format";
import {
  PLANS,
  cancelSubscription,
  createCheckoutSession,
  getBillingDetails,
  getInvoices,
  getSubscription,
  resumeSubscription,
} from "@/services/mock/billing";
import { getStorageSummary } from "@/services/files";
import { cn } from "@/lib/utils";

/** Paise to rupees, at the last possible moment. */
const money = (paise) =>
  paise === 0
    ? "Free"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(paise / 100);

const STATUS_TONE = {
  paid: "text-success",
  refunded: "text-dim",
  failed: "text-error",
};

export function BillingSettings() {
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState(null);
  const [details, setDetails] = useState(null);
  const [usage, setUsage] = useState(null);
  const [checkingOut, setCheckingOut] = useState(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const set = (setter) => (value) => {
      if (!cancelled) setter(value);
    };

    getSubscription().then(set(setSubscription));
    getInvoices().then(set(setInvoices));
    getBillingDetails().then(set(setDetails));
    getStorageSummary().then(set(setUsage));

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Where Razorpay goes.
   *
   * The server creates the order; the browser opens the checkout with the id it
   * gets back. Replacing the body of `createCheckoutSession` and calling
   * `new Razorpay({ ...session, handler }).open()` on the next line is the
   * entire integration — nothing above this function has to change, because
   * nothing above it ever knew how payment worked.
   */
  const upgrade = async (planId) => {
    setCheckingOut(planId);
    try {
      const session = await createCheckoutSession(planId);
      notify({
        title: "Checkout ready",
        description: `Order ${session.orderId} · ${money(session.amount)}. Razorpay opens here.`,
      });
    } catch (failure) {
      notify({ title: failure.message, type: "error" });
    } finally {
      setCheckingOut(null);
    }
  };

  const used = usage ? usage.used + usage.trashed : 0;
  const quota = subscription?.plan.storageBytes ?? 0;
  const percent = quota ? Math.min(100, (used / quota) * 100) : 0;

  return (
    <>
      <SettingsHeading
        title="Billing"
        description="Your plan, what it costs, and everything you have been charged."
      />

      {/* ------------------------------------------------------ current -- */}
      <SettingsCard
        title="Current plan"
        footer={
          subscription ? (
            subscription.cancelAtPeriodEnd ? (
              <Button
                variant="secondary"
                onClick={async () => {
                  setSubscription(await resumeSubscription());
                  notify({ title: "Subscription resumed" });
                }}
              >
                Resume subscription
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmingCancel(true)}>
                Cancel subscription
              </Button>
            )
          ) : null
        }
      >
        {subscription && usage ? (
          <div className="flex flex-col gap-4 px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-2.5">
                <span className="text-display-xs font-semibold tracking-tight text-foreground">
                  {subscription.plan.name}
                </span>
                <span className="text-md text-dim">
                  {money(subscription.plan.price)}
                  {subscription.plan.price > 0 ? ` / ${subscription.plan.interval}` : null}
                </span>
              </div>

              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-sm",
                  subscription.cancelAtPeriodEnd
                    ? "bg-warning/12 text-warning"
                    : "bg-success/12 text-success",
                )}
              >
                {subscription.cancelAtPeriodEnd ? "Ends soon" : "Active"}
              </span>
            </div>

            <p className="text-base text-muted-foreground">
              {subscription.cancelAtPeriodEnd
                ? `Your plan ends on ${formatDate(subscription.renewsAt)}. Files stay put; uploads stop above the free limit.`
                : `Renews on ${formatDate(subscription.renewsAt)}.`}
            </p>

            <div className="flex flex-col gap-2">
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full origin-left rounded-full bg-brand transition-transform duration-300 ease-standard"
                  style={{ transform: `scaleX(${percent / 100})` }}
                />
              </div>
              <p className="text-sm text-dim">
                {formatBytes(used)} of {subscription.plan.storageLabel} used
              </p>
            </div>
          </div>
        ) : (
          <div aria-hidden="true" className="flex flex-col gap-3 px-5 py-5">
            {[40, 65, 30].map((width) => (
              <div key={width} className="h-4 rounded-full bg-surface-2" style={{ width: `${width}%` }} />
            ))}
          </div>
        )}
      </SettingsCard>

      {/* -------------------------------------------------------- plans -- */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const current = subscription?.planId === plan.id;

          return (
            <section
              key={plan.id}
              className={cn(
                "flex flex-col rounded-xl border bg-overlay p-5",
                current ? "border-brand/40 bg-brand-tint" : "border-line",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-md font-medium text-foreground">{plan.name}</h3>
                {plan.popular && !current ? (
                  <span className="rounded-sm bg-brand-tint px-1.5 py-0.5 text-2xs text-brand">
                    Popular
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-sm leading-[1.6] text-dim">{plan.tagline}</p>

              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="text-display-xs font-semibold tracking-tight text-foreground">
                  {money(plan.price)}
                </span>
                {plan.price > 0 ? (
                  <span className="text-sm text-dim">/ {plan.interval}</span>
                ) : null}
              </p>

              <ul className="mt-4 flex flex-1 flex-col gap-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-base text-muted-foreground">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-brand" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="mt-5 w-full"
                variant={current ? "secondary" : plan.popular ? "primary" : "secondary"}
                disabled={current}
                loading={checkingOut === plan.id}
                onClick={() => upgrade(plan.id)}
              >
                {current ? "Current plan" : `Switch to ${plan.name}`}
              </Button>
            </section>
          );
        })}
      </div>

      {/* ------------------------------------------------------ details -- */}
      <SettingsCard title="Billing details">
        <SettingRow
          label="Payment method"
          hint={
            details
              ? `${details.paymentMethod.brand} ending ${details.paymentMethod.last4} · expires ${details.paymentMethod.expiry}`
              : "Loading…"
          }
          control={
            <Button variant="secondary" size="sm">
              <CreditCard />
              Update
            </Button>
          }
        />

        <SettingRow
          label="Billing address"
          hint={
            details
              ? [details.address.line1, details.address.city, details.address.postcode, details.address.country]
                  .filter(Boolean)
                  .join(", ")
              : "Loading…"
          }
          control={
            <Button variant="secondary" size="sm">
              <Pencil />
              Edit
            </Button>
          }
        />

        <SettingRow
          label="GSTIN"
          hint="Add a GST number to have it appear on every invoice."
          control={
            <Button variant="secondary" size="sm">
              Add GSTIN
            </Button>
          }
        />
      </SettingsCard>

      {/* ----------------------------------------------------- invoices -- */}
      <SettingsCard title="Payment history">
        {invoices === null ? (
          <div aria-hidden="true" className="flex flex-col gap-3 px-5 py-5">
            {[70, 70, 70].map((width, index) => (
              <div key={index} className="h-4 rounded-full bg-surface-2" style={{ width: `${width}%` }} />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <p className="px-5 py-8 text-center text-base text-dim">
            Nothing yet. Invoices appear here after your first payment.
          </p>
        ) : (
          <ul className="divide-y divide-line/60">
            {invoices.map((invoice) => (
              <li key={invoice.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-mono text-base text-foreground">
                    {invoice.number}
                  </span>
                  <span className="text-sm text-dim">{formatDate(invoice.at)}</span>
                </div>

                <span className="shrink-0 font-mono text-base text-muted-foreground tabular-nums">
                  {money(invoice.amount)}
                </span>

                <span className={cn("w-20 shrink-0 text-sm capitalize", STATUS_TONE[invoice.status])}>
                  {invoice.status}
                </span>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Download invoice ${invoice.number}`}
                  onClick={() => notify({ title: `Downloading ${invoice.number}` })}
                >
                  <Download className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>

      <ConfirmDialog
        open={confirmingCancel}
        title="Cancel your subscription?"
        body={
          subscription
            ? `You keep ${subscription.plan.name} until ${formatDate(subscription.renewsAt)}. After that the drive drops to the free limit, and anything over it becomes read-only rather than deleted.`
            : ""
        }
        confirmLabel="Cancel subscription"
        onConfirm={async () => {
          setConfirmingCancel(false);
          setSubscription(await cancelSubscription());
          notify({ title: "Subscription will end at the period close" });
        }}
        onClose={() => setConfirmingCancel(false)}
      />
    </>
  );
}
