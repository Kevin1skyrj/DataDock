import { OAuth2Client } from "google-auth-library";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_DRIVE_CALLBACK_URL;

if (!redirectUri) {
  throw new Error("GOOGLE_DRIVE_CALLBACK_URL is missing from environment variables");
}

export const googleDriveOAuthClient = new OAuth2Client({
  clientId,
  clientSecret,
  redirectUri,
});

export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
export const GOOGLE_DRIVE_STATE_COOKIE = "google_drive_oauth_state";
export const GOOGLE_DRIVE_VERIFIER_COOKIE = "google_drive_oauth_verifier";
export const GOOGLE_DRIVE_COOKIE_OPTIONS = {
  httpOnly: true,
  signed: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/v1/imports/google-drive",
  maxAge: 10 * 60 * 1000,
};
