import { getStorageSummary as getStorageSummaryService } from "../services/storage.service.js";

export async function getStorageSummary(req, res, next) {
  try {
    const summary = await getStorageSummaryService(req.user.id);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}
