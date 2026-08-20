import {
  changePublicShare,
  createPublicShare,
  getPublicShare,
  getPublicShareDownload,
  getPublicSharePreview,
  getPublicChildDownload,
  getPublicChildPreview,
  listPublicShareItems,
  stopPublicShare,
} from "../services/share.service.js";

export async function createShare(req, res, next) {
  try { res.status(201).json({ success: true, data: await createPublicShare({ ownerId: req.user.id, itemId: req.params.itemId }) }); }
  catch (error) { next(error); }
}
export async function updateShare(req, res, next) {
  try { res.status(200).json({ success: true, data: await changePublicShare({ ownerId: req.user.id, itemId: req.params.itemId, changes: req.body ?? {} }) }); }
  catch (error) { next(error); }
}
export async function revokeShare(req, res, next) {
  try { res.status(200).json({ success: true, data: await stopPublicShare({ ownerId: req.user.id, itemId: req.params.itemId }) }); }
  catch (error) { next(error); }
}
export async function openShare(req, res, next) {
  try { res.status(200).json({ success: true, data: await getPublicShare(req.params.token) }); }
  catch (error) { next(error); }
}

export async function previewShare(req, res, next) {
  try { res.status(200).json({ success: true, data: await getPublicSharePreview(req.params.token) }); }
  catch (error) { next(error); }
}

export async function downloadShare(req, res, next) {
  try {
    const download = await getPublicShareDownload(req.params.token);
    res.redirect(download.url);
  } catch (error) { next(error); }
}

export async function listSharedFolder(req, res, next) {
  try {
    const data = await listPublicShareItems({
      token: req.params.token,
      parentId: req.validatedQuery.parentId,
    });
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
}

export async function previewSharedChild(req, res, next) {
  try {
    const data = await getPublicChildPreview({ token: req.params.token, itemId: req.params.itemId });
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
}

export async function downloadSharedChild(req, res, next) {
  try {
    const download = await getPublicChildDownload({ token: req.params.token, itemId: req.params.itemId });
    res.redirect(download.url);
  } catch (error) { next(error); }
}
