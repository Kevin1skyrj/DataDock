"use client";

import { useEffect, useState } from "react";

import { SettingRow, SettingsCard, SettingsHeading } from "@/components/settings/settings-parts";
import { formatBytes } from "@/lib/format";
import { getStorageSummary } from "@/services/files";

export function BillingSettings() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getStorageSummary().then(setSummary).catch(() => setSummary(null));
  }, []);

  const occupied = summary ? summary.used + summary.trashed : 0;

  return (
    <>
      <SettingsHeading
        title="Billing"
        description="Your current DataDock plan and storage allowance."
      />

      <SettingsCard title="Current plan">
        <SettingRow label="Plan" control={<span className="text-md text-foreground">Free</span>} />
        <SettingRow
          label="Storage used"
          control={
            <span className="text-md text-muted-foreground">
              {summary ? `${formatBytes(occupied)} of ${formatBytes(summary.quota)}` : "Loading…"}
            </span>
          }
        />
        <SettingRow
          label="Paid plans"
          hint="Pro and Premium checkout will become available with the Razorpay integration."
          control={<span className="text-sm text-dim">Coming next</span>}
        />
      </SettingsCard>
    </>
  );
}
