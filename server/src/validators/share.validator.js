import { z } from "zod";

const objectId = z
  .string({ error: "Invalid item ID" })
  .regex(/^[a-f0-9]{24}$/i, "Invalid item ID");

const expiresAt = z
  .string({ error: "Share expiry is invalid" })
  .datetime({ offset: true, message: "Share expiry is invalid" })
  .refine(
    (value) => {
      const time = new Date(value).getTime();
      return time > Date.now() && time <= Date.now() + 365 * 24 * 60 * 60 * 1000;
    },
    { message: "Expiry must be within the next 365 days" },
  )
  .nullable();

export const shareItemParamsSchema = z.object({ itemId: objectId }).strict();

export const updateShareSchema = z
  .object({
    access: z.enum(["view", "comment", "edit"], {
      error: "Invalid share permission",
    }).optional(),
    scope: z.enum(["link", "private"], {
      error: "Invalid share scope",
    }).optional(),
    expiresAt: expiresAt.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Choose at least one share setting to update",
  });

export const sharedFolderQuerySchema = z
  .object({ parentId: objectId.optional() })
  .strict();
