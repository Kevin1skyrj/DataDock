"use client";

import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { SettingRow, SettingsCard, SettingsHeading } from "@/components/settings/settings-parts";
import { Switch } from "@/components/ui/switch";
import { NOTIFICATION_DEFAULTS, NOTIFICATION_GROUPS } from "@/constants/settings";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/services/api/account";

/**
 * What we would email about.
 *
 * Each switch saves the moment it moves, which is why there is no Save button —
 * a preferences page with unsaved switches is a page people leave thinking they
 * changed something.
 *
 * Security alerts are marked rather than locked. Turning them off is how an
 * account takeover goes unnoticed, but it is still the account holder's choice,
 * and disabling the control would be paternalistic about their own account.
 */
export function NotificationSettings() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getNotificationPreferences().then((saved) => {
      if (!cancelled) setSettings({ ...NOTIFICATION_DEFAULTS, ...saved });
    });
    return () => { cancelled = true; };
  }, []);

  const change = async (id, enabled) => {
    setSettings((current) => ({ ...current, [id]: enabled }));
    try {
      const saved = await updateNotificationPreferences({ [id]: enabled });
      setSettings((current) => ({ ...current, ...saved }));
    } catch {
      setSettings((current) => ({ ...current, [id]: !enabled }));
    }
  };

  return (
    <>
      <SettingsHeading
        title="Notifications"
        description="Sent to your account email. Changes save as you make them."
      />

      {NOTIFICATION_GROUPS.map((group) => (
        <SettingsCard key={group.id} title={group.label}>
          {group.items.map((item) => (
            <SettingRow
              key={item.id}
              label={
                item.sensitive ? (
                  <span className="flex items-center gap-1.5">
                    {item.label}
                    <ShieldAlert className="size-3.5 text-warning" aria-label="Recommended" />
                  </span>
                ) : (
                  item.label
                )
              }
              hint={item.hint}
              control={
                <Switch
                  checked={settings?.[item.id] ?? NOTIFICATION_DEFAULTS[item.id]}
                  disabled={!settings}
                  onCheckedChange={(next) => change(item.id, next)}
                  aria-label={item.label}
                />
              }
            />
          ))}
        </SettingsCard>
      ))}
    </>
  );
}
