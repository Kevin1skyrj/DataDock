import { getDatabase } from "../config/db.js";

const COLLECTION = "items";

export async function searchUserItems({
  ownerId,
  namePattern,
  filters,
  skip,
  limit,
  sortField,
  sortDirection,
}) {
  const textMatch = {
    ownerId,
    ...(filters.includeTrashed
      ? { trashedAt: { $ne: null } }
      : { trashedAt: null }),
    ...(namePattern ? { normalizedName: { $regex: namePattern } } : {}),
  };
  const filteredMatch = {
    ...(filters.kinds.length ? { kind: { $in: filters.kinds } } : {}),
    ...(filters.sharedOnly ? { "share.token": { $type: "string" } } : {}),
    ...(filters.updatedAfter ? { updatedAt: { $gte: filters.updatedAfter } } : {}),
    ...(filters.minSize != null || filters.maxSize != null
      ? {
          type: "file",
          size: {
            ...(filters.minSize != null ? { $gte: filters.minSize } : {}),
            ...(filters.maxSize != null ? { $lte: filters.maxSize } : {}),
          },
        }
      : {}),
  };
  const sort = sortField === "name"
    ? { type: -1, normalizedName: sortDirection, _id: sortDirection }
    : sortField === "kind"
      ? { type: -1, kind: sortDirection, normalizedName: 1 }
      : sortField
        ? { [sortField]: sortDirection, _id: sortDirection }
        : { relevance: -1, updatedAt: -1, _id: -1 };

  const [result] = await getDatabase()
    .collection(COLLECTION)
    .aggregate([
      { $match: textMatch },
      {
        $facet: {
          kindFacets: [
            { $group: { _id: "$kind", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
          ],
          items: [
            { $match: filteredMatch },
            {
              $addFields: {
                relevance: namePattern
                  ? {
                      $switch: {
                        branches: [
                          { case: { $eq: ["$normalizedName", namePattern] }, then: 100 },
                          {
                            case: {
                              $regexMatch: {
                                input: "$normalizedName",
                                regex: `^${namePattern}`,
                              },
                            },
                            then: 80,
                          },
                          {
                            case: {
                              $regexMatch: {
                                input: "$normalizedName",
                                regex: `(^|[^a-z0-9])${namePattern}`,
                              },
                            },
                            then: 60,
                          },
                        ],
                        default: 40,
                      },
                    }
                  : 1,
              },
            },
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
            { $unset: "relevance" },
          ],
          count: [{ $match: filteredMatch }, { $count: "total" }],
        },
      },
    ])
    .toArray();

  return {
    items: result?.items ?? [],
    total: result?.count?.[0]?.total ?? 0,
    kinds: (result?.kindFacets ?? []).map((entry) => ({
      kind: entry._id ?? "other",
      count: entry.count,
    })),
  };
}
