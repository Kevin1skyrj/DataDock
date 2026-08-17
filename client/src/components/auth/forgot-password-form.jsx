"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CircleAlert, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { FORGOT } from "@/constants/auth";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { requestPasswordReset } from "@/services/auth";

/**
 * One field, one job.
 *
 * There is deliberately no "no account uses that address" error here, and its
 * absence is a decision rather than an omission: this form takes an email from
 * someone who has proved nothing, so answering honestly would let anyone stand
 * outside and learn who has a DataDock account. It always succeeds, and always
 * moves on to the code screen.
 */
export function ForgotPasswordForm() {
  const router = useRouter();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    defaultValues: { email: "" },
  });

  const submit = async ({ email }) => {
    try {
      await requestPasswordReset({ email });
      setSent(true);
      router.push(`/verify-email?email=${encodeURIComponent(email)}&flow=reset`);
    } catch (error) {
      setError("root", { message: error.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
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
        label={FORGOT.email.label}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={FORGOT.email.placeholder}
        startIcon={<Mail />}
        error={errors.email?.message}
        {...register("email")}
      />

      <Button
        data-auth="item"
        type="submit"
        size="lg"
        loading={isSubmitting}
        disabled={sent}
        className="dd-shine mt-1 w-full"
      >
        {sent ? (
          <>
            <Check />
            {FORGOT.success}
          </>
        ) : (
          <>
            {FORGOT.submit}
            <Kbd variant="bare" className="text-brand-contrast/60">
              ↵
            </Kbd>
          </>
        )}
      </Button>
    </form>
  );
}
