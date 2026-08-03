"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Field } from "@/components/auth/field";
import { Button } from "@/components/ui/button";

/**
 * A password field that can be read back.
 *
 * The label changes with the state rather than the button carrying
 * `aria-pressed`: for a reveal toggle, what someone needs announced is the
 * action available to them, not the position of a switch.
 *
 * Visibility is local state and stays that way. It is not part of the form's
 * value, nothing outside this field has any business knowing it, and it should
 * reset the moment the field goes away.
 */
export function PasswordField(props) {
  const [visible, setVisible] = useState(false);

  return (
    <Field
      type={visible ? "text" : "password"}
      endSlot={
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          // Pulled into the field's own padding so the control sits on the
          // inside edge instead of inventing a second gutter.
          className="-mr-2 text-dim hover:bg-transparent hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((shown) => !shown)}
        >
          {visible ? <EyeOff /> : <Eye />}
        </Button>
      }
      {...props}
    />
  );
}
