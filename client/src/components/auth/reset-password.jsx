"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Lock, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthPanel } from "@/components/auth/auth-panel";
import { AuthSuccess } from "@/components/auth/auth-success";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { RESET, SUCCESS } from "@/constants/auth";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { resetPassword } from "@/services/auth";

/**
 * Setting the new password.
 *
 * No confirm-password box, for the same reason register has none: the field can
 * be revealed, and a second box is a workaround for not being able to see the
 * first. The reveal toggle and the strength meter do the work the duplicate was
 * standing in for.
 *
 * The token guard is not decoration. Without it this is a page anyone can open
 * and change any account from — so arriving without one is a dead end that
 * offers the only useful thing left, which is starting over.
 */
export function ResetPassword({ email, token }) {
  const [done, setDone] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { password: "" },
  });

  const submit = async ({ password }) => {
    try {
      await resetPassword({ email, token, password });
      setDone(true);
    } catch (error) {
      if (error.field) setError(error.field, { message: error.message });
      else setError("root", { message: error.message });
    }
  };

  if (!token) {
    return (
      <AuthPanel
        title={RESET.expired.title}
        description={RESET.expired.description}
        icon={<TriangleAlert strokeWidth={2.25} />}
      >
        <Button
          data-auth="item"
          size="lg"
          variant="secondary"
          render={<Link href={RESET.expired.action.href} />}
          className="w-full"
        >
          {RESET.expired.action.label}
        </Button>
      </AuthPanel>
    );
  }

  if (done) return <AuthSuccess {...SUCCESS.reset} />;

  return (
    <AuthPanel
      title={RESET.title}
      description={
        email ? (
          <>
            {RESET.forEmail}{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </>
        ) : (
          RESET.description
        )
      }
    >
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

        {/* Not for the form's benefit — the address is already a prop. A
            password manager will not offer to update a stored credential
            unless it can see which account the new password belongs to, and
            this is the field it looks for. Browsers that do not parse it
            simply ignore it. The same address is visible above, so nothing is
            being smuggled past the visitor. */}
        <input type="text" name="email" value={email} autoComplete="username" readOnly hidden />

        <PasswordField
          data-auth="item"
          label={RESET.password.label}
          autoComplete="new-password"
          placeholder={RESET.password.placeholder}
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
          className="dd-shine mt-1 w-full"
        >
          {RESET.submit}
          <Kbd variant="bare" className="text-brand-contrast/60">
            ↵
          </Kbd>
        </Button>
      </form>
    </AuthPanel>
  );
}
