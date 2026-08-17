"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthSuccess } from "@/components/auth/auth-success";
import { OtpInput } from "@/components/auth/otp-input";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { RESEND_SECONDS, SUCCESS, VERIFY } from "@/constants/auth";
import { verifyOtpSchema } from "@/lib/validation/auth";
import { resendOtp, verifyOtp } from "@/services/auth";

/**
 * The code screen, serving both flows.
 *
 * A code confirming a new address and a code authorising a password reset are
 * the same interaction, so this is one screen with two destinations rather than
 * two screens with one interaction. `flow` decides the heading, where the
 * wrong-address link goes, and what happens on success: registration ends here
 * in the success state, while a reset carries its token on to the next screen.
 *
 * Six digits submit on their own. Making someone type the last character and
 * then reach for a button is asking them to confirm something they have already
 * unambiguously finished — but the button stays, because auto-submit that fails
 * has to leave something to press again.
 */
export function VerifyEmail({ email, flow }) {
  const router = useRouter();
  const copy = VERIFY[flow];

  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [remaining, setRemaining] = useState(RESEND_SECONDS);

  const otpRef = useRef(null);
  const labelId = useId();
  const errorId = useId();

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { code: "" },
  });

  // One timeout per second rather than one interval for the whole countdown:
  // the effect re-runs on each tick and cleans up after itself, so a navigation
  // mid-count cannot leave a timer running against an unmounted screen.
  useEffect(() => {
    if (remaining <= 0) return undefined;
    const id = window.setTimeout(() => setRemaining((left) => left - 1), 1000);
    return () => window.clearTimeout(id);
  }, [remaining]);

  const submit = async ({ code }) => {
    try {
      const { token } = await verifyOtp({ email, code, flow });

      if (flow === "reset") {
        // The next screen has to prove a code was checked, or it is a page
        // anyone can open and change any account from.
        router.push(
          `/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`,
        );
        return;
      }

      setVerified(true);
    } catch (error) {
      // Clear it and hand it back at the first box. A rejected code left in
      // place is six characters the visitor now has to delete before they can
      // act on being told it was wrong.
      setValue("code", "");
      setError("code", { message: error.message });
      otpRef.current?.focusFirst();
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await resendOtp({ email, flow });
      setValue("code", "");
      setRemaining(RESEND_SECONDS);
      setResent(true);
      otpRef.current?.focusFirst();
    } finally {
      setResending(false);
    }
  };

  if (verified) return <AuthSuccess {...SUCCESS.verified} />;

  return (
    <AuthPanel
      title={copy.title}
      description={
        <>
          {copy.lead}{" "}
          <span className="font-medium text-foreground">{email || VERIFY.fallbackEmail}</span>.
        </>
      }
      footer={
        <>
          {copy.alternative.prompt}{" "}
          <Link
            href={copy.alternative.href}
            className="rounded-xs font-medium text-foreground transition-colors duration-200 ease-standard hover:text-brand"
          >
            {copy.alternative.label}
          </Link>
        </>
      }
    >
      {/* `handleSubmit(submit)` is built inside the handler rather than during
          render: `submit` reaches for the OTP control's ref to put the cursor
          back after a bad code, and handing a ref-reading function to another
          function during render is exactly what React's rules forbid. */}
      <form
        onSubmit={(event) => handleSubmit(submit)(event)}
        noValidate
        className="flex flex-col gap-5"
      >
        <div data-auth="item" className="flex flex-col gap-2">
          <span id={labelId} className="text-base font-medium text-muted-foreground">
            {VERIFY.label}
          </span>

          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <OtpInput
                ref={otpRef}
                value={field.value}
                onChange={field.onChange}
                // Guarded, because a visitor who backspaces and retypes the
                // last digit would otherwise fire a second request on top of
                // the first.
                onComplete={() => {
                  if (!isSubmitting) handleSubmit(submit)();
                }}
                invalid={Boolean(errors.code)}
                disabled={isSubmitting}
                labelledBy={labelId}
                describedBy={errors.code ? errorId : undefined}
              />
            )}
          />

          {errors.code ? (
            <p
              id={errorId}
              role="alert"
              className="flex animate-[dd-detail_240ms_var(--ease-standard)] items-center gap-2 text-base text-error"
            >
              <CircleAlert className="size-4 shrink-0" />
              {errors.code.message}
            </p>
          ) : null}
        </div>

        <div data-auth="item" className="flex items-center justify-between gap-3">
          <p role="status" className="text-sm text-dim">
            {resent ? VERIFY.resend.sent : VERIFY.resend.prompt}
          </p>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={resending}
            disabled={remaining > 0 || resending}
            onClick={resend}
          >
            {remaining > 0 ? `Resend in ${remaining}s` : VERIFY.resend.idle}
          </Button>
        </div>

        <Button
          data-auth="item"
          type="submit"
          size="lg"
          loading={isSubmitting}
          className="dd-shine w-full"
        >
          {VERIFY.submit}
          <Kbd variant="bare" className="text-brand-contrast/60">
            ↵
          </Kbd>
        </Button>
      </form>
    </AuthPanel>
  );
}
