import { searchDrive } from "../services/search.service.js";

function input(req) {
  const query = req.validatedQuery;

  return {
    query: query.q,
    kinds: query.kinds ?? [],
    date: query.date,
    size: query.size,
    sharedOnly: query.shared ?? false,
    includeTrashed: query.trashed ?? false,
    cursor: query.cursor,
    limit: query.limit,
    sortField: query.sort,
    sortDirection: query.direction,
  };
}

export async function searchItems(req, res, next) {
  try {
    const result = await searchDrive({ ownerId: req.user.id, input: input(req) });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function quickSearchItems(req, res, next) {
  try {
    const result = await searchDrive({ ownerId: req.user.id, input: input(req), quick: true });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
