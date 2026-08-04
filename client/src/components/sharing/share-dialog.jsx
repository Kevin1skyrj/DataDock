"use client";

import { Check, Copy, Globe, Link2, Lock } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notify } from "@/components/ui/toast";
import { FileIcon } from "@/components/workspace/file-icon";
import { formatBytes, formatDate } from "@/lib/format";
import {
  createShare,
  listShareRecipients,
  revokeShare,
  updateShare,
} from "@/services/files";
import { cn } from "@/lib/utils";

const ACCESS = [
  { id: "view", label: "Can view", hint: "Download and read" },
  { id: "comment", label: "Can comment", hint: "Read and leave notes" },
  { id: "edit", label: "Can edit", hint: "Replace and rename" },
];

const EXPIRY = [
  { id: null, label: "Never" },
  { id: 1, label: "1 day" },
  { id: 7, label: "7 days" },
  { id: 30, label: "30 days" },
];

const inDays = (days) =>
  days == null ? null : new Date(Date.now() + days * 86_400_000).toISOString();

function Choice({ label, value, hint, options, onSelect, disabled }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="secondary" size="sm" disabled={disabled} className="justify-between">
            {value}
          </Button>
        }
      />
      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {options.map((option) => (
            <DropdownMenuItem key={String(option.id)} onClick={() => onSelect(option.id)}>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{option.label}</span>
                {option.hint ? (
                  <span className="truncate text-2xs text-dim">{option.hint}</span>
                ) : null}
              </span>
              {option.label === value ? <Check className="size-3.5 text-brand" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Sharing a file.
 *
 * The share is the state, not the dialog. Opening this reads what already
 * exists; every control writes through the service and reconciles with what
 * comes back. Nothing is staged behind a Save button, because a permission
 * someone thinks they changed and did not is worse than any amount of
 * round-tripping — and because "Save" on a sharing dialog is exactly where
 * people close the window assuming it took.
 *
 * `scope` and `access` are separate on purpose. Scope is *who the token is
 * checked against* — anyone with the URL, or only named people. Access is what
 * they may do once past it. Collapsing them into one dropdown is how products
 * end up unable to express "my team can edit, and here is a read-only link".
 */
export function ShareDialog({ item, open, onClose, onChanged }) {
  /**
   * What the file said when the dialog opened, plus whatever has been changed
   * since — tagged with the file it belongs to.
   *
   * Derived rather than copied into state by an effect. The tag is what makes
   * opening the dialog on a second file show that file's terms instead of the
   * previous one's, with nothing to reset and no effect to forget.
   */
  const [override, setOverride] = useState(null);
  // Both guards are load-bearing. With optional chaining alone, a null override
  // and a null item both yield `undefined` for `id`, the comparison passes, and
  // the null override is dereferenced — which is exactly what happens while the
  // dialog is mounted but closed.
  const share =
    override && item && override.id === item.id ? override.share : (item?.share ?? null);

  const [recipients, setRecipients] = useState({ id: null, people: [] });
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !item) return undefined;
    let cancelled = false;
    listShareRecipients(item.id).then((people) => {
      if (!cancelled) setRecipients({ id: item.id, people });
    });
    return () => {
      cancelled = true;
    };
  }, [open, item]);

  if (!item) return null;

  const people = recipients.id === item.id ? recipients.people : [];

  const url = share ? `https://datadock.app/s/${share.token ?? share.id}` : "";
  const access = ACCESS.find((option) => option.id === (share?.access ?? "view"));

  const run = async (work) => {
    setBusy(true);
    try {
      const next = await work();
      setOverride({ id: item.id, share: next ?? null });
      onChanged?.();
    } catch (failure) {
      notify({ title: failure.message, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard access can be refused. The link is on screen and selectable,
      // so this is a missing convenience rather than a failure worth alarming
      // anyone about.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <p className="flex items-center gap-2 text-base text-muted-foreground">
            <FileIcon kind={item.kind} />
            <span className="min-w-0 truncate">{item.name}</span>
          </p>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-5 pb-2">
          {/* What the recipient sees before they commit to a download. The one
              piece of this dialog that is about *their* experience. */}
          {share ? (
            <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-bg-deep">
                <FileIcon kind={item.kind} className="size-5" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-base text-foreground">{item.name}</span>
                <span className="truncate text-xs text-dim">
                  DataDock · {formatBytes(item.size)} · {access.label.toLowerCase()}
                </span>
              </div>
              <span className="shrink-0 text-xs text-dim">{share.viewCount ?? 0} views</span>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-md text-foreground">
                {share?.scope === "private" ? (
                  <Lock className="size-4 text-dim" />
                ) : share ? (
                  <Globe className="size-4 text-brand" />
                ) : (
                  <Lock className="size-4 text-dim" />
                )}
                {share
                  ? share.scope === "private"
                    ? "Only invited people"
                    : "Anyone with the link"
                  : "Not shared"}
              </span>

              <Button
                variant={share ? "ghost" : "primary"}
                size="sm"
                loading={busy}
                onClick={() =>
                  run(() => (share ? revokeShare(item.id).then(() => null) : createShare(item.id)))
                }
              >
                {share ? "Stop sharing" : "Create link"}
              </Button>
            </div>

            {share ? (
              <p className="text-sm text-dim">
                {share.scope === "private"
                  ? "Only the people listed below can open this."
                  : "Anyone who has the link can open this without signing in."}
              </p>
            ) : (
              <p className="text-sm text-dim">Only you can see this file.</p>
            )}
          </div>

          {share ? (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-surface p-1.5 pl-3">
                <Link2 className="size-4 shrink-0 text-dim" />
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-muted-foreground">
                  {url}
                </span>
                <Button size="sm" variant={copied ? "secondary" : "primary"} onClick={copy}>
                  {copied ? <Check /> : <Copy />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm text-dim">Who</span>
                  <Choice
                    label="Who can open"
                    value={share.scope === "private" ? "Invited only" : "Anyone with link"}
                    options={[
                      { id: "link", label: "Anyone with link" },
                      { id: "private", label: "Invited only" },
                    ]}
                    disabled={busy}
                    onSelect={(scope) => run(() => updateShare(item.id, { scope }))}
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm text-dim">Permission</span>
                  <Choice
                    label="What they can do"
                    value={access.label}
                    options={ACCESS}
                    disabled={busy}
                    onSelect={(value) => run(() => updateShare(item.id, { access: value }))}
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm text-dim">Expires</span>
                  <Choice
                    label="Link expires"
                    value={share.expiresAt ? formatDate(share.expiresAt) : "Never"}
                    options={EXPIRY}
                    disabled={busy}
                    onSelect={(days) =>
                      run(() => updateShare(item.id, { expiresAt: inDays(days) }))
                    }
                  />
                </label>
              </div>

              {people.length ? (
                <div className="flex flex-col gap-2">
                  <p className="text-2xs tracking-widest text-dim uppercase">People with access</p>

                  <ul className="flex flex-col gap-1">
                    {people.map((person) => (
                      <li key={person.id} className="flex items-center gap-2.5 py-1">
                        <span
                          aria-hidden="true"
                          className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-tint text-2xs font-semibold text-brand ring-1 ring-brand/25 ring-inset"
                        >
                          {person.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-base text-foreground">{person.name}</span>
                          <span className="truncate text-xs text-dim">{person.email}</span>
                        </span>
                        <span className="shrink-0 text-xs text-dim">
                          {ACCESS.find((option) => option.id === person.access)?.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
