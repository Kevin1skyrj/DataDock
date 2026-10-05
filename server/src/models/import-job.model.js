import { getDatabase } from "../config/db.js";

const COLLECTION = "importJobs";

export async function createImportJobIndexes() {
  const jobs = getDatabase().collection(COLLECTION);
  await jobs.createIndex({ jobId: 1 }, { unique: true });
  await jobs.createIndex({ status: 1, createdAt: 1 });
  await jobs.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

export async function insertImportJob({ jobId, ownerId, fileIds, parentId }) {
  const now = new Date();
  const job = {
    jobId,
    ownerId,
    fileIds,
    parentId,
    status: "queued",
    progress: 0,
    imported: 0,
    total: null,
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
  };
  await getDatabase().collection(COLLECTION).insertOne(job);
  return job;
}

export function findImportJob({ ownerId, jobId }) {
  return getDatabase().collection(COLLECTION).findOne({ ownerId, jobId });
}

export function updateImportJob(jobId, changes) {
  return getDatabase().collection(COLLECTION).updateOne(
    { jobId },
    { $set: { ...changes, updatedAt: new Date() } },
  );
}

export function recoverInterruptedImportJobs() {
  return getDatabase().collection(COLLECTION).updateMany(
    { status: "running" },
    { $set: { status: "queued", updatedAt: new Date() } },
  );
}

export function claimNextImportJob() {
  return getDatabase().collection(COLLECTION).findOneAndUpdate(
    { status: "queued" },
    {
      $set: { status: "running", updatedAt: new Date() },
      $inc: { attempts: 1 },
    },
    { sort: { createdAt: 1 }, returnDocument: "after" },
  );
}
