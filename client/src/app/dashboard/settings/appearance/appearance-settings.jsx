"use client";

import { Check } from "lucide-react";
import { useTheme } from "next-themes";

import {
  SegmentedControl,
  SettingRow,
  SettingsCard,
  SettingsHeading,
} from "@/components/settings/settings-parts";
import { Switch } from "@/components/ui/switch";
import { ACCENTS } from "@/constants/accents";
import { DENSITY_OPTIONS, THEME_OPTIONS } from "@/constants/settings";
import { useMounted } from "@/hooks/use-mounted";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  setDensity,
  setReducedMotionPreference,
  useDensity,
  useReducedMotionPreference,
} from "@/lib/preferences";
import { useAccent } from "@/providers/accent-provider";
import { cn } from "@/lib/utils";

/**
 * How the product looks.
 *
 * Every control here takes effect on the page you are looking at, immediately.
 * There is no Save button because there is nothing to save — you can see the
 * result while you are still deciding about it, which is the only sensible way
 * to choose a theme.
 */
export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const density = useDensity();
  const forced = useReducedMotionPreference();
  const systemReduced = usePrefersReducedMotion();
  const mounted = useMounted();

  return (
    <>
      <SettingsHeading
        title="Appearance"
        description="Changes apply straight away, and only on this device."
      />

      <SettingsCard title="Theme">
        <SettingRow
          label="Colour scheme"
          hint="System follows whatever your operating system is set to."
          control={
            <SegmentedControl
              label="Colour scheme"
              value={mounted ? theme : "dark"}
              options={THEME_OPTIONS}
              onChange={setTheme}
            />
          }
        />

        <SettingRow label="Accent" hint="Used for selection, links and primary buttons.">
          <div role="radiogroup" aria-label="Accent colour" className="flex flex-wrap gap-2">
            {ACCENTS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={accent === option.id}
                onClick={() => setAccent(option.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-base",
                  "transition-colors duration-150 ease-standard",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  accent === option.id
                    ? "border-brand/40 bg-brand-tint text-foreground"
                    : "border-line text-muted-foreground hover:border-line-2 hover:text-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className="size-3.5 rounded-full ring-1 ring-line-2"
                  style={{ background: option.swatch }}
                />
                {option.label}
                {accent === option.id ? <Check className="size-3.5 text-brand" /> : null}
              </button>
            ))}
          </div>
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="Layout">
        <SettingRow
          label="Density"
          hint="Compact removes padding from lists. The text size stays the same — a smaller font would make a dense list harder to read, which is the opposite of the point."
          control={
            <SegmentedControl
              label="Density"
              value={density}
              options={DENSITY_OPTIONS}
              onChange={setDensity}
            />
          }
        />
      </SettingsCard>

      <SettingsCard title="Motion">
        <SettingRow
          label="Always reduce motion"
          hint={
            systemReduced
              ? "Your system already asks for reduced motion, so this stays on."
              : "Turns off transitions and animations throughout DataDock."
          }
          control={
            <Switch
              checked={forced || systemReduced}
              disabled={systemReduced}
              onCheckedChange={setReducedMotionPreference}
              aria-label="Always reduce motion"
            />
          }
        />
      </SettingsCard>
    </>
  );
}
