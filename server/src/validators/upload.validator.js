import { z } from "zod";

const objectId = z
  .string({ error: "Invalid parent folder ID" })
  .regex(/^[a-f0-9]{24}$/i, "Invalid parent folder ID");

export const createUploadSchema = z
  .object({
    name: z
      .string({ error: "File name is required" })
      .trim()
      .min(1, "File name is required")
      .max(255, "File name cannot exceed 255 characters"),
    size: z
      .number({ error: "File size must be a positive integer" })
      .int("File size must be a positive integer")
      .positive("File size must be a positive integer")
      .safe("File size must be a positive integer"),
    mimeType: z
      .string({ error: "MIME type is invalid" })
      .trim()
      .min(1, "MIME type is invalid")
      .max(255, "MIME type is invalid")
      .toLowerCase()
      .optional(),
    parentId: objectId.nullable().optional(),
  })
  .strict();

export const completeUploadParamsSchema = z
  .object({
    uploadId: z
      .string({ error: "Upload ID is invalid" })
      .uuid("Upload ID is invalid"),
  })
  .strict();
