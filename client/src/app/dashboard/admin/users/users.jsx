"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ShieldBan, Trash2 } from "lucide-react";

import { PageContainer } from "@/components/dashboard/page-container";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { notify } from "@/components/ui/toast";
import { useSession } from "@/providers/session-provider";
import {
  changeAdminUserRole,
  deleteAdminUser,
  listAdminUsers,
  logoutAdminUser,
  permanentlyDeleteAdminUser,
  unblockAdminUser,
} from "@/services/api/admin-users";

const STATUS_LABELS = { active: "Active users", deleted: "Blocked users" };

export function AdminUsers() {
  const session = useSession();
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [busyId, setBusyId] = useState(null);
  const [pending, setPending] = useState(null);

  const load = useCallback(async () => {
    try {
      setResult(await listAdminUsers({ page, search, status }));
    } catch (error) {
      notify({ title: "Could not load users", description: error.message, type: "error" });
    }
  }, [page, search, status]);

  useEffect(() => {
    let cancelled = false;

    listAdminUsers({ page, search, status })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((error) => {
        if (!cancelled) {
          notify({ title: "Could not load users", description: error.message, type: "error" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, search, status]);

  const ask = (user, action) => setPending({ user, ...action });

  const confirmAction = async () => {
    if (!pending) return;
    setBusyId(pending.user.id);

    try {
      await pending.run();
      notify({ title: pending.success });
      setPending(null);
      await load();
    } catch (error) {
      notify({ title: "Action failed", description: error.message, type: "error" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageContainer
      toolbar={
        <div className="flex w-full flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h1 className="text-md font-medium text-foreground">User administration</h1>
            <p className="text-sm text-dim">Only the DataDock owner can access this page.</p>
          </div>
          <Input
            aria-label="Search users"
            placeholder="Search name or email"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="w-full sm:w-64"
          />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>
              {STATUS_LABELS[status]} <ChevronDown />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <DropdownMenuItem key={value} onClick={() => { setStatus(value); setPage(1); }}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
      flush
    >
      <div className="grid gap-3 border-b border-line bg-surface/40 p-4 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-4">
          <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
            <ShieldBan className="size-4 text-warning" /> Block account
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Soft delete: login is disabled and sessions close, but the account and data remain so
            the owner can unblock it later.
          </p>
        </div>
        <div className="rounded-lg border border-error/25 bg-error/5 p-4">
          <div className="mb-1 flex items-center gap-2 font-medium text-error">
            <Trash2 className="size-4" /> Delete permanently
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Hard delete: available only after blocking. It permanently removes the account and its
            records and cannot be undone.
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-3xl border-collapse text-left">
          <thead className="sticky top-0 bg-overlay text-sm text-dim">
            <tr className="border-b border-line">
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {(result?.users ?? []).map((user) => {
              const protectedUser = user.id === session.id || user.role === "owner";
              const busy = busyId === user.id;

              return (
                <tr key={user.id} className="text-base">
                  <td className="px-5 py-3">
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-sm text-dim">{user.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        disabled={protectedUser || busy || Boolean(user.deletedAt)}
                        render={<Button variant="secondary" size="sm" />}
                      >
                        <span className="capitalize">{user.role}</span> <ChevronDown />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {["user", "admin"].map((role) => (
                          <DropdownMenuItem
                            key={role}
                            onClick={() => ask(user, {
                              title: `Change role to ${role}?`,
                              body: `${user.email} will receive ${role} permissions.`,
                              label: "Change role",
                              variant: "primary",
                              success: "Role updated",
                              run: () => changeAdminUserRole(user.id, role),
                            })}
                          >
                            <span className="capitalize">{role}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {user.deletedAt ? "Blocked" : user.verified ? "Verified" : "Unverified"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {user.deletedAt ? (
                        <>
                          <Button variant="secondary" size="sm" disabled={protectedUser || busy}
                            onClick={() => ask(user, {
                              title: "Unblock this account?",
                              body: `${user.email} will be allowed to sign in again.`,
                              label: "Unblock account", variant: "primary", success: "User unblocked",
                              run: () => unblockAdminUser(user.id),
                            })}>
                            Unblock
                          </Button>
                          <Button variant="destructive" size="sm" disabled={protectedUser || busy}
                            onClick={() => ask(user, {
                              title: "Permanently delete this account?",
                              body: `${user.email} and all associated records will be removed. This cannot be undone.`,
                              label: "Delete permanently", success: "User permanently deleted",
                              run: () => permanentlyDeleteAdminUser(user.id),
                            })}>
                            Delete permanently
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" disabled={protectedUser || busy}
                            onClick={() => ask(user, {
                              title: "Sign out this user?",
                              body: `All active sessions for ${user.email} will close. The account remains active.`,
                              label: "Sign out user", variant: "primary", success: "User signed out",
                              run: () => logoutAdminUser(user.id),
                            })}>
                            Sign out
                          </Button>
                          <Button variant="destructive" size="sm" disabled={protectedUser || busy}
                            onClick={() => ask(user, {
                              title: "Block this account?",
                              body: `${user.email} will be signed out and unable to log in. Their data is retained and this can be reversed.`,
                              label: "Block account", success: "User blocked",
                              run: () => deleteAdminUser(user.id),
                            })}>
                            Block
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {result && result.users.length === 0 ? (
          <p className="p-8 text-center text-base text-muted-foreground">No users found.</p>
        ) : null}
      </div>

      {result?.totalPages > 1 ? (
        <footer className="flex items-center justify-between border-t border-line px-5 py-3">
          <span className="text-sm text-dim">{result.total} users</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="ghost" size="sm" disabled={page === result.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </footer>
      ) : null}

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.title}
        body={pending?.body}
        confirmLabel={pending?.label}
        confirmVariant={pending?.variant}
        loading={Boolean(pending && busyId === pending.user.id)}
        onConfirm={confirmAction}
        onClose={() => setPending(null)}
      />
    </PageContainer>
  );
}
