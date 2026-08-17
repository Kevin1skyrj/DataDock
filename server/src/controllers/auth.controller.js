import { loginUser, registerUser } from "../services/auth.service.js";
import {
  resendEmailVerificationOtp,
  verifyEmailOtp,
} from "../services/otp.service.js";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "../config/session.js";
import {
  deleteAllUserSessions,
  deleteCurrentSession,
} from "../services/session.service.js";

export async function register(req, res, next) {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { user, session } = await loginUser(req.body);

    res.cookie(SESSION_COOKIE_NAME, session.token, {
      ...SESSION_COOKIE_OPTIONS,
      expires: session.expiresAt,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const user = await verifyEmailOtp(req.body);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function resendVerification(req, res, next) {
  try {
    const result = await resendEmailVerificationOtp(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    await deleteCurrentSession({
      sessionId: req.auth.sessionId,
      userId: req.user.id,
    });

    res.clearCookie(
      SESSION_COOKIE_NAME,
      SESSION_COOKIE_OPTIONS,
    );

    res.status(200).json({
      success: true,
      data: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutAll(req, res, next) {
  try {
    await deleteAllUserSessions(req.user.id);

    res.clearCookie(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      data: null,
    });
  } catch (error) {
    next(error);
  }
}

export function getCurrentUser(req, res) {
  res.status(200).json({
    success: true,
    data: {
      id: req.user.id.toString(),
      name: req.user.name,
      email: req.user.email,
    },
  });
}
