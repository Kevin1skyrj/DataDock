# DataDock Deployment Guide

> A practical, repeatable runbook for deploying the DataDock full-stack application with MongoDB Atlas, AWS EC2, Ubuntu, Redis, PM2, Nginx, HTTPS, Google OAuth, Razorpay webhooks, and AWS S3.

## 1. Final architecture

DataDock currently uses this production architecture:

```text
Browser
   |
   | HTTPS
   v
Nginx on AWS EC2
   |-- datadock.me / www.datadock.me --> Next.js on 127.0.0.1:3000
   `-- api.datadock.me              --> Express on 127.0.0.1:4000

Express backend
   |-- MongoDB Atlas                --> application metadata
   |-- Redis on EC2                 --> sessions and cache
   |-- Private AWS S3 bucket        --> file objects
   |-- Google OAuth / Drive API     --> authentication and Drive imports
   |-- Resend                       --> email and OTP delivery
   `-- Razorpay                     --> subscriptions and webhooks

PM2
   |-- datadock-client
   `-- datadock-server
```

The EC2 instance has a fixed Elastic IP. Namecheap DNS points the public domains to that IP. Certbot provides TLS certificates, and Nginx terminates HTTPS.

CloudFront is **not yet part of the completed request path**. It should be added later after AWS approves CloudFront resource creation. EC2 deployment and CDN deployment are related but separate topics.

---

## 2. Important deployment principles

1. Never expose application processes directly to the public internet in production. Nginx should receive public traffic and proxy it to localhost ports.
2. Never commit `.env`, API keys, PEM files, database passwords, webhook secrets, or encryption keys.
3. Use different development, test, and production credentials.
4. Use a managed production database such as MongoDB Atlas instead of installing MongoDB on the same small EC2 instance.
5. Keep S3 private and provide controlled access through the backend or signed delivery URLs.
6. Build the application before switching live traffic to it.
7. Treat deployment as a repeatable process, not a sequence of undocumented manual actions.
8. Test every external integration again after changing domains or protocols.

---

## 3. Prerequisites

Before deploying, prepare:

- A GitHub repository containing the application.
- An AWS account with root-account MFA enabled.
- An AWS budget and billing alerts.
- A registered domain, such as `datadock.me`.
- A MongoDB Atlas account.
- Production-ready environment-variable values.
- A private S3 bucket and an EC2 IAM role with the required S3 permissions.
- Google OAuth credentials.
- Resend credentials and a verified sending domain.
- Razorpay Test Mode credentials and plans.

Local checks before deployment:

```bash
cd server
npm audit
npm start
```

```bash
cd client
npm run lint
npm run build
```

Do not deploy while either application fails locally.

---

# Part I: Move MongoDB from local development to Atlas

## 4. Why use MongoDB Atlas

MongoDB Compass is a GUI client, not a production database host. A local MongoDB server is accessible only from the machine or network where it runs.

Atlas provides:

- A database reachable by EC2.
- Managed availability and maintenance.
- Network access controls.
- Database users and roles.
- Monitoring and a web-based Data Explorer.
- A connection string designed for applications.

For a portfolio deployment, the Atlas free cluster is sufficient while the application remains within its limits.

## 5. Create the Atlas project and cluster

1. Sign in to MongoDB Atlas.
2. Create a project named `DataDock`.
3. Do not add additional project members unless collaboration requires it.
4. Create a cluster.
5. Select the free tier.
6. Choose AWS as the provider.
7. Choose the Mumbai region when it is available and appropriate for the expected users and EC2 region.
8. Name the cluster clearly, for example `datadock-production`.
9. Do not preload sample data.

Keeping Atlas and EC2 geographically close normally reduces database latency.

## 6. Create a least-privileged database user

Under **Database & Network Access → Database Users**:

1. Create a dedicated application database user.
2. Generate a strong, unique password.
3. Store the password in a password manager.
4. Prefer access scoped to the DataDock database.

For a simple project, `readWrite` access is sufficient for the application database. Avoid `atlasAdmin` for the runtime application user.

If the generated connection URI contains `<db_password>`, replace only that placeholder. URL-encode special characters in usernames or passwords when necessary.

## 7. Configure Atlas network access

During local testing:

1. Open **Network Access → IP Access List**.
2. Add the current public IP address.
3. If the network changes, update the allowlist.

For production:

1. Allocate the EC2 Elastic IP first.
2. Add that Elastic IP as `/32` in Atlas.
3. Remove temporary local IP addresses when no longer required.

Using `0.0.0.0/0` permits connections from anywhere. It may be useful briefly during diagnosis, but it should not be the final production configuration.

## 8. Obtain the Atlas URI

Choose:

```text
Connect → Drivers → Node.js
```

The URI resembles:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/?retryWrites=true&w=majority
MONGODB_DB_NAME=datadock
```

Do not publish the real URI.

## 9. Test Atlas before EC2 deployment

Create a local ignored environment file such as `.env.atlas-test`, then start the backend with that file. DataDock used a separate npm script for this test.

Expected output:

```text
MongoDB connected: datadock
Redis connected
S3 connected: <bucket-name>
Server started on port 4000
```

Common Atlas connection failures:

### `ETIMEDOUT ...:27017`

Likely causes:

- The current public IP is not allowed in Atlas.
- The network blocks MongoDB traffic.
- DNS or firewall restrictions exist on the LAN.
- A VPN or filtering client interferes with the connection.

Try a different network, update the Atlas IP allowlist, and test DNS/network access again.

### TLS internal error

Likely causes include network interception, VPN/proxy behavior, restrictive institutional networks, or an incompatible TLS path. Testing from a mobile hotspot helped isolate the DataDock issue.

## 10. Local data migration options

DataDock started its Atlas production database as a clean environment. If existing local data must be preserved, export and import it deliberately.

Typical approach:

```bash
mongodump --uri="mongodb://127.0.0.1:27017/datadock_dev" --out=<backup-directory>
```

```bash
mongorestore --uri="<atlas-connection-uri>" --nsFrom="datadock_dev.*" --nsTo="datadock.*" <backup-directory>/datadock_dev
```

Before migrating production data:

- Create a backup.
- Verify database and collection names.
- Avoid copying development-only sessions, OTPs, and test webhook events without a reason.
- Confirm indexes after restoration.
- Check that S3 object keys referenced by metadata really exist.

Never paste credentials into shell history when a safer credential mechanism is available.

---

# Part II: Create the AWS EC2 Ubuntu server

## 11. Prepare the AWS account

1. Enable MFA for the AWS root account.
2. Confirm the AWS plan/account status.
3. Create a monthly AWS budget.
4. Configure billing alerts.
5. Use an IAM identity for routine administration rather than using root.
6. Select the Mumbai region consistently for EC2 and S3 where appropriate.

AWS resources are regional. Always check the region shown in the console before assuming a resource is missing.

## 12. Launch the EC2 instance

Open **EC2 → Instances → Launch instances**.

Recommended configuration used for DataDock:

- Name: `datadock-production`
- AMI: Ubuntu Server LTS
- Architecture: 64-bit x86
- Instance type: free-tier-eligible small instance, such as `t3.micro` when eligible
- Storage: enough gp3 storage for dependencies, builds, and logs
- Auto-assign public IP: enabled initially

The application stores files in S3, not on the instance filesystem. EC2 storage is still required for Ubuntu, the Git repository, dependencies, Next.js build output, logs, and swap.

## 13. Create and preserve the SSH key pair

Create a new RSA or ED25519-compatible key pair in PEM format and download it once.

Example local location:

```text
C:\Users\<user>\Downloads\datadock-production-key.pem
```

If the download is discarded before launching, create a new key pair and select it before launching. AWS will not allow downloading the private half of an existing key pair again.

Never commit the PEM file.

## 14. Configure the EC2 security group

Initial inbound rules:

| Port | Protocol | Source | Purpose |
|---:|---|---|---|
| 22 | TCP | Your current public IP `/32` | SSH |
| 80 | TCP | `0.0.0.0/0`, `::/0` | HTTP and certificate issuance |
| 443 | TCP | `0.0.0.0/0`, `::/0` | HTTPS |

Do not publicly expose:

- Port 3000
- Port 4000
- Port 6379
- MongoDB port 27017

Nginx communicates with the Node applications over localhost. Redis should listen locally.

If SSH times out after changing networks, update the port 22 rule to the new public IP. The browser-based EC2 Instance Connect terminal can be used as a temporary recovery method.

## 15. Allocate and associate an Elastic IP

1. Open **EC2 → Elastic IP addresses**.
2. Allocate an Elastic IP.
3. Select it and choose **Associate Elastic IP address**.
4. Select the running DataDock instance.
5. Select its primary private IP.
6. Associate it.

An Elastic IP prevents DNS records from breaking when the instance is stopped and started.

An allocated but unassociated Elastic IP can incur charges. Release unused addresses.

## 16. Connect to Ubuntu from WSL

Copy the PEM file into the Linux filesystem and restrict its permissions:

```bash
mkdir -p ~/.ssh
cp "/mnt/c/Users/<user>/Downloads/datadock-production-key.pem" ~/.ssh/
chmod 600 ~/.ssh/datadock-production-key.pem
```

Connect:

```bash
ssh -i ~/.ssh/datadock-production-key.pem ubuntu@<elastic-ip>
```

The prompt changes from the local WSL user to something similar to:

```text
ubuntu@ip-172-31-x-x:~$
```

Do not type the prompt itself as a command.

If SSH hangs, use verbose diagnostics:

```bash
ssh -vvv -i ~/.ssh/datadock-production-key.pem ubuntu@<elastic-ip>
```

## 17. Update Ubuntu

Run these commands inside the EC2 terminal:

```bash
sudo apt update
sudo apt upgrade -y
```

Reboot if Ubuntu reports that a system restart is required:

```bash
sudo reboot
```

Reconnect after the instance becomes available.

## 18. Add swap for a small instance

Next.js builds can exhaust the RAM of a micro instance. DataDock added a 2 GB swap file.

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

Persist it across reboots by adding this line to `/etc/fstab`:

```text
/swapfile none swap sw 0 0
```

Verify:

```bash
free -h
```

Swap prevents abrupt out-of-memory failures, but it is slower than RAM. It is not a substitute for choosing an appropriately sized production instance.

---

# Part III: Install the server software

## 19. Install Git, Nginx, and Redis

```bash
sudo apt install -y git nginx redis-server
```

Enable services:

```bash
sudo systemctl enable --now nginx
sudo systemctl enable --now redis-server
```

Verify:

```bash
sudo systemctl is-active nginx
redis-cli ping
```

Expected Redis response:

```text
PONG
```

Redis is currently local to EC2. It stores DataDock sessions and cache entries. Because local Redis data is tied to this instance, a future highly available deployment should use a managed Redis service or a deliberate persistence/backup strategy.

## 20. Install Node.js with NVM

Install NVM using its official current installation instructions, reload the shell, and install the Node version supported by the project.

Typical commands after NVM is installed:

```bash
nvm install 22
nvm use 22
nvm alias default 22
```

Verify:

```bash
node --version
npm --version
```

Using NVM makes Node upgrades manageable, but systemd/PM2 startup must reference the correct NVM-installed binary path.

## 21. Install PM2

```bash
npm install -g pm2
pm2 --version
```

PM2 keeps Node processes alive, collects logs, restarts crashed processes, and restores them after reboot when configured with systemd.

---

# Part IV: Deploy the application code

## 22. Clone the repository

Create a standard application directory:

```bash
sudo mkdir -p /var/www
sudo chown -R ubuntu:ubuntu /var/www
cd /var/www
git clone <github-repository-url> datadock
cd datadock
```

Verify the deployed revision:

```bash
git branch --show-current
git log -1 --oneline
```

The production branch should be intentional, normally `main`.

## 23. Install backend dependencies

```bash
cd /var/www/datadock/server
npm ci
```

Use `npm ci` in deployment when a correct lockfile exists. It performs a clean, reproducible installation.

## 24. Install frontend dependencies

```bash
cd /var/www/datadock/client
npm ci
```

Check disk and memory before a large build:

```bash
df -h /
free -h
```

## 25. Attach an IAM role for S3

Do not keep permanent AWS access keys in the EC2 `.env` when EC2 can use an IAM role.

1. Create an IAM role trusted by EC2.
2. Attach a least-privileged policy allowing only required actions on the DataDock bucket.
3. Attach the role to the running EC2 instance.
4. Remove `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from EC2 configuration when the SDK successfully uses the instance role.

Typical required actions depend on the implementation but may include:

- `s3:GetObject`
- `s3:PutObject`
- `s3:DeleteObject`
- multipart-upload actions
- limited bucket metadata access

Scope resources to the specific bucket and object prefix.

## 26. Create production environment files

Backend:

```bash
cd /var/www/datadock/server
nano .env
```

Frontend:

```bash
cd /var/www/datadock/client
nano .env.production
```

Use `Ctrl+O`, Enter, and `Ctrl+X` in Nano to save and exit.

Example backend variable categories:

```env
NODE_ENV=production
PORT=4000

CLIENT_ORIGIN=https://datadock.me
COOKIE_DOMAIN=.datadock.me

MONGODB_URI=<atlas-uri>
MONGODB_DB_NAME=datadock
REDIS_URL=redis://127.0.0.1:6379

SESSION_SECRET=<strong-random-secret>
OTP_SECRET=<strong-random-secret>

RESEND_API_KEY=<secret>
EMAIL_FROM=DataDock <no-reply@mail.datadock.me>

GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_CALLBACK_URL=https://api.datadock.me/api/v1/auth/google/callback
GOOGLE_DRIVE_CALLBACK_URL=https://api.datadock.me/api/v1/imports/google-drive/callback
DRIVE_TOKEN_ENCRYPTION_KEY=<encryption-key>

AWS_REGION=ap-south-1
AWS_S3_BUCKET=<private-bucket-name>

RAZORPAY_KEY_ID=<test-key-id>
RAZORPAY_KEY_SECRET=<test-key-secret>
RAZORPAY_PRO_PLAN_ID=<test-plan-id>
RAZORPAY_PREMIUM_PLAN_ID=<test-plan-id>
RAZORPAY_WEBHOOK_SECRET=<webhook-secret>
```

Example frontend configuration:

```env
NEXT_PUBLIC_API_URL=https://api.datadock.me/api/v1
```

Use the exact variable names expected by the codebase.

Restrict backend environment-file permissions:

```bash
chmod 600 /var/www/datadock/server/.env
chmod 600 /var/www/datadock/client/.env.production
```

Important lessons from DataDock:

- A missing `OTP_SECRET` caused the backend to crash repeatedly under PM2.
- A missing `GOOGLE_CALLBACK_URL` caused another startup failure.
- CORS errors in the browser may be a symptom of a crashed backend, because Nginx's fallback response does not contain Express CORS headers.
- Editing one character in a leaked secret does not secure it. Rotate the credential at its provider and update the environment.

## 27. Build the Next.js frontend

On the micro instance, DataDock used a memory limit compatible with available RAM and swap:

```bash
cd /var/www/datadock/client
NODE_OPTIONS=--max-old-space-size=768 npm run build
```

A successful build lists static and dynamic application routes and ends without an error.

Do not run `next dev` in production. Use the optimized `next start` output.

## 28. Test the backend manually

```bash
cd /var/www/datadock/server
npm start
```

Expected output:

```text
MongoDB connected: datadock
Redis connected
S3 connected: <bucket-name>
Server started on port 4000
```

From another EC2 terminal:

```bash
curl -i http://127.0.0.1:4000/health
```

The health endpoint should return HTTP 200 and JSON indicating success.

---

# Part V: Run the applications with PM2

## 29. Start the backend

```bash
cd /var/www/datadock/server
pm2 start npm --name datadock-server -- start
```

## 30. Start the frontend

```bash
cd /var/www/datadock/client
pm2 start npm --name datadock-client -- start
```

## 31. Verify PM2 processes

```bash
pm2 status
pm2 logs datadock-server --lines 30 --nostream
pm2 logs datadock-client --lines 30 --nostream
```

Expected state:

```text
datadock-server  online
datadock-client  online
```

Local service checks:

```bash
curl -I http://127.0.0.1:3000
curl -i http://127.0.0.1:4000/health
```

## 32. Make PM2 survive reboots

Save the process list:

```bash
pm2 save
```

Generate startup configuration:

```bash
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Run the `sudo` command printed by PM2, then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable pm2-ubuntu
sudo systemctl start pm2-ubuntu
```

Verify:

```bash
systemctl status pm2-ubuntu --no-pager
pm2 status
```

The service must be `active (running)`, and both processes must be online.

After adding or changing PM2 processes, run `pm2 save` again.

---

# Part VI: Configure Nginx as the reverse proxy

## 33. Why Nginx is used

Nginx:

- Receives public HTTP and HTTPS traffic.
- Routes frontend and API domains to different local Node ports.
- Keeps ports 3000 and 4000 private.
- Terminates TLS.
- Supports WebSocket upgrade headers.
- Provides access and error logs.

## 34. Create the Nginx site

```bash
sudo nano /etc/nginx/sites-available/datadock
```

HTTP-stage configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name datadock.me www.datadock.me;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name api.datadock.me;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/datadock /etc/nginx/sites-enabled/datadock
sudo rm /etc/nginx/sites-enabled/default
```

Test and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx --no-pager
```

Never reload Nginx after a failed `nginx -t`.

---

# Part VII: Configure DNS and HTTPS

## 35. Add Namecheap DNS records

Create these records pointing to the Elastic IP:

| Type | Host | Value |
|---|---|---|
| A | `@` | `<elastic-ip>` |
| A | `api` | `<elastic-ip>` |
| CNAME or A | `www` | `datadock.me` or `<elastic-ip>` |

Do not remove existing Resend email-authentication records.

Verify propagation from a local terminal:

```powershell
nslookup datadock.me
nslookup api.datadock.me
```

A timeout followed by the correct non-authoritative answer can indicate slow DNS resolution rather than total failure. Confirm using more than one resolver when uncertain.

## 36. Install Certbot and enable HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Request the certificate:

```bash
sudo certbot --nginx -d datadock.me -d www.datadock.me -d api.datadock.me
```

Certbot updates Nginx and configures HTTP-to-HTTPS redirects.

Verify:

```bash
curl -I https://datadock.me
curl -i https://api.datadock.me/health
sudo certbot renew --dry-run
```

Check that the certificate covers all three names and that automatic renewal is scheduled.

---

# Part VIII: Production cookies, CORS, and authentication

## 37. Configure cross-subdomain sessions

The frontend and backend use different subdomains. The session cookie must work across them.

Production requirements:

- HTTPS enabled.
- Secure cookie enabled in production.
- Appropriate `SameSite` behavior.
- Cookie domain set to `.datadock.me` when sharing across subdomains is required.
- Requests from the frontend use credentials.
- Express CORS permits only the intended frontend origin and enables credentials.

Relevant production values:

```env
CLIENT_ORIGIN=https://datadock.me
COOKIE_DOMAIN=.datadock.me
```

After changing `.env`:

```bash
pm2 restart datadock-server
pm2 save
```

## 38. Diagnose misleading CORS failures

Browser message:

```text
No 'Access-Control-Allow-Origin' header is present
```

Do not assume the CORS configuration is wrong. Check the backend first:

```bash
pm2 status
pm2 logs datadock-server --lines 30 --nostream
curl -i https://api.datadock.me/health
```

If PM2 shows frequent restarts, fix the backend startup error. DataDock encountered missing environment variables, which made Nginx return a response without Express CORS headers.

## 39. Configure Google OAuth production URLs

In the Google Cloud OAuth web client, preserve localhost entries and add:

Authorized JavaScript origins:

```text
https://datadock.me
https://www.datadock.me
```

Authorized redirect URIs:

```text
https://api.datadock.me/api/v1/auth/google/callback
https://api.datadock.me/api/v1/imports/google-drive/callback
```

Backend production variables must match exactly:

```env
GOOGLE_CALLBACK_URL=https://api.datadock.me/api/v1/auth/google/callback
GOOGLE_DRIVE_CALLBACK_URL=https://api.datadock.me/api/v1/imports/google-drive/callback
```

Redirect URIs are exact-match values. Scheme, hostname, port, path, and trailing slash matter.

## 40. OAuth popup and COOP lesson

Google login uses a popup. Strict `Cross-Origin-Opener-Policy: same-origin` can disrupt communication between the popup and opener.

DataDock uses a popup-compatible COOP policy and a `BroadcastChannel` to notify the main page after successful login. The main window then navigates to `/dashboard`.

When testing:

1. Open the login page.
2. Start Google login.
3. Select the Google account.
4. Confirm the popup closes.
5. Confirm the main window navigates to the dashboard.
6. Confirm the session cookie exists and protected APIs work.

An `inject_main.js` or browser-extension message-port warning may be extension noise. Test in a clean profile/incognito mode before treating it as application code failure.

---

# Part IX: Razorpay Test Mode webhook deployment

## 41. Why Test Mode is used on the production domain

A real HTTPS domain does not require immediate Live Mode payments. Test Mode verifies the complete production network and application flow without charging real money.

Test and Live modes have separate:

- API keys
- plans
- subscriptions
- transactions
- webhooks

Never mix Test Mode plan IDs with Live Mode keys or vice versa.

## 42. Create the production-domain Test Mode webhook

In Razorpay, enable **Test Mode**, then create:

```text
https://api.datadock.me/api/v1/billing/webhook
```

Use the exact same webhook secret stored in the backend production `.env`.

Select the subscription events handled by the backend, including the relevant lifecycle events such as:

- `subscription.authenticated`
- `subscription.activated`
- `subscription.charged`
- `subscription.pending`
- `subscription.halted`
- `subscription.paused`
- `subscription.resumed`
- `subscription.cancelled`
- other events intentionally supported by the implementation

Restart the backend if the secret changes:

```bash
pm2 restart datadock-server
pm2 save
```

## 43. Verify subscription checkout

1. Log in to the deployed DataDock application.
2. Open Billing.
3. Upgrade from Free to Pro or Premium using Razorpay Test Mode.
4. Complete the test checkout.
5. Confirm the DataDock billing UI updates.
6. Confirm the Atlas `subscriptions` document contains the expected plan, status, Razorpay subscription ID, and billing dates.

## 44. Trigger and verify a webhook

In Razorpay Test Mode:

1. Open the test subscription.
2. Use **Charge this now**.
3. Complete the successful test charge.
4. Wait for webhook delivery.

Check Nginx:

```bash
sudo grep -i 'billing/webhook' /var/log/nginx/access.log | tail -20
```

Successful evidence resembles:

```text
"POST /api/v1/billing/webhook HTTP/1.1" 200 ... "Razorpay-Webhook/v1"
```

Then confirm:

- `razorpay_webhook_events` contains the event.
- The event was processed only once.
- `subscriptions` reflects the current Razorpay state.
- The endpoint returned HTTP 200.

An empty Nginx result means Razorpay did not send a request; it does not prove a backend failure. Commonly, the webhook exists in Live Mode while the subscription exists in Test Mode.

## 45. Before accepting real payments

Create separate Live Mode resources:

- Live key ID and secret
- Live Pro and Premium plan IDs
- Live webhook and a new strong webhook secret
- Live production environment values

Perform legal, tax, refund, cancellation, support, and pricing reviews before accepting real money. Never silently switch a portfolio application to Live Mode.

---

# Part X: Production verification checklist

## 46. Infrastructure checks

```bash
pm2 status
systemctl status pm2-ubuntu --no-pager
sudo systemctl status nginx --no-pager
sudo systemctl status redis-server --no-pager
sudo nginx -t
free -h
df -h /
```

## 47. Endpoint checks

```bash
curl -I https://datadock.me
curl -i https://api.datadock.me/health
```

Confirm:

- HTTPS works.
- No certificate warning appears.
- The frontend responds.
- The API health check returns 200.
- CORS permits the production frontend origin.
- Credentials work with protected APIs.

## 48. Functional smoke tests

Authentication:

- Register.
- Receive and verify OTP.
- Password login.
- Google login.
- Logout.
- Password reset.
- Session/device limits.

File system:

- Create nested folders.
- Upload small and large permitted files.
- Verify upload progress and Redis cleanup.
- Preview, open, and download.
- Rename, move, duplicate, star, trash, restore, and permanently delete.
- Verify S3 objects and MongoDB metadata remain consistent.
- Verify storage and per-file limits.

Sharing and integrations:

- Create and open a public share link.
- Verify expiration/access controls.
- Import from Google Drive.
- Verify disconnected/expired Google tokens are handled.

Billing:

- Fetch plans and current subscription.
- Complete a Test Mode upgrade.
- Verify quota changes.
- Verify webhook delivery and idempotency.
- Verify cancellation-at-period-end behavior.

Administration:

- Confirm only the owner can view and manage all users.
- Confirm normal users cannot access owner/admin APIs or UI.

---

# Part XI: Operations and troubleshooting

## 49. Essential commands

Application state:

```bash
pm2 status
pm2 monit
```

Application logs:

```bash
pm2 logs datadock-server --lines 50 --nostream
pm2 logs datadock-client --lines 50 --nostream
```

Nginx logs:

```bash
sudo tail -100 /var/log/nginx/access.log
sudo tail -100 /var/log/nginx/error.log
```

Services:

```bash
sudo systemctl restart nginx
sudo systemctl restart redis-server
sudo systemctl restart pm2-ubuntu
```

After environment changes:

```bash
pm2 restart datadock-server
pm2 restart datadock-client
pm2 save
```

## 50. Safe manual update procedure

Until CI/CD is implemented:

```bash
cd /var/www/datadock
git status
git pull --ff-only origin main
```

Backend:

```bash
cd /var/www/datadock/server
npm ci
pm2 restart datadock-server
```

Frontend:

```bash
cd /var/www/datadock/client
npm ci
NODE_OPTIONS=--max-old-space-size=768 npm run build
pm2 restart datadock-client
```

Finish with:

```bash
pm2 save
curl -I https://datadock.me
curl -i https://api.datadock.me/health
```

`git pull --ff-only` avoids silently creating a merge commit on the production server.

## 51. Common failure map

| Symptom | Likely cause | First check |
|---|---|---|
| SSH port 22 times out | Security-group source IP is stale | Current public IP and inbound SSH rule |
| Atlas `ETIMEDOUT` | IP allowlist or network restriction | Atlas Network Access and current network |
| PM2 restart count rises rapidly | Backend startup crash | `pm2 logs datadock-server` |
| Browser reports CORS after deployment | Backend is down or wrong origin | Health endpoint, PM2 logs, `CLIENT_ORIGIN` |
| Login succeeds but dashboard returns to login | Cookie domain/security mismatch | Cookie attributes and credentialed requests |
| Google callback succeeds but popup remains | Popup communication/COOP issue | COOP policy and BroadcastChannel flow |
| Razorpay webhook collection stays empty | Wrong Razorpay mode or no delivery | Test/Live mode and Nginx access log |
| Nginx reload fails | Invalid configuration | `sudo nginx -t` |
| Next.js build is killed | Insufficient memory | Swap, `free -h`, Node heap limit |
| S3 startup check fails | DNS, region, bucket, or IAM issue | Bucket hostname/region and EC2 IAM role |

---

# Part XII: CloudFront CDN—the next deployment layer

## 52. What a CDN changes

The current deployment sends application traffic through EC2 and delivers private file access through the existing backend/S3 flow. CloudFront can improve globally distributed file delivery by caching content at edge locations.

CloudFront should not replace authorization. For private DataDock files, use a secure pattern such as:

```text
Authenticated user
   → DataDock API checks ownership/share permission
   → API returns a short-lived CloudFront signed URL or signed cookie
   → Browser downloads through CloudFront
   → CloudFront reads from private S3 through Origin Access Control
```

## 53. Recommended CloudFront configuration

After AWS account approval:

1. Create a single-site CloudFront distribution.
2. Select the private DataDock S3 bucket as the origin.
3. Enable CloudFront access to the private S3 origin using Origin Access Control.
4. Allow CloudFront to update or provide the required S3 bucket policy.
5. Keep direct public S3 access blocked.
6. Do not enable paid WAF features unless their cost and need are understood.
7. Initially use the default CloudFront domain.
8. Test signed access and unauthorized denial.
9. Add a custom CDN hostname later, for example `files.datadock.me`.
10. Request the CloudFront custom-domain certificate in ACM **us-east-1**, because CloudFront requires certificates from that region.
11. Add the DNS record for the CDN hostname.
12. Store CloudFront signing configuration securely.
13. Update the backend delivery service to generate short-lived signed URLs.

CloudFront cache policy must respect the content model. Immutable S3 object keys are ideal because they can be cached for a long time without serving stale replaced content.

## 54. CDN verification checklist

- The S3 bucket remains private.
- Direct S3 object URLs are denied.
- An authorized signed CloudFront URL works.
- An expired signed URL fails.
- A modified signature fails.
- One user cannot receive a signed URL for another user's private file.
- Correct `Content-Type` and `Content-Disposition` headers are preserved.
- Range requests work for media/PDF preview when required.
- CloudFront response headers show cache behavior.
- Cache invalidations are rare because versioned storage keys are used.
- AWS billing and CloudFront usage are monitored.

---

# Part XIII: Future CI/CD

## 55. Desired pipeline

A future GitHub Actions workflow should:

1. Run linting and tests on pull requests.
2. Build the frontend in CI.
3. Deploy only from the protected production branch.
4. Connect to EC2 using a carefully scoped deployment mechanism.
5. Pull or transfer the exact tested revision.
6. Install dependencies with `npm ci`.
7. Build the frontend.
8. Restart PM2 processes.
9. Run frontend and API health checks.
10. Stop and report failure if any step fails.

More mature deployment options include immutable artifacts, CodeDeploy, containers, blue/green deployment, or moving the frontend to S3/CloudFront when its server-rendering requirements are addressed.

Avoid a pipeline that blindly executes unverified commands on every push.

---

# Part XIV: Security and cost hardening

## 56. Security improvements

- Rotate every credential ever exposed in screenshots, chat, logs, shell history, or Git.
- Move secrets to AWS Systems Manager Parameter Store or Secrets Manager.
- Restrict SSH to a trusted IP or use SSM Session Manager.
- Use an EC2 IAM role instead of static AWS keys.
- Scope the Atlas user to the application database.
- Restrict Atlas network access to EC2.
- Keep Redis bound to localhost and enable authentication if exposure changes.
- Patch Ubuntu and dependencies regularly.
- Configure log rotation and retention.
- Monitor failed logins and rate-limit sensitive endpoints.
- Back up important Atlas data and verify restoration.
- Test session invalidation and webhook idempotency.

## 57. Cost controls

- Keep AWS Budgets alerts enabled.
- Review EC2, EBS, Elastic IP, S3, data transfer, CloudFront, WAF, and log charges.
- Stop or delete unused resources deliberately.
- Release unused Elastic IPs.
- Configure S3 lifecycle rules for abandoned multipart uploads when appropriate.
- Do not enable WAF or other paid add-ons without reading the estimate.
- Understand that the Atlas free tier and AWS free plans have limits.

Stopping EC2 does not delete its EBS volume, and some associated resources may continue to incur charges.

---

# Part XV: Deployment completion definition

DataDock's base deployment is complete when all of these are true:

- Atlas is used successfully from EC2.
- Redis, Nginx, and PM2 are active.
- Frontend and backend are online after reboot.
- The Elastic IP is associated.
- DNS resolves for root, `www`, and `api` domains.
- HTTPS is valid and renewable.
- Password and Google login work.
- Session cookies work across the frontend/API subdomains.
- S3 upload and delivery flows work.
- Google Drive import works.
- Razorpay Test Mode checkout and webhook delivery work.
- Nginx records a Razorpay webhook POST returning HTTP 200.
- MongoDB records webhook events idempotently.
- Production smoke tests pass.
- Secrets are not committed.
- Monitoring and cost alerts exist.

CloudFront/CDN and automated CI/CD are subsequent production improvements; they are not prerequisites for calling the current EC2 deployment live.

---

## 58. Mental model to remember

Use this sequence for future deployments:

```text
Prepare application
→ provision managed data services
→ provision compute
→ secure network access
→ install runtime
→ deploy configuration and code
→ build
→ run under a process manager
→ place a reverse proxy in front
→ connect DNS
→ enable HTTPS
→ reconfigure external callbacks/webhooks
→ run smoke tests
→ add monitoring and backups
→ automate with CI/CD
→ add CDN/scaling when justified
```

The key professional habit is verification at every boundary: process, port, proxy, DNS, TLS, cookie, external callback, database, and object storage. When a failure occurs, test these boundaries one at a time instead of changing several systems together.
