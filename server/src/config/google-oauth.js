import { OAuth2Client } from "google-auth-library";

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

if (!GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is missing");
}

if (!clientSecret) {
  throw new Error("GOOGLE_CLIENT_SECRET is missing");
}

if (!callbackUrl) {
  throw new Error("GOOGLE_CALLBACK_URL is missing");
}

export const googleOAuthClient = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret,
  redirectUri: callbackUrl,
});

export const GOOGLE_OAUTH_SCOPES = ["openid", "email", "profile"];

export const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";
export const GOOGLE_OAUTH_VERIFIER_COOKIE = "google_oauth_verifier";

export const GOOGLE_OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  signed: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/v1/auth/google",
  maxAge: 10 * 60 * 1000,
};
