import {
  completeUpload as completeUploadService,
  createUpload as createUploadService,
} from "../services/upload.service.js";

export async function createUpload(req, res, next) {
  try {
    const upload = await createUploadService({
      ownerId: req.user.id,
      input: req.body,
    });
    res.status(201).json({ success: true, data: upload });
  } catch (error) {
    next(error);
  }
}

export async function completeUpload(req, res, next) {
  try {
    const file = await completeUploadService({
      ownerId: req.user.id,
      uploadId: req.params.uploadId,
    });
    res.status(201).json({ success: true, data: file });
  } catch (error) {
    next(error);
  }
}
