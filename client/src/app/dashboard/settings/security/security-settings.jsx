"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Laptop, LogOut, Smartphone } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { PasswordField } from "@/components/auth/password-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { SettingRow, SettingsCard, SettingsHeading } from "@/components/settings/settings-parts";
import { ProviderMark } from "@/components/upload/provider-mark";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { notify } from "@/components/ui/toast";
import { useMounted } from "@/hooks/use-mounted";
import { formatDate } from "@/lib/format";
import { currentPasswordRule, newPasswordRule } from "@/lib/validation/auth";
import { useSession } from "@/providers/session-provider";
import { z } from "zod";

/**
 * Sessions, as a real product would list them.
 *
 * The current one is marked and cannot be revoked from here — signing yourself
 * out of the page you are looking at is what Sign out is for, and offering it
 * twice under different words is how people end up doing it by accident.
 */
const SESSIONS = [
  {
    id: "ses_current",
    device: "Chrome on Windows",
    kind: "desktop",
    location: "Bengaluru, India",
    lastActive: "2026-08-04T09:10:00.000Z",
    current: true,
  },
  {
    id: "ses_mac",
    device: "Safari on macOS",
    kind: "desktop",
    location: "Bengaluru, India",
    lastActive: "2026-08-02T18:40:00.000Z",
  },
  {
    id: "ses_phone",
    device: "DataDock for iOS",
    kind: "mobile",
    location: "Mumbai, India",
    lastActive: "2026-07-28T07:15:00.000Z",
  },
];

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
  const [sessions, setSessions] = useState(SESSIONS);
  const [twoFactor, setTwoFactor] = useState(false);
  // "Last active" resolves against the local clock and timezone, so the server
  // cannot render it — it would say "Today" on the wrong day for anyone not
  // sitting beside the machine. The location holds the line until it arrives.
  const mounted = useMounted();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    mode: "onTouched",
    defaultValues: { current: "", next: "" },
  });

  const changePassword = async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    reset();
    notify({ title: "Password changed", description: "Other sessions have been signed out." });
  };

  return (
    <>
      <SettingsHeading
        title="Security"
        description="How you sign in, and what is signed in right now."
      />

      <form onSubmit={(event) => handleSubmit(changePassword)(event)}>
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
        description="Signed in on these devices."
        footer={
          sessions.length > 1 ? (
            <Button
              variant="ghost"
              onClick={() => {
                setSessions((current) => current.filter((session) => session.current));
                notify({ title: "Signed out everywhere else" });
              }}
            >
              Sign out everywhere else
            </Button>
          ) : null
        }
      >
        {sessions.map((session) => (
          <SettingRow
            key={session.id}
            label={
              <span className="flex items-center gap-2">
                {session.device}
                {session.current ? (
                  <span className="rounded-sm bg-brand-tint px-1.5 py-0.5 text-2xs text-brand">
                    This device
                  </span>
                ) : null}
              </span>
            }
            hint={
              mounted
                ? `${session.location} · last active ${formatDate(session.lastActive)}`
                : session.location
            }
            control={
              session.current ? null : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSessions((current) =>
                      current.filter((entry) => entry.id !== session.id),
                    );
                    notify({ title: `Signed out of ${session.device}` });
                  }}
                >
                  <LogOut className="size-3.5" />
                  Sign out
                </Button>
              )
            }
          >
            {session.kind === "mobile" ? (
              <Smartphone className="order-first size-4 shrink-0 text-dim sm:order-none" />
            ) : (
              <Laptop className="order-first size-4 shrink-0 text-dim sm:order-none" />
            )}
          </SettingRow>
        ))}
      </SettingsCard>
    </>
  );
}
