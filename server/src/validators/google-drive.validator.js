import { z } from "zod";

const driveId = z
  .string({ error: "Invalid Google Drive item ID" })
  .trim()
  .min(1, "Invalid Google Drive item ID")
  .max(200, "Invalid Google Drive item ID")
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid Google Drive item ID");

const objectId = z
  .string({ error: "Invalid destination folder ID" })
  .regex(/^[a-f0-9]{24}$/i, "Invalid destination folder ID");

export const googleDriveItemsQuerySchema = z
  .object({ folderId: driveId.optional().default("root") })
  .strict();

export const googleDriveImportSchema = z
  .object({
    fileIds: z
      .array(driveId, { error: "Choose at least one Google Drive item" })
      .min(1, "Choose at least one Google Drive item")
      .max(100, "You can import at most 100 items at once"),
    parentId: objectId.nullable().optional().default(null),
  })
  .strict();

export const googleDriveJobParamsSchema = z
  .object({ jobId: z.uuid({ error: "Invalid import job ID" }) })
  .strict();
