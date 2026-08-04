"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/**
 * Naming something — a new folder, or an existing item.
 *
 * One dialog for both, because they are the same interaction with a different
 * starting value and a different verb. A separate rename dialog and create
 * dialog would be two places for the same "empty name" rule to be enforced
 * differently.
 *
 * Inline rename in the row is the desktop-native version of this and is worth
 * doing later. A dialog is what works identically in the table and the grid
 * today, from one implementation, with focus and escape handling already solved
 * by the primitive.
 */
export function NameDialog({ open, title, label, action, initialValue = "", onSubmit, onClose }) {
  const [value, setValue] = useState(initialValue);
  const [touched, setTouched] = useState(false);

  // Keyed by the caller, so opening it for a different item remounts it with
  // that item's name rather than keeping whatever was typed last time.
  const trimmed = value.trim();
  const invalid = touched && !trimmed;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent size="sm">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setTouched(true);
            if (!trimmed) return;
            onSubmit(trimmed);
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <DialogBody className="pb-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="name-dialog-field" className="text-base font-medium text-muted-foreground">
                {label}
              </label>
              <Input
                id="name-dialog-field"
                size="lg"
                autoFocus
                value={value}
                invalid={invalid}
                onChange={(event) => setValue(event.target.value)}
                onBlur={() => setTouched(true)}
                // Selects the stem, not the extension — renaming a file almost
                // never means changing what kind of file it is.
                onFocus={(event) => {
                  const dot = event.target.value.lastIndexOf(".");
                  event.target.setSelectionRange(0, dot > 0 ? dot : event.target.value.length);
                }}
              />
              {invalid ? (
                <p role="alert" className="text-base text-error">
                  A name cannot be empty.
                </p>
              ) : null}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{action}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
