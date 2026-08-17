"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CircleAlert, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/auth/field";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { REGISTER } from "@/constants/auth";
import { registerSchema } from "@/lib/validation/auth";
import { continueWithGoogle, signUp } from "@/services/auth";

const LEGAL_LINK =
  "rounded-xs text-muted-foreground underline decoration-line-2 underline-offset-2 transition-colors duration-200 ease-standard hover:text-brand hover:decoration-brand/40";

/**
 * Where an account is created.
 *
 * Three fields, and no confirm-password box. Asking someone to type the same
 * secret twice is a workaround for not being able to see it — and this field
 * can be seen, on a control that is right there. What the second box actually
 * buys you is a typo caught now instead of at the next sign-in, and the reset
 * flow already exists for that. The strength meter is the better use of the
 * space.
 *
 * Signing up does not sign you in: `signUp` returns an unverified account and
 * hands the visitor to the verification screen with their address in tow, which
 * is why the success copy says "Account created" rather than "Welcome".
 */
export function RegisterForm() {
  const router = useRouter();
  const [status, setStatus] = useState("idle");

  const {
    control,
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "" },
  });

  const settled = status === "done";
  const busy = isSubmitting || status !== "idle";

  const submit = async (values) => {
    try {
      const account = await signUp(values);
      setStatus("done");
      // The code was sent to an address the next screen has no other way of
      // knowing. Carried in the URL so a reload does not strand them.
      router.push(`/verify-email?email=${encodeURIComponent(account.email)}`);
    } catch (error) {
      if (error.field) {
        setError(error.field, { message: error.message });
        setFocus(error.field);
      } else {
        setError("root", { message: error.message });
      }
    }
  };

  const google = async () => {
    setStatus("google");
    try {
      await continueWithGoogle();
      setStatus("done");
      // Google has already vouched for the address, so there is nothing to
      // verify — this one goes straight in.
      router.push("/dashboard");
    } catch (error) {
      setStatus("idle");
      setError("root", { message: error.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      <GoogleButton
        data-auth="item"
        onClick={google}
        loading={status === "google"}
        disabled={busy}
      >
        {REGISTER.google}
      </GoogleButton>

      <div data-auth="item" className="flex items-center gap-3">
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        <span className="text-xs tracking-wider text-dim uppercase">{REGISTER.divider}</span>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>

      {errors.root ? (
        <p
          role="alert"
          className="flex animate-[dd-detail_240ms_var(--ease-standard)] items-start gap-2.5 rounded-lg border border-error/30 bg-error/10 px-3.5 py-3 text-base text-error"
        >
          <CircleAlert className="mt-px size-4 shrink-0" />
          {errors.root.message}
        </p>
      ) : null}

      <Field
        data-auth="item"
        label={REGISTER.name.label}
        type="text"
        autoComplete="name"
        placeholder={REGISTER.name.placeholder}
        startIcon={<User />}
        error={errors.name?.message}
        {...register("name")}
      />

      <Field
        data-auth="item"
        label={REGISTER.email.label}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={REGISTER.email.placeholder}
        startIcon={<Mail />}
        error={errors.email?.message}
        {...register("email")}
      />

      <PasswordField
        data-auth="item"
        label={REGISTER.password.label}
        autoComplete="new-password"
        placeholder={REGISTER.password.placeholder}
        startIcon={<Lock />}
        error={errors.password?.message}
        {...register("password")}
      >
        <PasswordStrength control={control} name="password" />
      </PasswordField>

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
            {REGISTER.success}
          </>
        ) : (
          <>
            {REGISTER.submit}
            <Kbd variant="bare" className="text-brand-contrast/60">
              ↵
            </Kbd>
          </>
        )}
      </Button>

      {/* Directly under the button that agrees to it, rather than buried at the
          foot of the sheet where it would be a formality nobody was shown. */}
      <p data-auth="item" className="text-center text-sm leading-[1.6] text-dim text-balance">
        {REGISTER.legal.prefix}{" "}
        <Link href={REGISTER.legal.terms.href} className={LEGAL_LINK}>
          {REGISTER.legal.terms.label}
        </Link>{" "}
        {REGISTER.legal.conjunction}{" "}
        <Link href={REGISTER.legal.privacy.href} className={LEGAL_LINK}>
          {REGISTER.legal.privacy.label}
        </Link>
        .
      </p>
    </form>
  );
}
