"use client";

import { Check, Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCENTS } from "@/constants/accents";
import { useAccent } from "@/providers/accent-provider";

/**
 * Chooses the product's accent colour.
 *
 * A radio group rather than a list of buttons, because the accent is a single
 * choice from a set — that is what assistive technology should hear, and Base
 * UI wires the roving focus and checked state to match.
 *
 * The trigger icon reads `--brand` from the cascade, so it always reflects the
 * live accent without this component knowing any colour values.
 */
export function AccentPicker({ className }) {
  const { accent, setAccent } = useAccent();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" className={className} aria-label="Change accent colour">
            {/* Tinted with the live accent, so the control also reports the
                current choice without needing a second indicator. */}
            <Palette className="text-brand" />
          </Button>
        }
      />

      <DropdownMenuContent>
        {/* The label lives inside the radio group: Base UI reads its group
            context to wire aria-labelledby, and throws without it. */}
        <DropdownMenuRadioGroup value={accent} onValueChange={setAccent}>
          <DropdownMenuLabel>Accent</DropdownMenuLabel>

          {ACCENTS.map((option) => (
            <DropdownMenuRadioItem key={option.id} value={option.id}>
              <span
                aria-hidden="true"
                className="size-3.5 shrink-0 rounded-full ring-1 ring-line-2"
                style={{ background: option.swatch }}
              />
              <span className="flex-1">{option.label}</span>
              {accent === option.id ? <Check className="size-3.5 text-brand" /> : null}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
