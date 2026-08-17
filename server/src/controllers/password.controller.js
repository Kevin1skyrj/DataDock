import {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
} from "../services/otp.service.js";
import {
  changePassword,
  resetPassword,
} from "../services/password.service.js";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "../config/session.js";

export async function requestPasswordReset(req, res, next) {
  try {
    const result = await requestPasswordResetOtp(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function verifyResetOtp(req, res, next) {
  try {
    const result = await verifyPasswordResetOtp(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function completePasswordReset(req, res, next) {
  try {
    const result = await resetPassword(req.body);
    res.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function updatePassword(req, res, next) {
  try {
    const result = await changePassword({
      userId: req.user.id,
      sessionId: req.auth.sessionId,
      input: req.body,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
