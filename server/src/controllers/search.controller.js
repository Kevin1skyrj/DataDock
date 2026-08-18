import { searchDrive } from "../services/search.service.js";

function input(req) {
  return {
    query: req.query.q,
    kinds: typeof req.query.kinds === "string" ? req.query.kinds.split(",") : [],
    date: req.query.date,
    size: req.query.size,
    sharedOnly: req.query.shared === "1",
    includeTrashed: req.query.trashed === "1",
    cursor: req.query.cursor,
    limit: req.query.limit,
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
