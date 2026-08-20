import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z
      .string({ error: "Name is required" })
      .trim()
      .min(2, "Name must be between 2 and 80 characters")
      .max(80, "Name must be between 2 and 80 characters"),
  })
  .strict();

export const notificationPreferencesSchema = z
  .object({
    uploads: z.boolean().optional(),
    sharing: z.boolean().optional(),
    comments: z.boolean().optional(),
    security: z.boolean().optional(),
    storage: z.boolean().optional(),
    product: z.boolean().optional(),
  })
  .strict()
  .refine((preferences) => Object.keys(preferences).length > 0, {
    message: "Choose at least one notification preference to update",
  });
