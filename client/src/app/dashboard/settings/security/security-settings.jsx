"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { PasswordField } from "@/components/auth/password-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { SettingRow, SettingsCard, SettingsHeading } from "@/components/settings/settings-parts";
import { ProviderMark } from "@/components/upload/provider-mark";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { notify } from "@/components/ui/toast";
import { currentPasswordRule, newPasswordRule } from "@/lib/validation/auth";
import { useSession } from "@/providers/session-provider";
import { changePassword, logoutAll } from "@/services/auth";
import { z } from "zod";

const passwordSchema = z
  .object({
    current: currentPasswordRule,
    next: newPasswordRule,
  })
  .refine((values) => values.current !== values.next, {
    // The one check a password form genuinely needs beyond length: silently
    // accepting the same password again looks like it worked and changes
    // nothing, which is the worst outcome for a security control.
    path: ["next"],
    message: "That is the password you already have.",
  });

export function SecuritySettings() {
  const session = useSession();
  const router = useRouter();
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    mode: "onTouched",
    defaultValues: { current: "", next: "" },
  });

  const submitPasswordChange = async ({ current, next }) => {
    try {
      await changePassword({
        currentPassword: current,
        newPassword: next,
      });

      reset();
      notify({
        title: "Password changed",
        description: "Other sessions have been signed out.",
      });
    } catch (error) {
      if (error.field) {
        setError(error.field, { message: error.message });
      } else {
        setError("root", { message: error.message });
      }
    }
  };

  const signOutAllDevices = async () => {
    setLoggingOutAll(true);

    try {
      await logoutAll();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setLoggingOutAll(false);
      notify({
        title: "Could not sign out",
        description: error.message,
        type: "error",
      });
    }
  };

  return (
    <>
      <SettingsHeading
        title="Security"
        description="How you sign in, and what is signed in right now."
      />

      <form onSubmit={handleSubmit(submitPasswordChange)}>
        <SettingsCard
          title="Password"
          description="Changing it signs out every other device."
          footer={
            <Button type="submit" loading={isSubmitting}>
              Change password
            </Button>
          }
        >
          <div className="flex flex-col gap-4 px-5 py-4">
            {errors.root ? (
              <p role="alert" className="text-sm text-error">
                {errors.root.message}
              </p>
            ) : null}
            <PasswordField
              label="Current password"
              autoComplete="current-password"
              className="max-w-sm"
              error={errors.current?.message}
              {...register("current")}
            />

            <PasswordField
              label="New password"
              autoComplete="new-password"
              className="max-w-sm"
              error={errors.next?.message}
              {...register("next")}
            >
              <PasswordStrength control={control} name="next" />
            </PasswordField>
          </div>
        </SettingsCard>
      </form>

      <SettingsCard title="Connected accounts">
        <SettingRow
          label="Google"
          hint={`Connected as ${session.email}. Used for one-tap sign in.`}
          control={
            <Button variant="secondary" size="sm">
              Disconnect
            </Button>
          }
        >
          <ProviderMark id="google-drive" className="order-first size-5 sm:order-none" />
        </SettingRow>
      </SettingsCard>

      <SettingsCard
        title="Two-factor authentication"
        description="A code from your phone, on top of your password."
      >
        <SettingRow
          label="Authenticator app"
          hint={
            twoFactor
              ? "On. You will be asked for a code when signing in from a new device."
              : "Off. Anyone with your password can sign in."
          }
          control={
            <Switch
              checked={twoFactor}
              onCheckedChange={(next) => {
                setTwoFactor(next);
                notify({
                  title: next ? "Two-factor turned on" : "Two-factor turned off",
                  type: next ? undefined : "error",
                });
              }}
              aria-label="Two-factor authentication"
            />
          }
        />

        {twoFactor ? (
          <SettingRow
            label="Recovery codes"
            hint="Ten single-use codes for when your phone is not to hand. Store them somewhere safe."
            control={
              <Button variant="secondary" size="sm">
                View codes
              </Button>
            }
          />
        ) : null}
      </SettingsCard>

      <SettingsCard
        title="Active sessions"
        description="End every active session for this account, including this browser."
      >
        <SettingRow
          label="Sign out on all devices"
          hint="You will need to enter your email and password again on every device."
          control={
            <Button
              variant="destructive"
              size="sm"
              loading={loggingOutAll}
              onClick={signOutAllDevices}
            >
              <LogOut className="size-3.5" />
              Sign out everywhere
            </Button>
          }
        />
      </SettingsCard>
    </>
  );
}
