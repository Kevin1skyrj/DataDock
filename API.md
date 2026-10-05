# DataDock API

Base path: `/api/v1`. Authenticated requests use the signed `datadock_session`
cookie and mutating browser requests must pass DataDock's CSRF origin checks.

All JSON responses use `{ success, data }` or
`{ success: false, error: { code, message } }`.

## Main resources

- `GET /health` checks MongoDB, Redis and S3. It returns `503` if any required
  dependency is unavailable.
- `/auth` provides registration, verification, login, password recovery,
  sessions, profile/preferences and `DELETE /auth/me` account deletion.
- `/items` provides paginated file/folder listings and item operations. Pass
  `limit` (1–100) and the returned `nextCursor` as `cursor`.
- `/trash` provides recursive trash, restore, permanent deletion and emptying.
- `/uploads` provides presigned upload intents and verified completion.
- `/shares` opens public file and folder links; authenticated share creation,
  updates and revocation live under `/items/:itemId/share`.
- `/search` provides paginated search results and facets.
- `/imports/google-drive` manages Drive connections and persistent import jobs.
- `/billing` provides plans, current billing, subscription checkout,
  verification and cancellation. Razorpay webhooks use
  `/api/v1/billing/webhook`.
- `/notifications` provides paginated in-app notifications and read state.

## Destructive operations

`DELETE /auth/me` requires `{ "confirmation": "DELETE" }`. Password accounts
must also send the current password. Deletion first cancels provider
subscriptions, revokes the Drive connection and removes S3 objects; only then
does it remove account metadata and sessions.

`DELETE /trash` and `DELETE /trash/all` permanently remove both metadata and S3
objects. Moving a folder to trash includes its complete descendant tree.

