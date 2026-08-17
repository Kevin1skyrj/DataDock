import {
  changePublicShare,
  createPublicShare,
  getPublicShare,
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
