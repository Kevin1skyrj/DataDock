# DataDock operations

## Readiness

Use `GET /health` for deployment health checks. A successful response means the
API can reach MongoDB, Redis and the configured S3 bucket. Do not treat a PM2
`online` state alone as healthy.

## Database indexes

Startup creates required indexes, including one active item name per user and
folder, unique share/storage identifiers, subscription/webhook idempotency,
notification pagination and persistent import-job recovery.

If startup fails while creating `unique_active_name_per_folder`, inspect and
resolve pre-existing duplicate active names before retrying deployment. Do not
drop the index as a workaround.

## Imports

Google Drive import jobs are stored in MongoDB. Jobs interrupted by a process
restart are returned to the queue on startup. Imported records carry job/source
identity and S3 uses a deterministic job key, making resumed work idempotent.
Completed job records expire automatically after seven days.

## Account deletion

Deletion intentionally fails closed. If Razorpay cancellation or S3 cleanup
fails, the user record is retained so cleanup can be retried. Review server
logs before retrying; never manually delete the MongoDB user first because that
would remove the ownership map needed for object cleanup.

## Upload and billing concurrency

Redis locks serialize final quota checks and subscription creation per user.
Redis is therefore a required dependency, not an optional cache. The item
unique index remains the final protection against concurrent duplicate names.

## Deployment smoke check

After deployment verify, in order:

1. `/health` returns HTTP 200 and every dependency reports `ok`.
2. Login persists across a second browser tab.
3. A small upload completes and immediately appears.
4. Trash and restore a folder containing a file.
5. Open Billing and confirm the intended Razorpay mode before accepting money.
6. Start an import and confirm its job status advances.

