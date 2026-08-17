# Role-Based Access Control (RBAC) — DataDock Notes

## 1. What is RBAC?

Role-Based Access Control authorizes actions according to a role assigned to a user. A role groups permissions so authorization rules are not repeated for every individual user.

DataDock currently has three global roles:

- `user`: can use their own DataDock account and resources.
- `admin`: can perform user-administration operations in addition to normal authenticated operations.
- `owner`: the single product owner who alone may enumerate and manage user accounts.

Authentication answers **“Who are you?”**. Authorization answers **“Are you allowed to do this?”**. RBAC is one authorization strategy.

## 2. DataDock authorization flow

For an admin request, middleware executes in this order:

1. `authenticate` reads the signed session cookie.
2. The raw session token is hashed.
3. MongoDB is queried for an active session.
4. The associated user is loaded.
5. Deleted users are rejected.
6. The user ID and normalized role are attached to `req.user`.
7. `authorizeRoles("admin")` checks the role.
8. The controller runs only after both checks pass.

The order matters. Role authorization cannot work safely before identity has been established.

## 3. Why separate `owner` from `admin`?

The owner is a trust boundary, not merely a stronger UI badge. Only the owner can access the complete user directory, change roles, block or unblock accounts, force logout, and permanently delete blocked accounts. Admin remains available for future operational permissions without automatically receiving private account-directory access.

File-level concepts such as owner, editor and viewer are not global roles. They describe a relationship between a user and one resource, so they will later require ownership checks or relationship-based authorization.

## 4. Where roles are stored

The global role is stored on each MongoDB user document:

```js
{
  role: "user"
}
```

Both password registration and Google registration assign `user` explicitly. Startup migration assigns `user` to older documents that do not have a role. Missing roles are also treated as `user`, following the principle of least privilege.

The first administrator is assigned manually in MongoDB during development. A public “become admin” endpoint must never exist.

## 5. Authorization middleware

The middleware is parameterized so the same implementation can protect different routes:

```js
authorizeRoles("admin")
```

It returns HTTP `403 Forbidden` when the authenticated user lacks the required role.

Important distinction:

- `401 Unauthorized`: the request has no valid authentication.
- `403 Forbidden`: identity is known, but that identity lacks permission.

## 6. Admin endpoints implemented

All routes begin with `/api/v1/admin/users` and run both authentication and owner-role middleware.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/` | Paginated user list with search and filters |
| `PATCH` | `/:userId/role` | Change a user between `user` and `admin` |
| `DELETE` | `/:userId/sessions` | Force a user to log out everywhere |
| `DELETE` | `/:userId` | Soft-delete a user and revoke sessions |
| `POST` | `/:userId/unblock` | Restore a blocked user |
| `DELETE` | `/:userId/permanent` | Permanently remove a blocked user and owned data |

The list response uses an explicit public projection. It never returns password hashes, Google IDs, reset tokens, OTP data or session tokens.

## 7. Soft deletion

Soft deletion keeps the user document and adds:

```js
{
  deletedAt: new Date(),
  deletedBy: adminUserId
}
```

Why use it?

- Preserves file ownership references.
- Supports investigation and future recovery.
- Avoids broken relations caused by immediate physical deletion.
- Retains administrative history.

A soft-deleted user is treated as blocked. They cannot log in, use an old session, reset a password, verify an email or return through Google OAuth. All active sessions are deleted immediately. The owner may remove the deletion fields to unblock the account.

Permanent deletion is separate and is allowed only after blocking. It removes the user, sessions, OTPs, password-reset authorizations and owned items. Requiring the blocked state creates a deliberate two-step destructive workflow.

Soft deletion is not archival by itself. A future retention policy should define when permanent deletion occurs and how owned files are handled.

## 8. Preventing dangerous self-actions

An administrator cannot:

- Change their own role through user administration.
- Force-logout themselves through the target-user endpoint.
- Delete themselves through the admin endpoint.

Self-service logout and account deletion are separate flows. Separating them prevents an administrator from accidentally removing the permissions needed to manage the system.

## 9. Role changes and sessions

Changing a user’s role deletes that user’s sessions. They must log in again before the new role takes effect.

This prevents an existing session from continuing with stale authorization data. DataDock still reloads the current user from MongoDB for every authenticated request, so deleted status and roles are not trusted from a client-controlled value.

## 10. Role-based UI rendering

The frontend receives `role` from `/auth/me` through the server-validated session provider.

Only the owner sees the Administration navigation and Users page. The page also performs a server-side role check before rendering.

## 10.1 Public links are not RBAC

An expiring public share link is a capability: possession of a high-entropy token grants the configured access until revocation or expiry. The backend still verifies that only the item owner may create, update or revoke that capability. Opening a valid public link does not make the visitor a DataDock user and does not assign a role.

UI hiding improves usability, but it is not security. An attacker can construct HTTP requests without using the interface. Backend middleware remains the actual authorization boundary.

## 11. RBAC versus other authorization models

### ACL

An Access Control List stores permissions directly on a resource, such as a file listing users who may read it.

### ABAC

Attribute-Based Access Control evaluates attributes such as department, subscription plan, resource sensitivity, time or location.

### ReBAC

Relationship-Based Access Control evaluates relationships such as “Rajat owns Folder A” or “Team B can edit File C.” Google Zanzibar and OpenFGA are associated with this model.

### When DataDock may need ReBAC

Global admin access is a good RBAC use case. Shared-file and shared-folder permissions are better modeled as ownership or relationships. OpenFGA would be considered only when those relationships become complex enough to justify a dedicated authorization system.

## 12. Security principles demonstrated

- Deny by default.
- Use least privilege for missing or new roles.
- Enforce permissions on the server.
- Keep authentication and authorization separate.
- Validate IDs and role values.
- Prevent mass assignment of roles.
- Revoke sessions after role or account-status changes.
- Do not expose sensitive user fields.
- Use soft deletion when related records must remain consistent.
- Return `401` and `403` correctly.

## 13. Common interview questions

### What is the difference between authentication and authorization?

Authentication establishes identity. Authorization determines what that identity may do. Login is authentication; checking for the admin role is authorization.

### Why is checking the role in React insufficient?

The browser is controlled by the user. Hidden buttons can be restored and API requests can be sent directly. Only backend authorization protects data.

### Why use middleware for RBAC?

Middleware centralizes a cross-cutting policy, keeps controllers focused on application behavior and prevents inconsistent checks between endpoints.

### Why should authentication execute before role authorization?

The role check needs a trusted identity. A role supplied in request JSON, query parameters, local storage or an unsigned cookie is attacker-controlled.

### Why default a missing role to `user`?

It follows least privilege and safely supports older database records during migration.

### Why revoke sessions after changing a role?

It forces the user to establish a fresh session under the new authorization state and avoids stale privileges in systems that cache identity data.

### Why soft-delete users?

It preserves references, history and recovery options. The application must still exclude deleted users from authentication and normal queries.

### What is IDOR and how does authorization prevent it?

Insecure Direct Object Reference occurs when changing an ID in a request grants access to another user’s resource. Validating the ID format is not enough; the server must also verify ownership, permission or an appropriate administrative role.

### Is `admin` allowed to access every user file automatically?

Not unless product policy explicitly grants that permission. DataDock’s current admin role manages accounts, not file contents. Permissions should be scoped to concrete operations.

### When would you choose OpenFGA instead of simple RBAC?

When permissions depend on a large graph of users, teams, folders, files and inherited relationships. Two global roles do not justify that operational complexity.

## 14. Typical interview implementation exercise

When asked to implement an admin-only route:

1. Authenticate the request.
2. Load the user from a trusted server-side source.
3. Attach a normalized role to request context.
4. Run parameterized authorization middleware.
5. Validate route parameters and request body.
6. Execute the service operation.
7. Return a public DTO rather than the database document.
8. Test unauthenticated, forbidden, valid and edge-case requests.

Example route shape:

```js
router.patch(
  "/:userId/role",
  authenticate,
  authorizeRoles("admin"),
  changeUserRole,
);
```

## 15. Test checklist

- Unauthenticated admin request returns `401`.
- Authenticated ordinary user receives `403`.
- Admin receives a paginated, sanitized user list.
- New email and Google users receive role `user`.
- Older users receive role `user` after migration.
- Admin can promote or demote another user.
- Role change invalidates the target user’s sessions.
- Invalid roles and user IDs return `400`.
- Admin can force-logout another user.
- Admin cannot target themselves for restricted actions.
- Soft-deleted users disappear from the active list.
- Soft-deleted users cannot authenticate using password, OAuth or an old session.
- Sensitive authentication fields never appear in admin responses.

## 16. Future improvements

- Administrative audit logs.
- Rate limiting and security monitoring.
- Explicit permanent-deletion retention jobs.
- Last-admin safety rules if self-role restrictions change.
- Resource ownership and sharing authorization.
- OpenFGA only if relationship complexity warrants it.
