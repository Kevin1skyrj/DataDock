"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CircleAlert, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/auth/field";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { LOGIN } from "@/constants/auth";
import { loginSchema } from "@/lib/validation/auth";
import { continueWithGoogle, signIn } from "@/services/mock/auth";

/**
 * Where the drive is signed into.
 *
 * `mode: "onTouched"` is the choice worth explaining. Validating as you type
 * tells someone their email is invalid while they are still halfway through
 * writing it, which is both wrong and rude; validating only on submit makes
 * them fix one mistake per round trip. Waiting for the first blur and then
 * following along afterwards is the only one of the three that never
 * contradicts what the visitor is doing.
 *
 * Failures come back from the service already knowing which field is at fault,
 * so a wrong password lands under the password box and an unverified account —
 * which is nobody's typo — lands above the form as a whole.
 */
export function LoginForm() {
  const router = useRouter();

  // Not form state: whether Google is mid-flight, and whether we have already
  // succeeded and are only waiting for the route to change.
  const [status, setStatus] = useState("idle");

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const settled = status === "done";
  const busy = isSubmitting || status !== "idle";

  const submit = async (values) => {
    try {
      await signIn(values);
      setStatus("done");
      router.push("/dashboard");
    } catch (error) {
      // A message under the field that caused it, or above the form when no
      // single field did. Moving focus matters more than it looks: without it
      // the visitor is left on a submit button whose failure is somewhere above
      // them, and a screen reader user is left with nothing at all.
      if (error.field) {
        setError(error.field, { message: error.message });
        setFocus(error.field);
      } else {
        // The code rides along as the error's `type`, which is what lets the
        // alert below offer a way out of the specific thing that went wrong
        // instead of being a sentence in a red box.
        setError("root", { type: error.code, message: error.message });
      }
    }
  };

  const google = async () => {
    setStatus("google");
    try {
      await continueWithGoogle();
      setStatus("done");
      router.push("/dashboard");
    } catch (error) {
      setStatus("idle");
      setError("root", { message: error.message });
    }
  };

  return (
    // `noValidate` because the schema owns validation. Left on, the browser
    // would interrupt with its own bubble in its own voice before ours ran.
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      <GoogleButton
        data-auth="item"
        onClick={google}
        loading={status === "google"}
        disabled={busy}
      >
        {LOGIN.google}
      </GoogleButton>

      <div data-auth="item" className="flex items-center gap-3">
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        <span className="text-xs tracking-wider text-dim uppercase">{LOGIN.divider}</span>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>

      {errors.root ? (
        <div
          role="alert"
          className="flex animate-[dd-detail_240ms_var(--ease-standard)] items-start gap-2.5 rounded-lg border border-error/30 bg-error/10 px-3.5 py-3 text-base text-error"
        >
          <CircleAlert className="mt-px size-4 shrink-0" />
          <p>
            {errors.root.message}
            {/* An unverified account is the one failure here that has an
                obvious next step, and leaving it as a sentence would make the
                visitor go and find it. The code was already sent; this just
                points at the screen that takes it. */}
            {errors.root.type === "unverified" ? (
              <>
                {" "}
                <Link
                  href={`/verify-email?email=${encodeURIComponent(getValues("email"))}`}
                  className="rounded-xs font-medium underline underline-offset-2 hover:text-foreground"
                >
                  Enter your code
                </Link>
              </>
            ) : null}
          </p>
        </div>
      ) : null}

      <Field
        data-auth="item"
        label={LOGIN.email.label}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={LOGIN.email.placeholder}
        startIcon={<Mail />}
        error={errors.email?.message}
        {...register("email")}
      />

      <PasswordField
        data-auth="item"
        label={LOGIN.password.label}
        autoComplete="current-password"
        placeholder={LOGIN.password.placeholder}
        startIcon={<Lock />}
        error={errors.password?.message}
        labelSlot={
          <Link
            href="/forgot-password"
            className="rounded-xs text-base text-muted-foreground transition-colors duration-200 ease-standard hover:text-brand"
          >
            {LOGIN.password.forgot}
          </Link>
        }
        {...register("password")}
      />

      <Button
        data-auth="item"
        type="submit"
        size="lg"
        loading={isSubmitting}
        disabled={busy}
        className="dd-shine mt-1 w-full"
      >
        {settled ? (
          <>
            <Check />
            {LOGIN.success}
          </>
        ) : (
          <>
            {LOGIN.submit}
            {/* The landing page spends a whole section arguing that DataDock is
                keyboard-first. The least it can do is say so on the one key
                that already works here. */}
            <Kbd variant="bare" className="text-brand-contrast/60">
              ↵
            </Kbd>
          </>
        )}
      </Button>
    </form>
  );
}
