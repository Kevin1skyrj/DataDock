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

const kinds = z
  .string()
  .max(200, "File type filter is too long")
  .transform((value) => value.split(",").filter(Boolean))
  .refine(
    (values) => values.length <= 20 && values.every((value) => KINDS.includes(value)),
    { message: "File type filter is invalid" },
  );

const integerQuery = (maximum, message) =>
  z
    .string({ error: message })
    .regex(/^\d+$/, message)
    .transform(Number)
    .refine((value) => Number.isSafeInteger(value) && value <= maximum, {
      message,
    });

export const searchQuerySchema = z
  .object({
    q: z.string().trim().max(200, "Search query is too long").optional(),
    kinds: kinds.optional(),
    date: z.enum(["any", "today", "week", "month", "year"]).optional(),
    size: z.enum(["any", "small", "medium", "large"]).optional(),
    shared: z.enum(["0", "1"]).transform((value) => value === "1").optional(),
    trashed: z.enum(["0", "1"]).transform((value) => value === "1").optional(),
    cursor: integerQuery(10_000_000, "Search cursor is invalid").optional(),
    limit: integerQuery(100, "Search limit must be between 1 and 100")
      .refine((value) => value >= 1, {
        message: "Search limit must be between 1 and 100",
      })
      .optional(),
    sort: z.enum(["name", "kind", "size", "updatedAt", "createdAt"]).optional(),
    direction: z.enum(["asc", "desc"]).optional(),
  })
  .strict();
