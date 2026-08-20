import { z } from "zod";

const objectId = z
  .string({ error: "Invalid user ID" })
  .regex(/^[a-f0-9]{24}$/i, "Invalid user ID");

export const adminUserParamsSchema = z.object({ userId: objectId }).strict();

export const adminUserListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().trim().max(100).optional(),
    role: z.enum(["user", "admin", "owner"]).optional(),
    status: z.enum(["active", "deleted", "all"]).optional(),
  })
  .strict();

export const adminRoleSchema = z
  .object({ role: z.enum(["user", "admin"], { error: "Role must be user or admin" }) })
  .strict();
