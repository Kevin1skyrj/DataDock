# DataDock Project Interview Guide

> A technical explanation of DataDock for project discussions, resume screens, system-design follow-ups and backend interviews.

## 1. Thirty-second explanation

DataDock is a production-deployed cloud storage SaaS built with Next.js, Express, MongoDB Atlas, Redis and Amazon S3. Users can securely upload, organize, search, preview, share and import files from Google Drive. I implemented stateful authentication using opaque Redis sessions, direct-to-S3 uploads with presigned URLs, plan-based storage quotas, owner/user authorization and Razorpay subscriptions. It runs on AWS EC2 behind Nginx with PM2 process supervision, HTTPS, a custom domain and production OAuth/webhook integrations.

## 2. Two-minute explanation

I built DataDock to learn the engineering behind a real storage product rather than stopping at basic file CRUD.

The Next.js frontend provides a desktop-inspired file-browser experience. The Express backend follows a route-controller-service-model structure. MongoDB stores users, item metadata, shares, billing records and integration state; S3 stores the actual file bytes. Redis stores revocable sessions, per-user session indexes, upload intents and item-list cache versions.

For uploads, the client first requests an upload intent. The server validates the destination and enforces the user's quota and maximum file size. It returns a short-lived S3 presigned URL, so the browser uploads directly to S3. The client then calls a completion endpoint, and only after object verification does the API persist item metadata.

Authentication is stateful. DataDock generates a high-entropy opaque token, stores only its hash in Redis with a TTL and sends the raw token through a signed, HTTP-only cookie. This enables immediate logout, logout-all, server-controlled expiry and a maximum of three active sessions. Google login uses OpenID Connect but ultimately creates the same internal session.

The production application runs on Ubuntu EC2. PM2 manages Next.js and Express, Nginx reverse-proxies `datadock.me` and `api.datadock.me`, and Certbot manages HTTPS. MongoDB Atlas is the managed database, an EC2 IAM role authorizes private S3 access, and signature-verified Razorpay webhooks synchronize subscription state idempotently.

## 3. Problem and engineering scope

A storage platform involves more than saving blobs:

- Large request bodies can overload application servers.
- Binary objects and searchable metadata have different storage requirements.
- Folder trees introduce recursive operations and cycle risks.
- Private files need controlled preview, download and sharing.
- Storage usage must be calculated and limited reliably.
- Sessions must be secure, expirable and revocable.
- Payment providers retry webhooks and deliver events asynchronously.
- External OAuth tokens require secure storage and lifecycle handling.

DataDock addresses these boundaries in one end-to-end product.

## 4. Architecture

```text
User browser
    |
    | HTTPS
    v
Nginx reverse proxy on EC2
    |-------------------------------|
    v                               v
Next.js frontend :3000       Express API :4000
                                    |
              |---------------------|---------------------|
              v                     v                     v
        MongoDB Atlas         Redis on EC2          Private S3
        metadata/state       sessions/cache        file objects
              |                     |                     |
              |-------------- external services ---------|
                          Google · Resend · Razorpay
```

### Why these technologies?

- **Next.js:** routing, server rendering and a structured React application model.
- **Express:** explicit control over HTTP, middleware and backend request flow.
- **MongoDB:** flexible hierarchical item metadata using the native driver.
- **S3:** durable object storage without filling the EC2 filesystem.
- **Redis:** fast expiring session state, indexes, upload intents and cache coordination.
- **Nginx:** one public entry point, reverse proxying and TLS termination.
- **PM2:** process supervision, logs and reboot recovery.

## 5. Backend layering

```text
Route
  → validation/authentication middleware
  → controller
  → service
  → model/data access
  → MongoDB, Redis, S3 or external provider
```

- **Routes** define HTTP methods, paths, middleware and controllers.
- **Controllers** translate HTTP input/output without owning business rules.
- **Services** enforce ownership, folder, quota, session and billing rules.
- **Models** isolate MongoDB and Redis operations.
- **Middleware** handles authentication, RBAC, validation, CSRF, limits and errors.

This prevents controllers from becoming unreadable combinations of protocol handling, business logic and persistence.

## 6. Data model

### Users

User documents contain identity, normalized email, optional password hash, verification state, role, profile/preferences and account lifecycle fields. Plaintext passwords are never stored.

### Items

Files and folders share one `items` collection with:

- `ownerId`
- `type` (`file` or `folder`)
- `name`
- `parentId`
- starred/trash state
- timestamps

Files additionally contain size, MIME/file-kind data and an S3 storage key.

One collection works because both types participate in the same hierarchy and operations. Parent references are preferred over stored full paths because renaming an ancestor then does not require rewriting every descendant.

### Subscriptions and webhook events

Subscription documents map an internal user/plan to Razorpay identifiers and billing lifecycle state. Razorpay event IDs are stored separately and uniquely claimed so webhook retries are idempotent.

## 7. Stateful authentication

### Why not JWT login?

DataDock requires immediate logout, logout-all, server-controlled expiration, account blocking and a three-device limit. Opaque Redis sessions provide these capabilities directly. Stateless JWTs would require an additional revocation mechanism, reintroducing server state.

### Login flow

```text
Credentials submitted
  → Zod validation and rate limiting
  → normalized user lookup
  → bcrypt password comparison
  → verification/block checks
  → random session token generation
  → token hash stored in Redis with TTL
  → raw token returned in a signed HTTP-only cookie
```

Redis stores only the token hash. If Redis data leaks, stored values cannot simply be copied into a browser cookie. A per-user sorted set indexes sessions so expired sessions can be cleaned and the oldest can be revoked when the maximum of three is exceeded.

Cookie controls include `httpOnly`, production `secure`, `sameSite=lax`, signing and a production domain shared intentionally by the app/API subdomains.

### Google login

Google proves identity through OpenID Connect. The backend verifies the result, finds or creates the internal user and issues the same DataDock Redis session. Google credentials are not used as authorization tokens for DataDock APIs.

## 8. Email verification and password recovery

Registration creates an unverified account and sends a short-lived OTP through Resend. Password reset is staged:

```text
Request reset → send OTP → verify OTP
→ issue limited reset authorization → store new bcrypt hash
```

Registration, login, OTP and reset operations have dedicated rate limits.

## 9. Direct-to-S3 upload architecture

Proxying a 1–2 GB file through Express would consume EC2 bandwidth, memory and request capacity. DataDock uses presigned uploads:

1. The client sends file metadata and destination.
2. Zod validates the request.
3. The service verifies the parent folder and ownership.
4. It enforces plan quota and maximum file size.
5. It creates an unpredictable storage key.
6. A temporary upload intent is stored in Redis with TTL.
7. A short-lived S3 presigned URL is returned.
8. The browser uploads directly to private S3.
9. The client calls the completion endpoint.
10. The API verifies the intent/object and creates MongoDB metadata.
11. The intent is removed and list caches are invalidated.

If the browser disappears, the intent expires automatically. Orphaned S3 objects are a future cleanup concern best handled idempotently by a scheduled/background job.

## 10. File hierarchy and ownership

Every private item query is scoped by the authenticated `ownerId`; knowing another item ID is insufficient for access.

A folder cannot move into itself or a descendant, otherwise the hierarchy would become cyclic. Breadcrumb paths are reconstructed by following parents. Trash uses a timestamp-based soft-delete state; normal listings exclude trashed items, restore clears the state, and permanent deletion removes metadata/object data according to the operation.

Folder counts and sizes are derived from descendants. The API and UI must distinguish direct-child count from recursive totals.

## 11. Redis caching

Item-list results use versioned per-user cache namespaces. After a relevant mutation, the service increments a version rather than scanning and deleting every matching key.

Benefits:

- O(1) invalidation
- No blocking production `KEYS` command
- All list/filter variants become stale together

Old versioned keys disappear through finite TTLs.

## 12. Search

Search runs on metadata, scopes every query to the authenticated owner and applies filters/pagination server-side.

One real bug nested MongoDB `$facet` inside `$facet`, which MongoDB rejects. The query was corrected into one valid aggregation structure. At much larger scale, Atlas Search or a dedicated search engine would improve relevance and fuzzy matching.

## 13. Sharing

Public sharing uses an opaque token rather than an owner session. The share controls the root item, status and expiration. Shared-folder child requests verify that the requested child truly belongs to the shared hierarchy, preventing arbitrary item-ID substitution. Revocation disables future token access.

## 14. Google Drive import

Google identity login and Drive authorization are deliberately separate. Drive access requests `drive.readonly` only when the user chooses import.

```text
Connect Drive → Google consent → authorization-code callback
→ encrypted token state → browse Drive → import job
→ stream content to S3 → create DataDock metadata
```

Drive tokens are encrypted before persistence. Google restricted-scope verification may still be required before unrestricted public use.

## 15. Plans and quotas

| Plan | Price | Total storage | Maximum file |
|---|---:|---:|---:|
| Free | ₹0 | 500 MB | 100 MB |
| Pro | ₹99/month | 10 GB | 1 GB |
| Premium | ₹299/month | 50 GB | 2 GB |

Limits are enforced on the server. Client checks are only UX assistance. Storage endpoints expose totals, breakdown, largest files, activity and cleanup suggestions.

Under high concurrency, a basic read-then-upload quota check can race. A stronger design would reserve bytes atomically when creating upload intents, include reservations in usage and release them on completion/expiry.

## 16. Razorpay lifecycle

The browser response gives immediate feedback, but it is not sufficient as the billing source of truth. The browser can close or be manipulated, while recurring state changes happen asynchronously.

```text
Select plan → server creates known Razorpay subscription
→ Checkout → returned signature verification
→ immediate UI refresh
→ signed webhook → idempotent lifecycle synchronization
```

The webhook is mounted before normal JSON parsing because signature verification requires the exact raw request bytes. Test and Live Mode keys, plans, subscriptions and webhooks are separate. DataDock remains in Test Mode.

Cancellation is scheduled for period end so paid entitlement remains available for the funded period.

## 17. RBAC

The current roles are:

- `owner`: administers users.
- `user`: accesses only its own storage account.

Owner-only middleware protects privileged APIs. UI hiding is not authorization; every sensitive server endpoint checks the role independently.

## 18. Security controls

- Zod validation for bodies, queries and parameters
- bcrypt password hashing
- Hashed, expiring Redis session tokens
- Signed HTTP-only secure cookies
- Explicit credentialed CORS origin
- CSRF protection for state-changing API requests
- General and sensitive-route rate limits
- Helmet security headers
- Small JSON body limit and disabled `X-Powered-By`
- Ownership enforcement and owner-only RBAC
- Private S3 plus short-lived upload URLs
- Encrypted Google Drive tokens
- Razorpay HMAC verification and webhook idempotency
- Centralized non-leaking error responses
- Production startup validation for secrets and HTTPS origin

Future hardening includes AWS Secrets Manager/Parameter Store, SSM Session Manager, structured centralized logs, malware scanning, backup drills and managed Redis.

## 19. Production deployment

The deployment journey was:

1. Move the production database from local MongoDB to Atlas.
2. Provision Ubuntu EC2 and associate an Elastic IP.
3. Configure swap for memory-constrained Next.js builds.
4. Install Node.js, Git, Redis, Nginx and PM2.
5. Clone the repository under `/var/www/datadock`.
6. Create protected production environment files.
7. Attach an EC2 IAM role for private S3 access.
8. Build Next.js and start both applications with PM2.
9. Configure PM2 systemd reboot recovery.
10. Reverse-proxy frontend/API domains through Nginx.
11. Point Namecheap DNS to the Elastic IP.
12. Issue HTTPS certificates through Certbot.
13. Configure production cookies, Google callbacks and Razorpay Test webhook.
14. Verify password login, Google popup login, checkout and webhook delivery.

See `notes/deployment.md` for commands and troubleshooting.

## 20. Scaling analysis

Current limitations:

- One EC2 instance is a single point of failure.
- Local Redis makes horizontal scaling difficult.
- Frontend and API share limited CPU/RAM.
- Deployments are currently manual.
- CloudFront delivery is not active.

Reasonable evolution:

```text
CloudFront signed file delivery
→ managed Redis
→ separate frontend/API compute
→ load balancer and multiple API instances
→ background queues for imports, cleanup and scanning
→ immutable/zero-downtime deployments
→ centralized logs, metrics and alerts
```

Scaling should respond to measured bottlenecks rather than introducing distributed complexity early.

## 21. Major technical trade-offs

### Native MongoDB driver vs Mongoose

The native driver keeps queries, updates and aggregations explicit and avoids an extra abstraction. The cost is more responsibility for document shapes and mapping; DataDock uses Zod at API boundaries and controlled model functions.

### Redis sessions vs MongoDB sessions

Redis provides fast lookup, TTL and useful data structures for user session indexes. The cost is that authentication availability depends on Redis and local Redis complicates multi-instance scaling.

### Presigned S3 uploads vs Multer

Multer is useful when Express must parse multipart bodies. Direct S3 upload is better for large cloud-storage objects because it prevents the Node server from becoming a bandwidth bottleneck.

### Modular monolith vs microservices

DataDock is a modular monolith. It separates domains in code without adding service discovery, distributed transactions and multiple deployment pipelines before they are justified.

## 22. Important bugs and lessons

### Invalid folder ID on Recent

A frontend path request treated a non-folder UI context as a folder ID. Root, Recent and real folder contexts must be modeled distinctly.

### Trashed items still appeared

The mutation succeeded but affected read models/cache behavior were incomplete. A mutation is not correct until every relevant listing reflects it.

### MongoDB nested `$facet`

MongoDB forbids `$facet` inside `$facet`. Combining search, totals and pagination requires deliberate aggregation composition.

### Production “CORS” failure

The browser showed a CORS error, but PM2 revealed the backend was crashing because required environment variables were missing. Diagnose from the lowest layer: process → port → proxy → DNS → TLS → browser.

### Google popup success without main-window navigation

COOP isolation made popup-closed polling unreliable. A popup-compatible COOP policy and `BroadcastChannel` allowed the callback to notify the main window, which then navigated to `/dashboard`.

### Missing Razorpay webhook history

The subscription existed in Test Mode while the initial webhook was in the wrong mode. Nginx access logs proved whether Razorpay reached the API. After creating the Test Mode webhook and triggering a test charge, the endpoint returned 200 and Atlas stored the event.

## 23. Testing strategy

### Unit tests

- Quota calculations
- File-kind classification
- Session hashing
- Razorpay signatures
- Folder-cycle checks
- Zod schemas

### Integration tests

- Register → verify → login → protected API
- Upload intent → mocked S3 verification → item creation
- Folder move with cycle rejection
- Trash → restore → permanent delete
- Share → public access → revoke
- Duplicate webhook event processed once

### End-to-end tests

- Password and Google login
- Upload and progress
- Preview/download/share
- Drive import
- Razorpay Test Mode upgrade

External services should be mocked for deterministic CI tests, with a smaller sandbox smoke suite.

## 24. Observability

Current tools include PM2 logs, Nginx access/error logs, health checks, Atlas Data Explorer, Redis Insight and AWS metrics.

A stronger setup would add structured JSON logs with request IDs, centralized aggregation, latency/error/upload/webhook metrics, alerts for process restarts and resources, and security audit logs.

## 25. Interview questions and answers

### Why not store files in MongoDB?

S3 is purpose-built for durable object storage, scalable transfer and signed access. MongoDB is used for searchable metadata and relationships. GridFS is possible, but it would not offer a benefit for this architecture.

### How do you stop users accessing each other's files?

The server derives identity from the validated session. All private item queries include that `ownerId`; it never trusts an owner ID supplied by the client. Public share tokens use a separate scoped path.

### What if Redis goes down?

Authentication fails safely because sessions cannot be validated. In a scaled production version I would use managed highly available Redis with monitoring. Non-auth cache reads can fall back only where explicitly designed.

### What if MongoDB succeeds but S3 deletion fails?

MongoDB and S3 do not share a transaction. A robust solution records operation state and retries idempotent cleanup asynchronously, possibly with a queue and dead-letter handling.

### Why webhook idempotency?

Providers retry delivery. Without idempotency, repeated events could apply billing changes multiple times. A unique event claim makes retries safe.

### Why is webhook raw-body handling special?

HMAC verification must use the exact received bytes. Parsing and serializing JSON may produce different bytes and invalidate a correct signature.

### Why is CloudFront not marked complete?

The application is live through EC2/Nginx and private S3. CloudFront is a pending delivery optimization requiring Origin Access Control and signed URLs. I do not claim infrastructure that is not in the active path.

### How would you make deployment zero-downtime?

Build an immutable release separately, health-check it on another port, switch Nginx/load-balancer traffic, and retain the previous release for rollback. Multiple load-balanced instances improve this further.

### Biggest learning?

Most production bugs occur at boundaries. A browser CORS message may mean a crashed API; a payment issue may be a mode mismatch; OAuth may authenticate successfully but fail during popup communication. I learned to verify each boundary with logs and health checks.

## 26. Honest limitations

- CloudFront is planned but not active.
- CI/CD is planned; deployment updates are currently manual.
- Razorpay is in Test Mode.
- Google restricted-scope verification may be needed for unrestricted Drive users.
- Redis and both Node processes share one EC2 instance.
- Backend automated coverage should expand.
- Malware scanning is not implemented.
- Free Atlas and micro EC2 resources are suitable for demonstration, not heavy traffic.

Limitations should be stated honestly and paired with a sensible evolution plan.

## 27. Resume-ready bullets

- Built and deployed a full-stack cloud storage SaaS using Next.js, Express, MongoDB Atlas, Redis and private Amazon S3, supporting hierarchical file management, sharing and Google Drive imports.
- Designed revocable stateful authentication with hashed Redis sessions, signed HTTP-only cookies, Google OpenID Connect and three-device enforcement.
- Implemented direct-to-S3 presigned uploads, server-side quota enforcement and Razorpay subscription synchronization using signature-verified, idempotent webhooks.
- Deployed on AWS EC2 with Nginx, PM2, HTTPS, custom domains and IAM role-based S3 access.

Do not add performance numbers unless they were measured reproducibly.

## 28. Best interview explanation order

1. **Problem:** secure, organized cloud file management.
2. **Architecture:** Next.js + Express + Atlas + Redis + S3.
3. **Deep decision:** explain direct S3 upload or stateful sessions.
4. **Security/reliability:** ownership, validation, idempotency and private storage.
5. **Deployment:** EC2, PM2, Nginx, DNS and HTTPS.
6. **Challenge:** explain one real bug and the evidence used to isolate it.
7. **Trade-off:** admit the single-instance limitation.
8. **Next step:** CloudFront, CI/CD, observability and managed Redis.

This sequence demonstrates product understanding, backend depth, production experience and engineering judgment without turning the answer into a long feature list.
