import { getNotifications, readAllNotifications } from "../services/notification.service.js";

export async function listNotifications(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      data: await getNotifications({ userId: req.user.id, ...req.query }),
    });
  } catch (error) { next(error); }
}

export async function markAllRead(req, res, next) {
  try {
    res.status(200).json({ success: true, data: await readAllNotifications(req.user.id) });
  } catch (error) { next(error); }
}
