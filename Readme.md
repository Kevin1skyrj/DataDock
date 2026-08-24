# DataDock

> Store smarter. Organize beautifully.

[![Live](https://img.shields.io/badge/Live-datadock.me-14b8a6?style=flat-square)](https://datadock.me)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![AWS](https://img.shields.io/badge/AWS-EC2%20%7C%20S3-FF9900?style=flat-square&logo=amazonwebservices&logoColor=white)](https://aws.amazon.com/)

DataDock is a production-deployed cloud storage SaaS for uploading, organizing, searching, previewing, sharing, and importing files. It combines a desktop-inspired Next.js interface with a custom Express backend, stateful Redis sessions, MongoDB Atlas metadata, private Amazon S3 object storage, Google integrations, and Razorpay subscriptions.

**Live application:** [https://datadock.me](https://datadock.me)

**API health:** [https://api.datadock.me/health](https://api.datadock.me/health)

> DataDock currently uses Razorpay Test Mode. No real payment is collected during portfolio demonstrations.

## Why DataDock?

This project goes beyond CRUD. It addresses the boundaries that make a storage product interesting to engineer:

- Binary objects and metadata are stored separately.
- Uploads go directly to private S3 using short-lived presigned URLs.
- Authentication uses server-side, revocable sessions instead of JWT login tokens.
- Redis supports sessions and cache invalidation.
- File ownership is enforced at the API and database-query level.
- Recursive folder operations, storage quotas, sharing, and subscription state require consistent cross-service behavior.
- Google, Resend, Razorpay, S3 and Atlas are integrated into one product.

## Core features

### File and folder management

- Direct-to-S3 uploads with progress tracking and completion confirmation
- Nested folders and breadcrumb navigation
- Rename, move, duplicate, star, trash, restore and permanent deletion
- File preview, open-in-new-tab and download flows
- Folder summaries and recursive item counts
- Recent items, global search and type/date/size filtering
- Storage breakdown, largest-file analysis and cleanup suggestions

### Sharing

- Public links for files and folders
- Expiring share links
- Shared-folder browsing without a DataDock account
- Controlled preview and download of shared children
- Share update and revocation

### Authentication and authorization

- Email/password registration with OTP email verification
- Password hashing with bcrypt
- Login, logout, logout-all and password reset
- Google OpenID Connect login
- Stateful Redis sessions with expiration and a maximum of three active sessions
- Owner/user role enforcement for user administration
- Secure, signed, HTTP-only cookies

### Integrations and billing

- Google Drive connection and file/folder import
- Resend email delivery through a verified DataDock mail domain
- Free, Pro and Premium storage plans in INR
- Razorpay subscription checkout, verification, cancellation and signed webhooks
- Idempotent webhook-event processing
- Plan-specific total-storage and maximum-file-size enforcement

### Product experience

- Responsive dark/light UI with selectable accent themes
- Desktop-inspired file browser, context menus and command-oriented interactions
- Upload progress, empty, loading and error states
- Account, appearance, notification, security, shortcut and billing settings

## Subscription plans

| Plan | Price | Storage | Maximum file size |
|---|---:|---:|---:|
| Free | ₹0 | 500 MB | 100 MB |
| Pro | ₹99/month | 10 GB | 1 GB |
| Premium | ₹299/month | 50 GB | 2 GB |

## Architecture

```text
                              ┌──────────────────┐
                              │     Browser      │
                              └────────┬─────────┘
                                       │ HTTPS
                              ┌────────▼─────────┐
                              │ Nginx on AWS EC2 │
                              └──────┬─────┬─────┘
                       datadock.me   │     │   api.datadock.me
                           ┌─────────┘     └──────────┐
                    ┌──────▼───────┐          ┌──────▼───────┐
                    │ Next.js :3000│          │ Express :4000│
                    └──────────────┘          └──┬──┬──┬──┬──┘
                                                │  │  │  │
                       ┌────────────────────────┘  │  │  └─────────────┐
                 ┌─────▼──────┐           ┌────────▼─┐          ┌─────▼─────┐
                 │MongoDB Atlas│           │Redis :6379│          │Private S3 │
                 │  metadata   │           │sessions +│          │  objects  │
                 └─────────────┘           │  cache   │          └───────────┘
                                          └──────────┘
                         ┌──────────────────────┼──────────────────────┐
                         ▼                      ▼                      ▼
                   Google OAuth/Drive       Razorpay                Resend
```

Nginx exposes only ports 80 and 443. The Next.js and Express processes run behind the reverse proxy under PM2. Redis runs locally on EC2; MongoDB Atlas and S3 are external managed services.

## Important request flows

### Upload

```text
Client requests upload intent
  → API authenticates user and validates quota
  → API creates a temporary Redis intent and S3 presigned URL
  → Client uploads bytes directly to private S3
  → Client confirms completion
  → API verifies the object and writes MongoDB metadata
  → Cache is invalidated and the new item appears
```

The backend does not proxy large file bodies, reducing EC2 memory and bandwidth pressure.

### Stateful authentication

```text
Credentials or Google identity
  → account validation
  → opaque random session token
  → token hash stored in Redis with TTL
  → signed HTTP-only cookie returned
  → middleware validates every protected request
```

Sessions can be revoked immediately, expired centrally and restricted to three active devices.

### Subscription

```text
Select plan
  → backend creates Razorpay subscription
  → Razorpay Checkout authenticates payment
  → backend verifies returned signature
  → webhook independently synchronizes lifecycle state
  → plan quotas update in DataDock
```

Webhook event IDs are claimed idempotently so retries do not apply the same transition twice.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Motion, GSAP, shadcn, React Hook Form, Zod |
| Backend | Node.js, Express 5, native MongoDB driver, Zod |
| Data | MongoDB Atlas, Redis |
| Object storage | Private Amazon S3, AWS SDK v3, presigned URLs |
| Authentication | Stateful Redis sessions, signed cookies, bcrypt, Google OpenID Connect |
| External services | Google Drive API, Resend, Razorpay |
| Security | Helmet, CORS allowlist, CSRF protection, rate limiting, validation |
| Infrastructure | AWS EC2 Ubuntu, Nginx, PM2, Elastic IP, Certbot/Let's Encrypt |

## Repository structure

```text
DataDock/
├── client/                  # Next.js App Router application
│   ├── src/app/             # Marketing, auth, dashboard and share routes
│   ├── src/components/      # Reusable product and UI components
│   ├── src/services/        # API access layer
│   └── tests/               # Frontend service/behavior tests
├── server/                  # Express API
│   └── src/
│       ├── config/          # MongoDB, Redis, S3, OAuth and plans
│       ├── controllers/     # HTTP request/response orchestration
│       ├── middleware/      # Auth, RBAC, CSRF, validation and limits
│       ├── models/          # MongoDB and Redis persistence operations
│       ├── routes/          # Versioned REST endpoints
│       ├── services/        # Business rules and external integrations
│       ├── validators/      # Zod request schemas
│       └── utils/           # Tokens, encryption, signatures and file helpers
├── notes/                   # Engineering and interview notes
└── docs/                    # Product and frontend specifications
```

## Local development

### Requirements

- Node.js 22+
- npm
- MongoDB
- Redis
- An S3 bucket and limited AWS credentials
- Google, Resend and Razorpay test credentials for their respective features

### 1. Clone the repository

```bash
git clone https://github.com/Kevin1skyrj/DataDock.git
cd DataDock
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create `server/.env`. Required categories include:

```env
NODE_ENV=development
PORT=4000
CLIENT_ORIGIN=http://localhost:3000

MONGODB_URI=<mongodb-uri>
MONGODB_DB_NAME=datadock_dev
REDIS_URL=redis://127.0.0.1:6379

COOKIE_SECRET=<strong-secret>
OTP_SECRET=<strong-secret>

AWS_REGION=<region>
AWS_S3_BUCKET=<bucket>

GOOGLE_CLIENT_ID=<id>
GOOGLE_CLIENT_SECRET=<secret>
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/auth/google/callback
GOOGLE_DRIVE_CALLBACK_URL=http://localhost:4000/api/v1/imports/google-drive/callback
DRIVE_TOKEN_ENCRYPTION_KEY=<32-byte-key>

RESEND_API_KEY=<key>
EMAIL_FROM=DataDock <no-reply@example.com>

RAZORPAY_KEY_ID=<test-id>
RAZORPAY_KEY_SECRET=<test-secret>
RAZORPAY_PRO_PLAN_ID=<test-plan-id>
RAZORPAY_PREMIUM_PLAN_ID=<test-plan-id>
RAZORPAY_WEBHOOK_SECRET=<test-webhook-secret>
```

Use this only as a checklist. Never commit real values.

Start the API:

```bash
npm run dev
```

### 3. Configure the frontend

```bash
cd ../client
npm install
```

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Start Next.js:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
cd client
npm run lint
npm test
npm run build
```

```bash
cd server
npm audit
```

The deployed API also exposes a lightweight health check at `/health`.

## Deployment

The live version runs on an Ubuntu EC2 instance with:

- MongoDB Atlas for production metadata
- Redis for stateful sessions and caching
- A private S3 bucket accessed through an EC2 IAM role
- PM2 for process supervision and reboot recovery
- Nginx for reverse proxying
- An Elastic IP and Namecheap DNS
- Certbot-managed HTTPS certificates

The complete deployment runbook is available in [notes/deployment.md](notes/deployment.md).

## Security decisions

- Opaque stateful sessions are centrally revocable; JWTs are not used for login.
- Only hashes of session tokens are stored in Redis.
- Passwords are hashed using bcrypt.
- Session cookies are signed, HTTP-only and secure in production.
- Zod validates request bodies, parameters and queries.
- CSRF middleware protects state-changing API requests.
- Rate limits are stricter for authentication, OTP, reset and billing operations.
- Helmet supplies security headers and CORS uses an explicit frontend origin.
- Google Drive tokens are encrypted before persistence.
- Razorpay signatures are verified using the raw request body.
- S3 remains private and upload access is short-lived.

## Current status and roadmap

### Completed

- Full deployed frontend and API
- MongoDB Atlas, Redis and private S3 integration
- Email/password and Google authentication
- File/folder management, sharing and Drive import
- Storage plans, quota enforcement and Razorpay Test Mode lifecycle
- Custom domain, HTTPS, Nginx and PM2 production setup

### Next

- CloudFront signed delivery after AWS account approval
- Automated CI/CD with build, deployment and health-check gates
- Automated backend integration tests
- Centralized monitoring, structured logs and alerts
- Managed Redis and multi-instance architecture if traffic justifies scaling

## Author

**Rajat Pandey**

[GitHub](https://github.com/Kevin1skyrj) · [Live project](https://datadock.me)

---

If you find DataDock useful or interesting, consider starring the repository.
