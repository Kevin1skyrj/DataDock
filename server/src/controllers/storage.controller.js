import {
  getLargestFiles as getLargestFilesService,
  getStorageBreakdown as getStorageBreakdownService,
  getStorageSummary as getStorageSummaryService,
} from "../services/storage.service.js";

export async function getStorageSummary(req, res, next) {
  try {
    const summary = await getStorageSummaryService(req.user.id);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}

export async function getStorageBreakdown(req, res, next) {
  try {
    const breakdown = await getStorageBreakdownService(req.user.id);
    res.status(200).json({ success: true, data: breakdown });
  } catch (error) {
    next(error);
  }
}

export async function getLargestFiles(req, res, next) {
  try {
    const files = await getLargestFilesService({
      ownerId: req.user.id,
      limit: Number(req.query.limit),
    });
    res.status(200).json({ success: true, data: files });
  } catch (error) {
    next(error);
  }
}
