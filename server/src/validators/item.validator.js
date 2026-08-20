import { z } from "zod";

const KINDS = [
  "folder",
  "pdf",
  "image",
  "video",
  "audio",
  "doc",
  "sheet",
  "code",
  "archive",
  "other",
];

const objectId = z
  .string({ error: "Invalid item ID" })
  .regex(/^[a-f0-9]{24}$/i, "Invalid item ID");

const parentId = z
  .string({ error: "Invalid parent folder ID" })
  .regex(/^[a-f0-9]{24}$/i, "Invalid parent folder ID")
  .nullable();

const name = (missingMessage) =>
  z
    .string({ error: missingMessage })
    .trim()
    .min(1, missingMessage)
    .max(255, "Item name cannot exceed 255 characters");

const itemIds = z
  .array(objectId, { error: "At least one item ID is required" })
  .min(1, "At least one item ID is required")
  .max(100, "A maximum of 100 items can be changed at once");

const kinds = z
  .string()
  .max(200, "File type filter is too long")
  .transform((value) => value.split(",").filter(Boolean))
  .refine(
    (values) => values.length <= 20 && values.every((value) => KINDS.includes(value)),
    { message: "File type filter is invalid" },
  );

export const itemParamsSchema = z.object({ itemId: objectId }).strict();

export const folderParamsSchema = z
  .object({
    folderId: z
      .string({ error: "Invalid folder ID" })
      .regex(/^[a-f0-9]{24}$/i, "Invalid folder ID"),
  })
  .strict();

export const itemListQuerySchema = z
  .object({
    parentId: parentId.optional(),
    view: z.enum(["folder", "recent", "starred", "shared", "trash"]).optional(),
    kinds: kinds.optional(),
    q: z.string().trim().max(200, "Search query is too long").optional(),
    sort: z
      .enum(["name", "kind", "size", "updatedAt", "createdAt", "openedAt", "trashedAt"])
      .optional(),
    direction: z.enum(["asc", "desc"]).optional(),
  })
  .strict();

export const folderQuerySchema = z.object({ parentId: parentId.optional() }).strict();

export const createFolderSchema = z
  .object({
    name: name("Folder name is required"),
    parentId: parentId.optional(),
  })
  .strict();

export const renameItemSchema = z
  .object({ name: name("Item name is required") })
  .strict();

export const itemIdsSchema = z.object({ itemIds }).strict();

export const starItemsSchema = z
  .object({
    itemIds,
    starred: z.boolean({ error: "Starred must be true or false" }),
  })
  .strict();

export const moveItemsSchema = z
  .object({
    itemIds,
    parentId,
  })
  .strict();
