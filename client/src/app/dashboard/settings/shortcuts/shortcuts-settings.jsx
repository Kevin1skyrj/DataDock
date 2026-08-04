"use client";

import { SettingsCard, SettingsHeading } from "@/components/settings/settings-parts";
import { Kbd } from "@/components/ui/kbd";
import { SHORTCUT_GROUPS } from "@/constants/settings";
import { useShortcut } from "@/hooks/use-platform";

/**
 * Every key the product binds.
 *
 * Read from the same constant the rest of the application is written against,
 * so this page cannot drift into teaching keys that do nothing — which is the
 * one failure mode a shortcuts page has, and the reason most of them are worse
 * than useless within a release or two.
 *
 * `mod` is substituted at render, so the page is correct on whichever keyboard
 * is reading it rather than assuming a Mac.
 */
export function ShortcutsSettings() {
  // The hook formats a whole chord; here only the modifier glyph is wanted, so
  // the key is stripped back off.
  const modifier = useShortcut("").trim();

  return (
    <>
      <SettingsHeading
        title="Keyboard shortcuts"
        description="DataDock is built to be driven from the keyboard. These are all of them."
      />

      {SHORTCUT_GROUPS.map((group) => (
        <SettingsCard key={group.id} title={group.label}>
          <ul className="divide-y divide-line/60">
            {group.items.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between gap-6 px-5 py-2.5"
              >
                <span className="min-w-0 text-base text-muted-foreground">{item.label}</span>

                <span className="flex shrink-0 items-center gap-1">
                  {item.keys.map((key, index) => (
                    <Kbd key={`${key}-${index}`} variant="key">
                      {key === "mod" ? modifier : key}
                    </Kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </SettingsCard>
      ))}
    </>
  );
}
