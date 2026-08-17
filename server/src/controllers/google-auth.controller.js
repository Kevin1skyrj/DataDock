import {
  GOOGLE_OAUTH_COOKIE_OPTIONS,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
} from "../config/google-oauth.js";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "../config/session.js";
import { AppError } from "../errors/app-error.js";
import {
  createGoogleAuthorizationRequest,
  getGoogleIdentity,
  loginWithGoogle,
} from "../services/google-auth.service.js";

function clearGoogleOAuthCookies(res) {
  const cookieOptions = { ...GOOGLE_OAUTH_COOKIE_OPTIONS };
  delete cookieOptions.maxAge;

  res.clearCookie(GOOGLE_OAUTH_STATE_COOKIE, cookieOptions);
  res.clearCookie(GOOGLE_OAUTH_VERIFIER_COOKIE, cookieOptions);
}

export async function startGoogleLogin(req, res, next) {
  try {
    const { authorizationUrl, state, codeVerifier } =
      await createGoogleAuthorizationRequest();

    res.cookie(
      GOOGLE_OAUTH_STATE_COOKIE,
      state,
      GOOGLE_OAUTH_COOKIE_OPTIONS,
    );

    res.cookie(
      GOOGLE_OAUTH_VERIFIER_COOKIE,
      codeVerifier,
      GOOGLE_OAUTH_COOKIE_OPTIONS,
    );

    res.redirect(authorizationUrl);
  } catch (error) {
    next(error);
  }
}

export async function completeGoogleLogin(req, res, next) {
  const expectedState = req.signedCookies[GOOGLE_OAUTH_STATE_COOKIE];
  const codeVerifier = req.signedCookies[GOOGLE_OAUTH_VERIFIER_COOKIE];

  clearGoogleOAuthCookies(res);

  try {
    const { code, state, error } = req.query;

    if (error) {
      throw new AppError("Google login was cancelled", {
        statusCode: 400,
        code: "google-login-cancelled",
      });
    }

    if (
      typeof code !== "string" ||
      typeof state !== "string" ||
      typeof expectedState !== "string" ||
      typeof codeVerifier !== "string" ||
      state !== expectedState
    ) {
      throw new AppError("Google login request is invalid or expired", {
        statusCode: 400,
        code: "google-oauth-invalid",
      });
    }

    const identity = await getGoogleIdentity({ code, codeVerifier });
    const { user, session } = await loginWithGoogle(identity);

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
