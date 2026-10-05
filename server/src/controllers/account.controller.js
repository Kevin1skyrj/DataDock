import {
  changeNotificationPreferences,
  changeProfile,
  getNotificationPreferences,
  permanentlyDeleteAccount,
} from "../services/account.service.js";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from "../config/session.js";

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

export async function deleteAccount(req, res, next) {
  try {
    const data = await permanentlyDeleteAccount({
      userId: req.user.id,
      password: req.body.password,
    });
    res.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
}
