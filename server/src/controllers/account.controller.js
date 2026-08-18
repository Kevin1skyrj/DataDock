import {
  changeNotificationPreferences,
  changeProfile,
  getNotificationPreferences,
} from "../services/account.service.js";

export async function updateProfile(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      data: await changeProfile({ userId: req.user.id, input: req.body }),
    });
  } catch (error) { next(error); }
}

export async function getPreferences(req, res, next) {
  try {
    res.status(200).json({ success: true, data: await getNotificationPreferences(req.user.id) });
  } catch (error) { next(error); }
}

export async function updatePreferences(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      data: await changeNotificationPreferences({ userId: req.user.id, input: req.body }),
    });
  } catch (error) { next(error); }
}
