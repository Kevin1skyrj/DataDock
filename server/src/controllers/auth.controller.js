import { loginUser, registerUser } from "../services/auth.service.js";
const SESSION_COOKIE_NAME = "datadock_session";
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
      httpOnly: true,
      signed: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: session.expiresAt,
      path: "/",
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}