"use client";

import { useState } from "react";

import { SettingRow, SettingsCard, SettingsHeading } from "@/components/settings/settings-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notify } from "@/components/ui/toast";
import { formatDateFull } from "@/lib/format";
import { useSession } from "@/providers/session-provider";
import { updateProfile } from "@/services/api/account";

/**
 * Who you are.
 *
 * The name is editable and the email is not, which is the shape of nearly every
 * account: changing an address is a verification flow, not a text field, and
 * offering it as one would be a promise the product cannot keep. So it sits
 * beside the route that actually changes it.
 */
export function ProfileSettings() {
  const session = useSession();
  const [name, setName] = useState(session.name);
  const [saving, setSaving] = useState(false);
  const dirty = name.trim() !== session.name && name.trim().length > 0;

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile(name.trim());
      session.update(updated);
      notify({ title: "Profile updated" });
    } catch (error) {
      notify({ title: error.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SettingsHeading
        title="Profile"
        description="How you appear across DataDock and on the files you share."
      />

      <SettingsCard
        footer={
          <>
            <Button variant="ghost" disabled={!dirty} onClick={() => setName(session.name)}>
              Reset
            </Button>
            {/* Disabled until something has actually changed. A Save that is
                always available invites the click that does nothing. */}
            <Button disabled={!dirty} loading={saving} onClick={save}>
              Save changes
            </Button>
          </>
        }
      >
        <SettingRow
          label="Avatar"
          hint="A picture helps collaborators recognise your files at a glance."
        >
          <span
            aria-hidden="true"
            className="order-first grid size-14 shrink-0 place-items-center rounded-full bg-brand-tint text-xl font-semibold text-brand ring-1 ring-brand/25 ring-inset sm:order-none"
          >
            {session.initials}
          </span>
        </SettingRow>

        <SettingRow
          label="Name"
          hint="Shown on shared files and in activity."
          htmlFor="profile-name"
        >
          <Input
            id="profile-name"
            size="lg"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full sm:w-72"
          />
        </SettingRow>

        <SettingRow
          label="Email"
          hint="Used to sign in and for account notices. Changing it needs verification."
        >
          <p className="text-md text-muted-foreground">{session.email}</p>
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Account">
        <SettingRow
          label="Plan"
          control={<span className="text-md text-foreground">{session.plan}</span>}
        />
        <SettingRow
          label="Member since"
          control={
            <span className="text-md text-muted-foreground">
              {formatDateFull(session.createdAt)}
            </span>
          }
        />
        <SettingRow
          label="Account ID"
          hint="Quote this if you contact support."
          control={<span className="font-mono text-base text-dim">{session.id}</span>}
        />
      </SettingsCard>

    </>
  );
}
